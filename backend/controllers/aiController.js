const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate AI suggestion using Google Gemini
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateAISuggestion = async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate input
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required and cannot be empty"
      });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Return success response
    res.json({
      success: true,
      response: text
    });

  } catch (error) {
    console.error('Gemini AI generation failed:', error);

    // Handle specific errors
    if (error.message && error.message.includes('API_KEY_INVALID')) {
      return res.status(401).json({
        success: false,
        message: "Invalid Gemini API key"
      });
    }

    if (error.message && error.message.includes('QUOTA_EXCEEDED')) {
      return res.status(429).json({
        success: false,
        message: "Gemini API quota exceeded"
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: "AI service unavailable"
    });
  }
};

module.exports = {
  generateAISuggestion
};