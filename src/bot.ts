import { Bot } from "grammy";
import { hydrateFiles } from "@grammyjs/files";
import type { BotContext } from "./types/index.js";
import { requireUser } from "./middleware/auth.js";
import { handleStart, handleNew, handleSettings, handleHelp } from "./handlers/commands.js";
import { handleVoiceMessage } from "./handlers/voice.js";
import { handleCallback } from "./handlers/callback.js";

export function createBot(token: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(token);

  // Configure file downloads
  bot.api.config.use(hydrateFiles(token));

  // Command handlers (no auth needed for start/help)
  bot.command("start", handleStart);
  bot.command("help", handleHelp);

  // Commands that require user registration
  bot.command("new", requireUser, handleNew);
  bot.command("settings", requireUser, handleSettings);

  // Voice message handler (requires registration)
  bot.on("message:voice", requireUser, handleVoiceMessage);

  // Callback query handler for inline keyboards (requires registration)
  bot.on("callback_query:data", requireUser, handleCallback);

  // Error handler
  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  return bot;
}
