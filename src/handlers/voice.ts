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
    processingMessages.delete(messageId);
    await ctx.reply("Please use /start first to register.");
    return;
  }

  if (!user.last_prompt) {
    processingMessages.delete(messageId);
    await ctx.reply(
      "You don't have an active prompt. Use /new to get a practice prompt first!"
    );
    return;
  }

  const voice = ctx.message?.voice;
  if (!voice) {
    processingMessages.delete(messageId);
    await ctx.reply("I couldn't find the voice message. Please try again.");
    return;
  }

  // Send immediate acknowledgment, then process in background
  await ctx.reply("🎧 Processing your voice message...");

  // Process in background - don't await
  processVoiceInBackground(ctx, user.last_prompt, user.difficulty, messageId);
}

async function processVoiceInBackground(
  ctx: BotContext,
  lastPrompt: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  messageId: number
): Promise<void> {
  try {
    const file = await ctx.getFile();
    const filePath = await file.download();

    const transcription = await transcribeAudio(filePath);

    if (!transcription || transcription.trim().length === 0) {
      await ctx.reply(
        "I couldn't hear any speech in that recording. Please try again and speak clearly."
      );
      return;
    }

    const analysis = await analyzeSpanishResponse(
      lastPrompt,
      transcription,
      difficulty
    );

    await sendAnalysisResponse(ctx, analysis);
  } catch (error) {
    console.error("Error processing voice message:", error);
    await ctx.reply(
      "Sorry, I had trouble processing your voice message. Please try again."
    );
  } finally {
    // Keep in set for a while to handle any late retries
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
