
// NOTE: Google GenAI dependency removed to fix Vercel build errors.
// This service now returns Mock Data for testing purposes until the AI dependency is restored.

export async function generateTrainingPlan(userProfile: any) {
  console.log("AI Service is currently in MOCK mode. Returning demo plan for:", userProfile.name);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return [
    {
      day: "Day 1 (Mock)",
      activity: "Technical Drills",
      drills: ["Vibora Mechanics", "Bandeja Placement", "Net Control"],
      focus: "Technique"
    },
    {
      day: "Day 2 (Mock)", 
      activity: "Fitness & Cardio",
      drills: ["Ladder Drills", "Split Step Reaction", "Box Jumps"],
      focus: "Agility"
    },
    {
      day: "Day 3 (Mock)",
      activity: "Match Play",
      drills: ["Cross-court rally", "Tie-break situations"],
      focus: "Tactical"
    },
    {
      day: "Day 4 (Mock)",
      activity: "Rest & Recovery",
      drills: ["Light stretching", "Video analysis"],
      focus: "Recovery"
    },
    {
      day: "Day 5 (Mock)",
      activity: "Technical Drills",
      drills: ["Serve & Volley", "Chiquita practice"],
      focus: "Technique"
    },
    {
      day: "Day 6 (Mock)",
      activity: "Match Simulation",
      drills: ["Set play", "Pressure points"],
      focus: "Mental"
    },
    {
      day: "Day 7 (Mock)",
      activity: "Rest",
      drills: [],
      focus: "Rest"
    }
  ];
}
