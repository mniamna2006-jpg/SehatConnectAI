const express = require("express");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");
const {
  generateResponse,
  SUPPORTED_LANGUAGES,
  MAX_MESSAGE_LENGTH,
} = require("../services/ai.service");

const router = express.Router();

// POST /api/ai/chat – Patient AI assistant
router.post(
  "/chat",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const { message, language } = req.body;

      // Validate message
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Message is required and must not be empty",
        });
      }

      if (message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`,
        });
      }

      // Validate language
      const lang = (language || "ENGLISH").toUpperCase();
      if (!SUPPORTED_LANGUAGES.includes(lang)) {
        return res.status(400).json({
          success: false,
          message: `Invalid language. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`,
        });
      }

      // Call the AI service
      const aiResponse = await generateResponse(message.trim(), lang);

      return res.status(200).json({
        success: true,
        data: {
          message: aiResponse,
        },
      });
    } catch (error) {
      console.error("AI chat error:", error);

      // If the AI provider is not configured or unreachable
      if (
        error.message === "AI provider is not configured" ||
        error.message === "Failed to connect to AI provider"
      ) {
        return res.status(502).json({
          success: false,
          message: "AI assistant is currently unavailable",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to generate AI response",
      });
    }
  }
);

module.exports = router;
