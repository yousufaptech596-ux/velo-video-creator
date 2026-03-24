import { GoogleGenAI, Type } from "@google/genai";
import { ViralScript } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}

const ai = new GoogleGenAI({ apiKey });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    hook: { type: Type.STRING, description: "The attention-grabbing hook (first 3 seconds)." },
    script: { type: Type.STRING, description: "The full Roman Urdu narration script." },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING, description: "Visual prompt for AI generators." },
          duration: { type: Type.STRING, description: "Duration of the scene (e.g., 0-10s)." }
        },
        required: ["prompt", "duration"]
      }
    },
    audioCues: { type: Type.STRING, description: "Emotional tone and cues for voiceovers." },
    monetizationTip: { type: Type.STRING, description: "Tips for earning from this video in Pakistan." }
  },
  required: ["hook", "script", "scenes", "audioCues", "monetizationTip"]
};

export async function generateViralScript(topic: string, userId: string): Promise<ViralScript> {
  const model = "gemini-3.1-pro-preview";
  const prompt = `You are the "Velo Viral Creator," an expert in Pakistani social media trends (TikTok, YouTube Shorts, Reels). 
Your goal is to help users create high-earning, faceless viral videos in Roman Urdu.

TOPIC: ${topic}

RULES:
1. LANGUAGE: Use professional yet catchy Roman Urdu.
2. STRUCTURE: Provide a high-retention hook, a full script (60 seconds), visual prompts for AI generators, audio cues, and monetization tips.
3. PAKISTANI CONTEXT: Use local references, currency (PKR), and cultural nuances. Include AdMob/AdSense as a key monetization strategy for apps/websites.

Return the response in a structured JSON format.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema
    }
  });

  const data = JSON.parse(response.text);
  
  return {
    userId,
    topic,
    hook: data.hook,
    script: data.script,
    scenes: data.scenes,
    audioCues: data.audioCues,
    monetizationTip: data.monetizationTip,
    createdAt: new Date().toISOString()
  };
}
