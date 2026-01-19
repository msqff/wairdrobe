
import { GoogleGenAI, Type } from "@google/genai";
import { Garment } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
}

export interface AnalysisResult {
    name: string;
    type: string;
    category: string;
    uses: string[];
}

export interface WardrobeInsights {
    stylePersona: string;
    colorPalette: string[];
    topCategories: string[];
    versatilityScore: number;
    description: string;
}

export interface OutfitSuggestion {
    outfitName: string;
    itemIds: string[];
    reasoning: string;
}

export interface ShoppingItem {
    item: string;
    reasoning: string;
}

const getLightweightContext = (wardrobe: Garment[]) => {
    return wardrobe.map(({ imageUrl, ...rest }) => rest);
};

export async function analyzeGarmentImage(
  imageBase64: string,
  mimeType: string,
  wardrobeContext: Garment[]
): Promise<AnalysisResult> {
  try {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    const contextExamples = wardrobeContext
      .slice(0, 10) 
      .map(({ type, category, uses }) => ({ type, category, uses }));

    const contextPrompt = contextExamples.length > 0 
      ? `To help you, here's how I've categorized some of my other clothes: ${JSON.stringify(contextExamples)}`
      : "";

    const prompt = `You are a fashion AI assistant. Analyze the garment in the image.
      ${contextPrompt}
      
      Perform the following:
      1. Generate a **unique, descriptive name**. Include the **color**, **pattern** (if any), and **material** or specific style details.
      2. Identify its specific **'type'** (e.g., 'Hoodie', 'Pleated Skirt').
      3. Identify its **'category'** from this list: ['Tops', 'Bottoms', 'Outerwear', 'One-Piece', 'Footwear', 'Accessories'].
      4. Suggest up to 3 **'uses'**. 
      
      Response must be JSON.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    category: { 
                        type: Type.STRING,
                        description: "One of: Tops, Bottoms, Outerwear, One-Piece, Footwear, Accessories"
                    },
                    uses: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ["name", "type", "category", "uses"],
            },
        },
    });
    
    return JSON.parse(response.text.trim()) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze the garment.");
  }
}

export async function getWardrobeAnalysis(wardrobe: Garment[]): Promise<WardrobeInsights> {
    const context = getLightweightContext(wardrobe);
    
    const prompt = `Act as a strict, high-standards fashion editor. Analyze this wardrobe inventory: ${JSON.stringify(context)}.
    
    Your task is to provide a brutally honest 'Wardrobe Audit'.
    
    STRICT SCORING RULES FOR VERSATILITY (0-10):
    - 0-3 items: Score MUST be 0.0 to 2.0. (It's not a wardrobe, it's an outfit).
    - 4-9 items: Score MUST be 2.0 to 4.5. (Severe gaps exist, impossible to be versatile).
    - 10-19 items: Score MUST be 4.5 to 7.0. (Getting there, but likely missing key layers/shoes).
    - 20+ items: Score based on actual mix-and-match potential.
    
    TONE:
    - Be witty, critical, and realistic. 
    - Do NOT be supportive if the wardrobe is lacking.
    - If the wardrobe is small, explicitly call out that they need to go shopping.
    
    Output JSON with: 
    - stylePersona: Creative 2-3 word vibe.
    - colorPalette: Colors found.
    - topCategories: Top 3 categories.
    - versatilityScore: The number based on the strict rules above.
    - description: A blunt, 2-sentence summary.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    stylePersona: { type: Type.STRING },
                    colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
                    topCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
                    versatilityScore: { type: Type.NUMBER },
                    description: { type: Type.STRING }
                },
                required: ["stylePersona", "colorPalette", "topCategories", "versatilityScore", "description"]
            }
        }
    });

    return JSON.parse(response.text.trim()) as WardrobeInsights;
}

export async function generateOutfit(
    wardrobe: Garment[], 
    occasion: string, 
    weather: string, 
    focus: string
): Promise<OutfitSuggestion> {
    const context = getLightweightContext(wardrobe);
    const prompt = `Act as a personal stylist. Create an outfit from this wardrobe: ${JSON.stringify(context)}.
    Occasion: ${occasion}, Weather: ${weather}, Focus: ${focus}.
    Select items and return IDs, name, and reasoning.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    outfitName: { type: Type.STRING },
                    itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                    reasoning: { type: Type.STRING }
                },
                required: ["outfitName", "itemIds", "reasoning"]
            }
        }
    });

    return JSON.parse(response.text.trim()) as OutfitSuggestion;
}

export async function getShoppingSuggestions(wardrobe: Garment[]): Promise<ShoppingItem[]> {
    const context = getLightweightContext(wardrobe);
    const prompt = `Analyze this wardrobe for gaps: ${JSON.stringify(context)}. Suggest 3 specific items to maximize versatility.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                item: { type: Type.STRING },
                                reasoning: { type: Type.STRING }
                            },
                            required: ["item", "reasoning"]
                        }
                    }
                },
                required: ["suggestions"]
            }
        }
    });

    const result = JSON.parse(response.text.trim());
    return result.suggestions as ShoppingItem[];
}

export async function visualizeOutfit(garments: Garment[]): Promise<string> {
    const imageParts = garments.map(g => {
        const base64Data = g.imageUrl.split(',')[1];
        const mimeType = g.imageUrl.split(';')[0].split(':')[1];
        return { inlineData: { data: base64Data, mimeType } };
    });

    const description = garments.map(g => `${g.type} (${g.name})`).join(', ');
    const prompt = `Generate a realistic fashion image of a mannequin wearing this outfit: ${description}. Combine these specific items onto the mannequin. Clean neutral background.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [...imageParts, { text: prompt }] },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${base64EncodeString}`;
        }
    }

    throw new Error("Failed to generate outfit visualization.");
}
