import { GoogleGenAI, Type } from "@google/genai";
import { MeetingAnalysis, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-3-pro-preview";

// Helper to clean JSON string from Markdown code blocks and extraneous text
const cleanJsonString = (text: string): string => {
  if (!text) return "[]";
  
  // 1. Try to extract from markdown code blocks first
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    return match[1].trim();
  }

  // 2. If no code blocks, look for the first '[' or '{' and the last ']' or '}'
  const firstBracket = text.indexOf('[');
  const firstBrace = text.indexOf('{');
  
  let startIndex = -1;
  let endIndex = -1;

  // Determine if we are looking for an array or an object
  // (We prioritize the one that appears first)
  if (firstBracket !== -1 && firstBrace !== -1) {
    startIndex = Math.min(firstBracket, firstBrace);
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  } else if (firstBrace !== -1) {
    startIndex = firstBrace;
  }

  if (startIndex !== -1) {
    // Determine the end index based on what we started with
    // Simple heuristic: look for the last occurrence of the closing counterpart
    // This isn't a full parser, but robust enough for standard LLM outputs
    const lastBracket = text.lastIndexOf(']');
    const lastBrace = text.lastIndexOf('}');
    endIndex = Math.max(lastBracket, lastBrace);
    
    if (endIndex > startIndex) {
      return text.substring(startIndex, endIndex + 1);
    }
  }

  // 3. Fallback: return original text and hope for the best
  return text.trim();
};

// Fallback phrases by language
const FALLBACKS: Record<Language, string[]> = {
  en: [
    "Let's circle back", "Take this offline", "Can everyone see my screen?", "You're on mute",
    "Synergy", "Thinking outside the box", "Low hanging fruit", "Action items",
    "Per my last email", "Deliverables", "Touch base", "Win-win",
    "Bandwidth", "Scalable", "Paradigm shift", "Deep dive",
    "Ping me", "Hard stop", "Bio break", "Next steps",
    "Moving the needle", "Quarterly goals", "KPIs", "Budget constraints"
  ],
  ja: [
    "画面見えてますか？", "ミュートになってます", "持ち帰って検討", "共有します",
    "シナジー", "アジェンダ", "ネクストアクション", "エビデンス",
    "合意形成", "たたき台", "マイルストーン", "プライオリティ",
    "リスケ", "フィードバック", "コミット", "アサイン",
    "オンスケ", "バッファ", "なるはや", "ブレスト",
    "PDCA", "KPI", "費用対効果", "コンセンサス"
  ],
  de: [
    "Können Sie mich hören?", "Bildschirm teilen", "Du bist stummgeschaltet", "Synergieeffekte",
    "Offline besprechen", "Low hanging fruit", "Nächste Schritte", "Action Items",
    "Kurzes Update", "Zeitmanagement", "Deadline", "Ressourcen",
    "Proaktiv", "Agil", "Brainstorming", "Mehrwert",
    "Fokus", "Best Practices", "Skalierbar", "Learnings",
    "Im Loop halten", "Roadmap", "Budget", "Zielsetzung"
  ],
  fr: [
    "Vous m'entendez ?", "Je partage mon écran", "Tu es en mute", "Synergie",
    "On voit ça hors ligne", "Prochaines étapes", "Brainstorming", "Deadline",
    "Feedback", " ASAP ", "En phase", "Challenging",
    "Update", "C'est dans le pipe", "Force de proposition", "KPI",
    "Retour sur investissement", "On boucle", "Actionable", "Draft",
    "Point rapide", "Roadmap", "Budget", "Objectifs"
  ]
};

const getLanguageName = (lang: Language): string => {
  switch (lang) {
    case 'ja': return 'Japanese';
    case 'de': return 'German';
    case 'fr': return 'French';
    default: return 'English';
  }
};

export const generateBingoPhrases = async (topic: string, industry: string, roles: string[], language: Language): Promise<string[]> => {
  const langName = getLanguageName(language);
  let prompt = `Generate a list of 24 short, cliché, funny, or typical phrases (max 6-8 words each) that someone might say during a meeting about "${topic}". The output MUST be in ${langName}.`;
  
  if (industry) {
    prompt += ` The industry is "${industry}".`;
  }
  
  if (roles.length > 0) {
    prompt += ` The participants include: ${roles.join(", ")}. Include specific jargon or catchphrases these specific personas would use.`;
  }

  prompt += ` The phrases should be distinct and suitable for a Bingo game card. Return ONLY a JSON array of strings in ${langName}.`;

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

    const jsonText = cleanJsonString(response.text || "[]");
    const phrases = JSON.parse(jsonText) as string[];
    
    // Fallbacks based on language
    const fallbackList = FALLBACKS[language] || FALLBACKS.en;
    
    let result = phrases;
    // Ensure we have exactly 24 phrases
    if (result.length < 24) {
      result = [...result, ...fallbackList.slice(0, 24 - result.length)];
    }
    
    return result.slice(0, 24);

  } catch (error) {
    console.error("Error generating bingo phrases:", error);
    return FALLBACKS[language] || FALLBACKS.en;
  }
};

export const getRoleSuggestions = async (topic: string, industry: string, language: Language): Promise<string[]> => {
  const langName = getLanguageName(language);
  const prompt = `Given a meeting about "${topic}" in the "${industry}" industry, list 8 stereotypical or common participant roles/personas (e.g. "Skeptical Developer", "Budget-conscious Manager"). Return ONLY a JSON array of strings in ${langName}.`;

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

    const jsonText = cleanJsonString(response.text || "[]");
    return JSON.parse(jsonText) as string[];
  } catch (error) {
    console.error("Error fetching roles:", error);
    return language === 'ja' 
      ? ["マネージャー", "開発者", "デザイナー", "営業", "経理", "進行役", "若手社員", "社長"]
      : ["Manager", "Developer", "Designer", "Stakeholder", "Client", "Finance", "HR", "Sales"];
  }
};

export const analyzeMeetingResult = async (
  topic: string, 
  winningPhrases: string[], 
  timeMs: number,
  language: Language
): Promise<MeetingAnalysis> => {
  const langName = getLanguageName(language);
  const durationStr = `${Math.floor(timeMs / 1000)} seconds`;
  const prompt = `
    A user just won "Meeting Bingo" during a meeting about "${topic}".
    It took them ${durationStr}.
    The winning phrases they heard were: ${JSON.stringify(winningPhrases)}.

    1. Calculate a "Boredom Score" from 0 to 100 based on how cliché and corporate the phrases are and how quickly they won.
    2. Write a short, snarky, funny commentary (max 2 sentences) roasting the meeting based on these specific phrases.
    
    The commentary MUST be in ${langName}.

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

    const jsonText = cleanJsonString(response.text || "{}");
    const data = JSON.parse(jsonText);
    return {
      boredomScore: data.boredomScore || 50,
      commentary: data.commentary || (language === 'ja' ? "それは退屈な会議でしたね。" : "That sounds like a meeting that could have been an email.")
    };
  } catch (error) {
    console.error("Error analyzing meeting:", error);
    return {
      boredomScore: 50,
      commentary: language === 'ja' ? "よくある会議の風景ですね。" : "A classic meeting performance."
    };
  }
};