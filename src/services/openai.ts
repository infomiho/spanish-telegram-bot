import type { Difficulty, SpanishAnalysis } from "../types/index.js";
import {
  getSpanishTeacherPrompt,
  getPromptGeneratorPrompt,
} from "../prompts/spanish-teacher.js";
import { getOpenAIClient } from "./openai-client.js";

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
          description: "The Spanish transcription of what the student said",
        },
        mistakes: {
          type: "array",
          items: { type: "string" },
          description: "Array of specific mistakes explained in English",
        },
        corrections: {
          type: "string",
          description: "The corrected version of the student's sentence in Spanish",
        },
        idealResponse: {
          type: "string",
          description: "A natural, native-level answer in Spanish",
        },
        tips: {
          type: "array",
          items: { type: "string" },
          description: "2-3 actionable tips in English",
        },
      },
      required: ["transcription", "mistakes", "corrections", "idealResponse", "tips"],
      additionalProperties: false,
    },
  },
};

const promptGeneratorSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "practice_prompt",
    strict: true,
    schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The role-play scenario prompt in English (max 2 sentences)",
        },
      },
      required: ["prompt"],
      additionalProperties: false,
    },
  },
};

export async function analyzeSpanishResponse(
  originalPrompt: string,
  transcription: string,
  difficulty: Difficulty
): Promise<SpanishAnalysis> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: getSpanishTeacherPrompt(difficulty),
      },
      {
        role: "user",
        content: `Original English Prompt: "${originalPrompt}"
Student's Spanish Response: "${transcription}"`,
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
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: getPromptGeneratorPrompt(difficulty),
      },
      {
        role: "user",
        content: `Use this topic as loose inspiration (you can diverge from it): "${topic}"

Generate a role-play scenario prompt.`,
      },
    ],
    response_format: promptGeneratorSchema,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content) as { prompt: string };
  return parsed.prompt;
}
