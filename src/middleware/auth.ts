import type { NextFunction } from "grammy";
import type { BotContext } from "../types/index.js";
import { getUser } from "../db/index.js";

export async function requireUser(
  ctx: BotContext,
  next: NextFunction
): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    await ctx.reply("Sorry, I couldn't identify your chat. Please try again.");
    return;
  }

  const user = await getUser(chatId);
  if (!user) {
    await ctx.reply("Please use /start first to register.");
    return;
  }

  ctx.chatId = chatId;
  ctx.user = user;

  await next();
}
