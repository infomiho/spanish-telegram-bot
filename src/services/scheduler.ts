import cron from "node-cron";
import type { Bot } from "grammy";
import type { BotContext } from "../types/index.js";
import { getUsersDueForPrompt, updateLastPrompt } from "../db/index.js";
import { fetchRandomHeadline } from "./news.js";
import { generatePracticePrompt } from "./openai.js";

let scheduledTask: cron.ScheduledTask | null = null;

export function startScheduler(bot: Bot<BotContext>): void {
  if (scheduledTask) {
    console.log("Scheduler already running");
    return;
  }

  // Run every minute to check for users due their daily prompt
  scheduledTask = cron.schedule("* * * * *", async () => {
    await sendDailyPrompts(bot);
  });

  console.log("Scheduler started - checking every minute for users due prompts");
}

export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("Scheduler stopped");
  }
}

async function sendDailyPrompts(bot: Bot<BotContext>): Promise<void> {
  const now = new Date();
  const currentHour = now.getUTCHours();

  try {
    const users = await getUsersDueForPrompt(currentHour);

    if (users.length === 0) {
      return;
    }

    console.log(
      `Sending daily prompts to ${users.length} user(s) at hour ${currentHour}`
    );

    for (const user of users) {
      try {
        const headline = await fetchRandomHeadline();
        const prompt = await generatePracticePrompt(headline.title, user.difficulty);

        await updateLastPrompt(user.chat_id, prompt);

        await bot.api.sendMessage(
          user.chat_id,
          `☀️ **Good morning! Time for your Spanish practice.**

📝 **Today's Prompt:**
${prompt}

_Respond with a voice message in Spanish!_`,
          { parse_mode: "Markdown" }
        );

        console.log(`Sent daily prompt to user ${user.chat_id}`);
      } catch (error) {
        console.error(`Failed to send prompt to user ${user.chat_id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in scheduler:", error);
  }
}
