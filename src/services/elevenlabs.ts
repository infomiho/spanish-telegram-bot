import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import * as fs from "fs";

let client: ElevenLabsClient | null = null;

function getClient(): ElevenLabsClient {
  if (!client) {
    client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }
  return client;
}

export async function transcribeAudio(filePath: string): Promise<string> {
  const elevenlabs = getClient();

  const fileStream = fs.createReadStream(filePath);

  const result = await elevenlabs.speechToText.convert({
    file: fileStream,
    modelId: "scribe_v1",
    languageCode: "es",
  });

  // Handle union type: single transcript vs multichannel
  if ("text" in result) {
    return result.text || "";
  } else if ("transcripts" in result && result.transcripts.length > 0) {
    return result.transcripts[0].text || "";
  }

  return "";
}
