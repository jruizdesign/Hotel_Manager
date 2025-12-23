import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from the environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    });

    return response.response.text() || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};

export const analyzeDocument = async (base64Image: string): Promise<{ category: string; title: string; description: string; extractedText: string }> => {
  try {
    // Remove base64 prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    const prompt = `
      Analyze this document image for a hotel management system.
      1. Categorize it as one of: 'Invoice', 'Guest ID', 'Contract', 'Report', or 'Other'.
      2. Generate a concise, descriptive title.
      3. Provide a brief summary/description of the document's content.
      4. Extract all important text from the document.

      Respond ONLY in JSON format like this:
      {
        "category": "category name",
        "title": "document title",
        "description": "brief summary",
        "extractedText": "all extracted text here"
      }
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            }
          ]
        }
      ],
    });

    const responseText = result.response.text();
    // Extract JSON from response (handling potential markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("Document Analysis Error:", error);
    return {
      category: 'Other',
      title: 'Scanned Document',
      description: 'AI analysis failed',
      extractedText: ''
    };
  }
};