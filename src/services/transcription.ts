import * as fs from "fs";
import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

export async function transcribeAudio(filePath: string): Promise<string> {
  const openai = getClient();

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "gpt-4o-mini-transcribe",
    language: "es",
  });

  return transcription.text || "";
}
