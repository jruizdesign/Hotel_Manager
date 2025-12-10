import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Safely initialize, but allow the app to function without AI if key is missing (with warnings)
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateAIResponse = async (
  prompt: string, 
  contextData: string
): Promise<string> => {
  if (!ai) {
    return "API Key is missing. Please configure the environment variable.";
  }

  try {
    const fullPrompt = `
      You are an expert Hotel Management AI Assistant named "ConciergeAI".
      Your goal is to help hotel staff be more efficient.
      
      Here is the current hotel data context (JSON format):
      ${contextData}

      User Query: ${prompt}

      Please provide a concise, professional, and actionable response. 
      If analyzing data, use specific numbers from the context.
      If asked to write an email, format it properly.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};