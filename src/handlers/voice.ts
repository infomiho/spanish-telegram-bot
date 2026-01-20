import type { BotContext, SpanishAnalysis } from "../types/index.js";
import { getUser } from "../db/index.js";
import { transcribeAudio } from "../services/elevenlabs.js";
import { analyzeSpanishResponse } from "../services/openai.js";

// Track messages being processed to prevent duplicates from Telegram retries
const processingMessages = new Set<number>();

export async function handleVoiceMessage(ctx: BotContext): Promise<void> {
  const chatId = ctx.chat?.id;
  const messageId = ctx.message?.message_id;
  if (!chatId || !messageId) return;

  // Prevent duplicate processing
  if (processingMessages.has(messageId)) {
    console.log(`Message ${messageId} already being processed, skipping`);
    return;
  }
  processingMessages.add(messageId);

  const user = await getUser(chatId);
  if (!user) {
    await ctx.reply("Please use /start first to register.");
    return;
  }

  if (!user.last_prompt) {
    await ctx.reply(
      "You don't have an active prompt. Use /new to get a practice prompt first!"
    );
    return;
  }

  const voice = ctx.message?.voice;
  if (!voice) {
    await ctx.reply("I couldn't find the voice message. Please try again.");
    return;
  }

  await ctx.reply("🎧 Processing your voice message...");

  try {
    const file = await ctx.getFile();
    const filePath = await file.download();

    await ctx.reply("📝 Transcribing your Spanish...");

    const transcription = await transcribeAudio(filePath);

    if (!transcription || transcription.trim().length === 0) {
      await ctx.reply(
        "I couldn't hear any speech in that recording. Please try again and speak clearly."
      );
      return;
    }

    await ctx.reply("🤔 Analyzing your response...");

    const analysis = await analyzeSpanishResponse(
      user.last_prompt,
      transcription,
      user.difficulty
    );

    await sendAnalysisResponse(ctx, analysis);
  } catch (error) {
    console.error("Error processing voice message:", error);
    await ctx.reply(
      "Sorry, I had trouble processing your voice message. Please try again."
    );
  } finally {
    // Clean up after processing (with delay to handle late retries)
    setTimeout(() => processingMessages.delete(messageId), 60000);
  }
}

async function sendAnalysisResponse(
  ctx: BotContext,
  analysis: SpanishAnalysis
): Promise<void> {
  let response = `📝 **What I heard:**
"${analysis.transcription}"

`;

  if (analysis.mistakes.length > 0) {
    response += `❌ **Mistakes:**\n`;
    for (const mistake of analysis.mistakes) {
      response += `• ${mistake}\n`;
    }
    response += "\n";
  } else {
    response += "✨ **Great job!** No significant mistakes found.\n\n";
  }

  response += `✅ **Corrected version:**
"${analysis.corrections}"

💡 **Ideal response:**
"${analysis.idealResponse}"

📚 **Tips for improvement:**\n`;

  for (const tip of analysis.tips) {
    response += `• ${tip}\n`;
  }

  response += "\n_Use /new for another practice prompt!_";

  await ctx.reply(response, { parse_mode: "Markdown" });
}
