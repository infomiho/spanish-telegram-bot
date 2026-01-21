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

const spanishAnalysisSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "spanish_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        transcription: {
          type: "string",
          description: "The Spanish transcription (kept in Spanish)",
        },
        mistakes: {
          type: "array",
          items: { type: "string" },
          description: "List of mistakes explained in English",
        },
        corrections: {
          type: "string",
          description: "The corrected Spanish version",
        },
        idealResponse: {
          type: "string",
          description: "A native-like ideal response in Spanish",
        },
        tips: {
          type: "array",
          items: { type: "string" },
          description: "2-3 helpful tips in English",
        },
      },
      required: ["transcription", "mistakes", "corrections", "idealResponse", "tips"],
      additionalProperties: false,
    },
  },
};

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
    response_format: spanishAnalysisSchema,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(content) as SpanishAnalysis;
}

export async function generatePracticePrompt(
  topic: string,
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
        content: `Topic for inspiration: "${topic}"

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
