
import { GoogleGenAI, Type } from "@google/genai";

// SAFEGUARD: Helper to retrieve API Key safely without crashing if 'process' is undefined in browser
const getApiKey = () => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Environment check failed, running without API key.");
  }
  return undefined;
};

const apiKey = getApiKey();

// Initialize only if we have a key to prevent SDK from throwing fatal errors on load
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateTrainingPlan(userProfile: any) {
  if (!ai) {
    console.warn("Gemini AI is not initialized. Missing API Key or process.env.");
    // Return a mock plan so the UI doesn't break
    return [
      {
        day: "Day 1 (Demo)",
        activity: "Technical Drills",
        drills: ["Vibora Mechanics", "Bandeja Placement", "Net Control"],
        focus: "Technique"
      },
      {
        day: "Day 2 (Demo)", 
        activity: "Fitness & Cardio",
        drills: ["Ladder Drills", "Split Step Reaction", "Box Jumps"],
        focus: "Agility"
      },
      {
        day: "Day 3 (Demo)",
        activity: "Match Play",
        drills: ["Cross-court rally", "Tie-break situations"],
        focus: "Tactical"
      }
    ];
  }

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
