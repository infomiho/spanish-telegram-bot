import * as fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import OpenAI from "openai";

const execAsync = promisify(exec);

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

async function convertToMp3(inputPath: string): Promise<string> {
  const outputPath = `${inputPath}.mp3`;

  await execAsync(`ffmpeg -i "${inputPath}" -acodec libmp3lame -y "${outputPath}"`);

  return outputPath;
}

export async function transcribeAudio(filePath: string): Promise<string> {
  const openai = getClient();

  // Convert to mp3 (Telegram sends .oga which OpenAI may not support)
  const mp3Path = await convertToMp3(filePath);

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(mp3Path),
      model: "gpt-4o-mini-transcribe",
      language: "es",
    });

    return transcription.text || "";
  } finally {
    // Clean up converted file
    fs.promises.unlink(mp3Path).catch(() => {});
  }
}
