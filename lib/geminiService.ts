
import { GoogleGenAI, Type } from "@google/genai";

// SAFEGUARD: Helper to retrieve API Key safely from various environment formats
const getEnvVar = (key: string) => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

// Check for API Key
const apiKey = 
  getEnvVar('VITE_GEMINI_API_KEY') || 
  getEnvVar('NEXT_PUBLIC_GEMINI_API_KEY') || 
  getEnvVar('API_KEY');

// Initialize AI ONLY if key exists. Otherwise null.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateTrainingPlan(userProfile: any) {
  // 1. If AI is not initialized (No Key), return Mock Data immediately.
  if (!ai) {
    console.log("Gemini API Key missing. Returning demo plan.");
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
      },
      {
        day: "Day 4 (Demo)",
        activity: "Rest & Recovery",
        drills: ["Light stretching", "Video analysis"],
        focus: "Recovery"
      },
      {
        day: "Day 5 (Demo)",
        activity: "Technical Drills",
        drills: ["Serve & Volley", "Chiquita practice"],
        focus: "Technique"
      },
      {
        day: "Day 6 (Demo)",
        activity: "Match Simulation",
        drills: ["Set play", "Pressure points"],
        focus: "Mental"
      },
      {
        day: "Day 7 (Demo)",
        activity: "Rest",
        drills: [],
        focus: "Rest"
      }
    ];
  }

  // 2. Try to generate content if key exists
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
