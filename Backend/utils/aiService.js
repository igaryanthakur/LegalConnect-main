import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a legal assistant bot for LegalConnect.
Provide helpful, clear, and accurate information about legal matters.
Remember to:
- Always state that you are not a lawyer and this is not legal advice
- Suggest consulting with a qualified lawyer for specific situations
- Include references to relevant laws when possible
- Keep responses concise but informative
- Use simple language and avoid excessive legal jargon`;

/**
 * Get response from ChatGPT for legal queries
 * @param {string} query - User's legal question
 * @returns {Promise<string>} - AI response
 */
export const getLegalAssistance = async (query) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("AI Service Error: OPENAI_API_KEY is not defined in .env");
    return `I apologize, but I'm having trouble processing your question right now. Please try again later or contact a lawyer through our directory for assistance with your legal matter.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
      max_tokens: 1024,
      temperature: 0.2,
    });

    const responseText = completion.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response text from OpenAI");
    }

    return responseText;
  } catch (error) {
    console.error("AI Service Error:", error.message);

    if (error.status === 401) {
      return `I'm unable to process requests due to an authentication error. Please contact support.`;
    }
    if (error.status === 429 || error.message?.includes("rate limit")) {
      return `I'm temporarily unable to process requests due to high demand. Please try again in a few moments.`;
    }
    if (error.status === 402 || error.message?.includes("quota")) {
      return `I'm temporarily unable to process requests. Please try again later or contact a lawyer through our directory.`;
    }

    return `I apologize, but I'm having trouble processing your question right now. Please try again later or contact a lawyer through our directory for assistance with your legal matter.`;
  }
};
