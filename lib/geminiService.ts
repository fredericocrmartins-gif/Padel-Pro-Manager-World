
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateTrainingPlan(userProfile: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a world-class Padel coach. Generate a 7-day tactical and fitness training plan for a level ${userProfile.skillLevel} player named ${userProfile.name}. They want to reach the next level. Provide specific drills.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING, description: 'Format "Day X: Name"' },
              activity: { type: Type.STRING },
              drills: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              focus: { type: Type.STRING, description: 'e.g., Tactical, Power, Defense' }
            },
            required: ["day", "activity", "drills", "focus"]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (e) {
    console.error("Gemini failed to generate plan", e);
  }
  return null;
}
