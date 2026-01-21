import type { BotContext, Difficulty } from "../types/index.js";
import { updateUserSettings } from "../db/index.js";
import { InlineKeyboard } from "grammy";
import { createSettingsKeyboard } from "./shared.js";

export async function handleCallback(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const [category, action] = data.split(":");

  switch (category) {
    case "settings":
      await handleSettingsCallback(ctx, action);
      break;
    case "time":
      await handleTimeCallback(ctx, action);
      break;
    case "difficulty":
      await handleDifficultyCallback(ctx, action);
      break;
    case "timezone":
      await handleTimezoneCallback(ctx, action);
      break;
    default:
      await ctx.answerCallbackQuery("Unknown action");
  }
}

async function handleSettingsCallback(
  ctx: BotContext,
  action: string
): Promise<void> {
  switch (action) {
    case "time":
      await showTimeOptions(ctx);
      break;
    case "difficulty":
      await showDifficultyOptions(ctx);
      break;
    case "timezone":
      await showTimezoneOptions(ctx);
      break;
    case "back":
      await showMainSettings(ctx);
      break;
  }
  await ctx.answerCallbackQuery();
}

async function showMainSettings(ctx: BotContext): Promise<void> {
  const user = ctx.user!;

  await ctx.editMessageText(
    `⚙️ **Your Settings**

• Daily prompt time: ${user.preferred_hour}:00 ${user.timezone}
• Difficulty level: ${user.difficulty}
• Timezone: ${user.timezone}

What would you like to change?`,
    { parse_mode: "Markdown", reply_markup: createSettingsKeyboard() }
  );
}

async function showTimeOptions(ctx: BotContext): Promise<void> {
  const keyboard = new InlineKeyboard()
    .text("6:00 AM", "time:6")
    .text("7:00 AM", "time:7")
    .text("8:00 AM", "time:8")
    .row()
    .text("9:00 AM", "time:9")
    .text("10:00 AM", "time:10")
    .text("12:00 PM", "time:12")
    .row()
    .text("← Back", "settings:back");

  await ctx.editMessageText("🕐 When would you like to receive your daily prompt?", {
    reply_markup: keyboard,
  });
}

async function showDifficultyOptions(ctx: BotContext): Promise<void> {
  const keyboard = new InlineKeyboard()
    .text("🌱 Beginner", "difficulty:beginner")
    .row()
    .text("🌿 Intermediate", "difficulty:intermediate")
    .row()
    .text("🌳 Advanced", "difficulty:advanced")
    .row()
    .text("← Back", "settings:back");

  await ctx.editMessageText(
    `📊 **Select your Spanish level:**

🌱 **Beginner** - Simple vocabulary, present tense
🌿 **Intermediate** - Past tenses, opinions, descriptions
🌳 **Advanced** - Subjunctive, conditionals, nuanced topics`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
}

async function showTimezoneOptions(ctx: BotContext): Promise<void> {
  const keyboard = new InlineKeyboard()
    .text("🇺🇸 US East (EST)", "timezone:America/New_York")
    .row()
    .text("🇺🇸 US West (PST)", "timezone:America/Los_Angeles")
    .row()
    .text("🇬🇧 UK (GMT)", "timezone:Europe/London")
    .row()
    .text("🇪🇺 Central EU (CET)", "timezone:Europe/Berlin")
    .row()
    .text("🌏 UTC", "timezone:UTC")
    .row()
    .text("← Back", "settings:back");

  await ctx.editMessageText("🌍 Select your timezone:", {
    reply_markup: keyboard,
  });
}

async function handleTimeCallback(ctx: BotContext, hour: string): Promise<void> {
  const chatId = ctx.chatId!;

  const preferredHour = parseInt(hour, 10);
  await updateUserSettings(chatId, { preferred_hour: preferredHour });

  await ctx.answerCallbackQuery(`Daily prompt time set to ${preferredHour}:00`);
  await ctx.editMessageText(
    `✅ Your daily prompt will now arrive at ${preferredHour}:00\n\nUse /settings to make more changes.`
  );
}

async function handleDifficultyCallback(
  ctx: BotContext,
  level: string
): Promise<void> {
  const chatId = ctx.chatId!;

  const difficulty = level as Difficulty;
  await updateUserSettings(chatId, { difficulty });

  const labels: Record<Difficulty, string> = {
    beginner: "🌱 Beginner",
    intermediate: "🌿 Intermediate",
    advanced: "🌳 Advanced",
  };

  await ctx.answerCallbackQuery(`Difficulty set to ${labels[difficulty]}`);
  await ctx.editMessageText(
    `✅ Difficulty level set to ${labels[difficulty]}\n\nUse /settings to make more changes.`
  );
}

async function handleTimezoneCallback(
  ctx: BotContext,
  timezone: string
): Promise<void> {
  const chatId = ctx.chatId!;

  await updateUserSettings(chatId, { timezone });

  await ctx.answerCallbackQuery(`Timezone set to ${timezone}`);
  await ctx.editMessageText(
    `✅ Timezone set to ${timezone}\n\nUse /settings to make more changes.`
  );
}
