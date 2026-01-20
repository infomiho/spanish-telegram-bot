import OpenAI from "openai";
import type { Difficulty, SpanishAnalysis } from "../types/index.js";
import {
  getSpanishTeacherPrompt,
  getPromptGeneratorPrompt,
} from "../prompts/spanish-teacher.js";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

export async function analyzeSpanishResponse(
  originalPrompt: string,
  transcription: string,
  difficulty: Difficulty
): Promise<SpanishAnalysis> {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: getSpanishTeacherPrompt(difficulty),
      },
      {
        role: "user",
        content: `Original English prompt: "${originalPrompt}"

Student's Spanish response (transcribed): "${transcription}"

Please analyze this response and provide feedback.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content) as SpanishAnalysis;
  return parsed;
}

export async function generatePracticePrompt(
  newsHeadline: string,
  difficulty: Difficulty
): Promise<string> {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: getPromptGeneratorPrompt(difficulty),
      },
      {
        role: "user",
        content: `News headline for inspiration: "${newsHeadline}"

Generate a practice prompt in English that the student should respond to in Spanish.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return content.trim();
}
