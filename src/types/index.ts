import type { Context } from "grammy";
import type { FileFlavor } from "@grammyjs/files";

export type BotContext = FileFlavor<Context>;

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface User {
  chat_id: number;
  username: string | null;
  preferred_hour: number;
  timezone: string;
  difficulty: Difficulty;
  last_prompt: string | null;
  last_prompt_at: Date | null;
  created_at: Date;
}

export interface CreateUserInput {
  chat_id: number;
  username: string | null;
}

export interface UpdateUserSettings {
  preferred_hour?: number;
  timezone?: string;
  difficulty?: Difficulty;
}

export interface SpanishAnalysis {
  transcription: string;
  mistakes: string[];
  corrections: string;
  idealResponse: string;
  tips: string[];
}

export interface NewsHeadline {
  title: string;
  link: string;
  source: string;
}
