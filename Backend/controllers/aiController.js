import { getLegalAssistance } from "../utils/aiService.js";

/**
 * @desc    Get AI response for legal questions
 * @route   POST /api/ai/ask
 * @access  Public
 */
export const askLegalQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Please provide a question",
      });
    }

    // Store user query in database or analytics if needed
    // This could be useful for improving the system later

    // Get AI response
    const response = await getLegalAssistance(question);

    return res.status(200).json({
      success: true,
      data: {
        question,
        response,
      },
    });
  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing your request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get frequently asked legal questions
 * @route   GET /api/ai/faq
 * @access  Public
 */
export const getLegalFAQs = async (req, res) => {
  try {
    // Common legal questions and answers
    const faqs = [
      {
        question: "What are my tenant rights?",
        category: "Housing & Tenant Rights",
      },
      {
        question: "How do I file a small claims case?",
        category: "Small Claims",
      },
      {
        question: "What is the process for divorce?",
        category: "Family Law",
      },
      {
        question: "How can I fight a traffic ticket?",
        category: "Traffic & Driving",
      },
      {
        question: "What should I do after a car accident?",
        category: "Personal Injury",
      },
      {
        question: "How can I apply for child support?",
        category: "Family Law",
      },
    ];

    return res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching FAQs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export default {
  askLegalQuestion,
  getLegalFAQs,
};
