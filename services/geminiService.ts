import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from the environment variable.
// We assume process.env.API_KEY is pre-configured and valid as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAIResponse = async (
  prompt: string, 
  contextData: string
): Promise<string> => {
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