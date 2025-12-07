import { GoogleGenAI, Type } from "@google/genai";
import { MeetingAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-3-pro-preview";

export const generateBingoPhrases = async (topic: string, industry: string, roles: string[]): Promise<string[]> => {
  let prompt = `Generate a list of 24 short, cliché, funny, or typical phrases (max 6-8 words each) that someone might say during a meeting about "${topic}".`;
  
  if (industry) {
    prompt += ` The industry is "${industry}".`;
  }
  
  if (roles.length > 0) {
    prompt += ` The participants include: ${roles.join(", ")}. Include specific jargon or catchphrases these specific personas would use.`;
  }

  prompt += ` The phrases should be distinct and suitable for a Bingo game card. Return ONLY a JSON array of strings.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No text returned from Gemini");
    }

    const phrases = JSON.parse(jsonText) as string[];
    
    // Ensure we have exactly 24 phrases (fill with generics if short, cut if long)
    const fallbackPhrases = [
      "Can you hear me?", "Let's circle back", "Take this offline", "Synergy", 
      "Low hanging fruit", "Next steps", "Is X on the call?", "Can you see my screen?",
      "Hard stop", "Bio break", "Pivot", "Deep dive", "Who has the ball?", "Granular"
    ];

    let result = phrases;
    if (result.length < 24) {
      result = [...result, ...fallbackPhrases.slice(0, 24 - result.length)];
    }
    
    return result.slice(0, 24);

  } catch (error) {
    console.error("Error generating bingo phrases:", error);
    return [
      "Let's circle back", "Take this offline", "Can everyone see my screen?", "You're on mute",
      "Synergy", "Thinking outside the box", "Low hanging fruit", "Action items",
      "Per my last email", "Deliverables", "Touch base", "Win-win",
      "Bandwidth", "Scalable", "Paradigm shift", "Deep dive",
      "Ping me", "Hard stop", "Bio break", "Next steps",
      "Moving the needle", "Quarterly goals", "KPIs", "Budget constraints"
    ];
  }
};

export const getRoleSuggestions = async (topic: string, industry: string): Promise<string[]> => {
  const prompt = `Given a meeting about "${topic}" in the "${industry}" industry, list 8 stereotypical or common participant roles/personas (e.g. "Skeptical Developer", "Budget-conscious Manager", "Over-enthusiastic Sales"). Return ONLY a JSON array of strings.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || "[]") as string[];
  } catch (error) {
    console.error("Error fetching roles:", error);
    return ["Manager", "Developer", "Designer", "Stakeholder", "Client", "Finance", "HR", "Sales"];
  }
};

export const analyzeMeetingResult = async (
  topic: string, 
  winningPhrases: string[], 
  timeMs: number
): Promise<MeetingAnalysis> => {
  const durationStr = `${Math.floor(timeMs / 1000)} seconds`;
  const prompt = `
    A user just won "Meeting Bingo" during a meeting about "${topic}".
    It took them ${durationStr}.
    The winning phrases they heard were: ${JSON.stringify(winningPhrases)}.

    1. Calculate a "Boredom Score" from 0 to 100 based on how cliché and corporate the phrases are and how quickly they won (faster win = more predictable/boring).
    2. Write a short, snarky, funny commentary (max 2 sentences) roasting the meeting based on these specific phrases.

    Return JSON: { "boredomScore": number, "commentary": string }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            boredomScore: { type: Type.INTEGER },
            commentary: { type: Type.STRING }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      boredomScore: data.boredomScore || 50,
      commentary: data.commentary || "That sounds like a meeting that could have been an email."
    };
  } catch (error) {
    console.error("Error analyzing meeting:", error);
    return {
      boredomScore: 50,
      commentary: "A classic meeting performance."
    };
  }
};