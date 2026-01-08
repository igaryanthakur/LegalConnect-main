import fetch from "node-fetch";

// Update the Base URL for Gemini API with the correct model name
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Get response from Gemini AI for legal queries
 * @param {string} query - User's legal question
 * @returns {Promise<string>} - AI response
 */
export const getLegalAssistance = async (query) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }

    // Prepare the payload for Gemini API - structure remains the same for gemini-2.0-flash
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `You are a legal assistant bot for LawSphere. 
                 Provide helpful, clear, and accurate information about legal matters.
                 Remember to:
                 - Always state that you are not a lawyer and this is not legal advice
                 - Suggest consulting with a qualified lawyer for specific situations
                 - Include references to relevant laws when possible
                 - Keep responses concise but informative
                 - Use simple language and avoid excessive legal jargon
                 
                 User's question: ${query}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    // Make request to Gemini API with the apiKey as a query parameter
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Gemini API error: ${errorData.error?.message || "Unknown error"}`
      );
    }

    const data = await response.json();

    // Extract text from response
    const responseText = data.candidates[0]?.content?.parts[0]?.text;

    if (!responseText) {
      throw new Error("No response text received from Gemini API");
    }

    return responseText;
  } catch (error) {
    console.error("AI Service Error:", error);
    return `I apologize, but I'm having trouble processing your question right now. Please try again later or contact a lawyer through our directory for assistance with your legal matter.`;
  }
};
