import { GoogleGenerativeAI } from "@google/genai";

// Initialize the client with the API key from the environment variable.
const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');

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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();
    return text;

  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    // Provide a more user-friendly error message
    if (error.message.includes('API key not valid')) {
      return "Error: The AI service API key is not valid. Please check your settings.";
    }
    return `Error: Could not generate AI response. ${error.message}`;
  }
};

export const generateInvoiceEmail = async (guestName: string, invoiceDetails: string): Promise<{ subject: string, body: string }> => {
  const prompt = `
    Generate a professional and friendly email to a hotel guest named ${guestName} with their invoice.
    The tone should be courteous and reflect good hospitality.
    Include the invoice details provided below.
    
    Invoice Details:
    ${invoiceDetails}

    Output only the subject line and the email body, separated by a newline.
    Example:
    Subject: Your Invoice from StaySync Hotel
    
    Dear ${guestName},
    ...
  `;
  
  const responseText = await generateAIResponse(prompt, "Context: Generating an invoice email.");

  const lines = responseText.split('\n');
  const subject = lines.find(line => line.toLowerCase().startsWith('subject:'))?.replace(/subject:/i, '').trim() || 'Your Invoice';
  const body = lines.filter(line => !line.toLowerCase().startsWith('subject:')).join('\n').trim();

  return { subject, body };
};

export const shouldSendEmail = async (description: string): Promise<boolean> => {
  const prompt = `
    A new maintenance request has been submitted with the following description: "${description}".
    Analyze the description to determine if this is an urgent issue that requires immediate email notification to the maintenance department.
    Urgent issues are things like major leaks, power outages, security risks, or anything that could significantly impact guest safety or hotel operations.
    Non-urgent issues are things like a dripping faucet, a burnt-out lightbulb in a non-critical area, or minor cosmetic damage.

    Respond with only "YES" or "NO".
  `;
  
  const response = await generateAIResponse(prompt, "Context: Evaluating maintenance request urgency.");
  
  return response.trim().toUpperCase() === 'YES';
};

export const analyzeDocument = async (base64Data: string): Promise<{ title: string; category: string; description: string; extractedText?: string; }> => {
  const prompt = `
    Analyze the following document (provided as a base64 string) and return a structured JSON object with the following fields:
    - title: A concise, descriptive title for the document.
    - category: Classify the document into one of the following categories: 'Invoice', 'Guest ID', 'Contract', 'Report', or 'Other'.
    - description: A brief summary of the document's content.
    - extractedText: (Optional) If the document contains text, extract the full, clean text.

    Document Data: ${base64Data}

    Respond with only the JSON object.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawJson = response.text().trim().replace(/^```json\n/, '').replace(/\n```$/, '');
    return JSON.parse(rawJson);
  } catch (error) {
    console.error("Error analyzing document with AI:", error);
    // Return a default/error structure
    return {
      title: "Analysis Failed",
      category: "Other",
      description: "The AI model could not process this document."
    };
  }
};
