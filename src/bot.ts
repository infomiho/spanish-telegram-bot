import { Bot } from "grammy";
import { hydrateFiles } from "@grammyjs/files";
import type { BotContext } from "./types/index.js";
import { handleStart, handleNew, handleSettings, handleHelp } from "./handlers/commands.js";
import { handleVoiceMessage } from "./handlers/voice.js";
import { handleCallback } from "./handlers/callback.js";

export function createBot(token: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(token);

  // Configure file downloads
  bot.api.config.use(hydrateFiles(token));

  // Command handlers
  bot.command("start", handleStart);
  bot.command("new", handleNew);
  bot.command("settings", handleSettings);
  bot.command("help", handleHelp);

  // Voice message handler
  bot.on("message:voice", handleVoiceMessage);

  // Callback query handler for inline keyboards
  bot.on("callback_query:data", handleCallback);

  // Error handler
  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  return bot;
}
