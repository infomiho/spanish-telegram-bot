import express, { type ErrorRequestHandler } from "express";
import { webhookCallback } from "grammy";
import { createBot } from "./bot.js";
import { initializeDatabase, closeDatabase } from "./db/index.js";
import { startScheduler, stopScheduler } from "./services/scheduler.js";

// Catch unhandled errors
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN;
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

function getBotToken(): string {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error("BOT_TOKEN environment variable is required");
    process.exit(1);
  }
  return token;
}

async function main(): Promise<void> {
  const BOT_TOKEN = getBotToken();

  // Initialize database
  await initializeDatabase();

  // Create bot
  const bot = createBot(BOT_TOKEN);

  // Start scheduler
  startScheduler(bot);

  if (NODE_ENV === "production" && WEBHOOK_DOMAIN) {
    // Production: Use webhooks
    const app = express();

    // Request logging
    app.use((req, _res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });

    // Parse JSON bodies
    app.use(express.json());

    // Health check endpoint
    app.get("/health", (_req, res) => {
      res.json({ status: "ok" });
    });

    // Webhook endpoint
    const webhookPath = `/webhook/${BOT_TOKEN}`;
    app.use(webhookPath, webhookCallback(bot, "express"));

    // Error handler
    const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
      console.error("Express error:", err);
      res.status(500).json({ error: "Internal server error" });
    };
    app.use(errorHandler);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Set webhook
    const webhookUrl = `https://${WEBHOOK_DOMAIN}/webhook/${BOT_TOKEN}`;
    await bot.api.setWebhook(webhookUrl);
    console.log(`Webhook set to ${webhookUrl}`);
  } else {
    // Development: Use long polling
    console.log("Starting bot in long polling mode...");

    // Delete webhook if exists
    await bot.api.deleteWebhook();

    // Start polling
    bot.start({
      onStart: () => {
        console.log("Bot started in long polling mode");
      },
    });
  }

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}, shutting down...`);
    stopScheduler();
    await bot.stop();
    await closeDatabase();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Failed to start:", error);
  process.exit(1);
});
