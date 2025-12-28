import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from the environment variable.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

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

    // In @google/genai, the response object typically has a 'text' property
    return (response as any).text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};

export const analyzeDocument = async (base64Image: string): Promise<{ category: string; title: string; description: string; extractedText: string }> => {
  try {
    // Remove base64 prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|pdf);base64,/, '');
    
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

    const response = await ai.models.generateContent({
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

    const responseText = (response as any).text || "";
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

/**
 * Analyzes document text to determine if an email should be sent and provides the email details.
 * @param documentText The text content of the document to analyze.
 * @returns An object indicating whether to send an email and the email details.
 */
export const shouldSendEmail = async (documentText: string): Promise<{
  sendEmail: boolean;
  to?: string;
  subject?: string;
  body?: string;
}> => {
  try {
    const prompt = `
      You are an AI assistant for a hotel management system. Your task is to analyze the following document text and decide if an automated email is necessary.

      Document Text:
      ---
      ${documentText}
      ---

      Based on the. text, perform the following actions:
      1.  Determine if an email should be sent. This is usually for high-priority items, invoices, guest complaints, or urgent maintenance requests. Do not send emails for routine reports or general information.
      2.  If an email is needed, identify the recipient category. Use one of the following: 'maintenance', 'accounting', 'frontdesk', 'manager'.
      3.  Create a concise and professional subject line.
      4.  Write a clear and professional email body summarizing the key information.

      Respond ONLY with a JSON object in the following format. Do not include any other text or markdown formatting.
      If no email is required:
      {
        "sendEmail": false
      }
      If an email is required:
      {
        "sendEmail": true,
        "to": "recipient_category",
        "subject": "Email Subject",
        "body": "Email body content."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = (response as any).text || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Could not parse AI response into valid JSON.");

  } catch (error) {
    console.error("AI Email Decision Error:", error);
    // In case of an error, default to not sending an email to be safe.
    return { sendEmail: false };
  }
};

/**
 * Generates a customer-facing email for an invoice.
 * @param guestName The name of the guest.
 * @param invoiceDetails A string containing the details of the invoice.
 * @returns A JSON object with the email subject and body.
 */
export const generateInvoiceEmail = async (guestName: string, invoiceDetails: string): Promise<{ subject: string; body: string; }> => {
  try {
    const prompt = `
      You are an AI assistant for StaySync Hotel. Your task is to generate a professional, friendly, and clear email to a guest with their invoice details.

      Guest Name: ${guestName}

      Invoice Details:
      ---
      ${invoiceDetails}
      ---

      Based on these details, generate a customer-facing email.

      Respond ONLY with a JSON object in the following format. Do not include any other text or markdown formatting.
      {
        "subject": "Your Invoice from StaySync Hotel",
        "body": "Dear ${guestName},\n\nThank you for staying with us. Please find your invoice details attached.\n\n${invoiceDetails}\n\nWe hope you enjoyed your stay!\n\nSincerely,\nThe StaySync Hotel Team"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = (response as any).text || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Could not parse AI response into valid JSON.");

  } catch (error) {
    console.error("AI Invoice Email Generation Error:", error);
    // Fallback in case of error
    return {
      subject: `Your Invoice from StaySync Hotel`,
      body: `Dear ${guestName},\n\nThank you for choosing StaySync Hotel. Please find your invoice details below.\n\n${invoiceDetails}\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nThe StaySync Hotel Team`,
    };
  }
};
