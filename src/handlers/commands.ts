import type { BotContext } from "../types/index.js";
import { createUser, updateLastPrompt } from "../db/index.js";
import { fetchRandomTopic } from "../services/topics.js";
import { generatePracticePrompt } from "../services/openai.js";
import { InlineKeyboard } from "grammy";
import { createSettingsKeyboard } from "./shared.js";

export async function handleStart(ctx: BotContext): Promise<void> {
  const chatId = ctx.chat?.id;
  const username = ctx.from?.username || null;

  if (!chatId) {
    await ctx.reply("Sorry, I couldn't identify your chat. Please try again.");
    return;
  }

  await createUser({ chat_id: chatId, username });

  await ctx.reply(
    `Welcome to Spanish Speaking Practice! 🇪🇸

I'll help you practice speaking Spanish every day. Here's how it works:

1. Each morning, I'll send you an English prompt
2. You respond with a voice message in Spanish
3. I'll give you feedback on your pronunciation, grammar, and suggest improvements

Commands:
/new - Get a new practice prompt now
/settings - Change your preferences
/help - Show this message

Let's get started! Use /new to get your first prompt.`
  );
}

export async function handleNew(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser!;
  const chatId = ctx.chatId!;

  await ctx.reply("Generating a new practice prompt for you...");

  try {
    const topic = await fetchRandomTopic();
    const prompt = await generatePracticePrompt(topic.text, user.difficulty);

    await updateLastPrompt(chatId, prompt);

    await ctx.reply(
      `📝 **Practice Prompt**

${prompt}

_Respond with a voice message in Spanish!_`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error generating prompt:", error);
    await ctx.reply(
      "Sorry, I had trouble generating a prompt. Please try again with /new"
    );
  }
}

export async function handleSettings(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser!;

  const subscriptionStatus = user.is_subscribed
    ? "✅ Subscribed to daily messages"
    : "⏸️ Daily messages paused";

  await ctx.reply(
    `⚙️ **Your Settings**

• Daily prompt time: ${user.preferred_hour}:00 ${user.timezone}
• Difficulty level: ${user.difficulty}
• Timezone: ${user.timezone}
• ${subscriptionStatus}

What would you like to change?`,
    { parse_mode: "Markdown", reply_markup: createSettingsKeyboard(user.is_subscribed) }
  );
}

export async function handleHelp(ctx: BotContext): Promise<void> {
  await ctx.reply(
    `🇪🇸 **Spanish Speaking Practice Bot**

**How to use:**
1. I send you a prompt in English
2. Record a voice message responding in Spanish
3. I'll analyze your response and give feedback

**Commands:**
/new - Get a new practice prompt
/settings - Change preferences (time, difficulty, pause/resume daily messages)
/help - Show this message

**Tips for best results:**
• Speak clearly and at a natural pace
• Try to answer the full prompt
• Don't worry about mistakes - that's how we learn!

_Powered by AI for personalized feedback_`,
    { parse_mode: "Markdown" }
  );
}
