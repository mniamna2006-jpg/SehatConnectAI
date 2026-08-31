const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");
const {
  analyzeSymptoms,
  SUPPORTED_LANGUAGES,
  MAX_MESSAGE_LENGTH,
} = require("../services/ai.service");

const router = express.Router();

/**
 * Generate a simple conversation title from the first patient message.
 * Deterministic — no AI call needed.
 */
function generateTitle(message) {
  const trimmed = message.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 50) return trimmed;
  return trimmed.substring(0, 50).trim() + "...";
}

// POST /api/ai/chat – Symptom-to-specialist recommendation
router.post(
  "/chat",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const { message, language, conversation_id } = req.body;

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

      // Look up the patient record
      const patient = await prisma.patient.findUnique({
        where: { user_id: req.user.user_id },
        select: { patient_id: true },
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      // Resolve or create conversation
      let conversationId = conversation_id;

      if (conversationId) {
        // Verify the conversation belongs to this patient
        const existing = await prisma.aIConversation.findFirst({
          where: {
            conversation_id: conversationId,
            patient_id: patient.patient_id,
          },
          select: { conversation_id: true },
        });

        if (!existing) {
          return res.status(404).json({
            success: false,
            message: "Conversation not found",
          });
        }
      } else {
        // Create a new conversation
        const newConversation = await prisma.aIConversation.create({
          data: {
            patient_id: patient.patient_id,
            title: generateTitle(message),
          },
          select: { conversation_id: true },
        });
        conversationId = newConversation.conversation_id;
      }

      // Save the patient's message
      await prisma.aIMessage.create({
        data: {
          conversation_id: conversationId,
          sender: "USER",
          message: message.trim(),
          language: lang,
        },
      });

      // Step 1: AI analyzes symptoms and recommends a department
      const aiResult = await analyzeSymptoms(message.trim(), lang);

      // Step 2: Look up real departments matching the AI recommendation
      const departmentName = aiResult.recommended_department;

      let matchingDepartments = [];
      let doctors = [];

      if (departmentName) {
        matchingDepartments = await prisma.department.findMany({
          where: {
            name: { contains: departmentName, mode: "insensitive" },
            is_active: true,
            hospital: { is_active: true },
          },
          include: {
            hospital: {
              select: {
                hospital_id: true,
                name: true,
                city: true,
              },
            },
          },
          orderBy: { name: "asc" },
        });

        // Step 3: Find active doctors in those departments
        const departmentIds = matchingDepartments.map((d) => d.department_id);

        if (departmentIds.length > 0) {
          doctors = await prisma.doctor.findMany({
            where: {
              department_id: { in: departmentIds },
              is_active: true,
            },
            select: {
              doctor_id: true,
              name: true,
              specialization: true,
              qualification: true,
              consultation_fee: true,
              department: {
                select: {
                  department_id: true,
                  name: true,
                },
              },
              hospital: {
                select: {
                  hospital_id: true,
                  name: true,
                  city: true,
                },
              },
            },
            orderBy: { name: "asc" },
          });
        }
      }

      // Step 4: Build the response
      // Pick the first matching department as the primary recommendation
      const recommendedDepartment = matchingDepartments.length > 0
        ? {
            department_id: matchingDepartments[0].department_id,
            name: matchingDepartments[0].name,
            hospital_id: matchingDepartments[0].hospital.hospital_id,
            hospital_name: matchingDepartments[0].hospital.name,
            city: matchingDepartments[0].hospital.city,
          }
        : null;

      // Group doctors by department for clarity
      const doctorResults = doctors.map((doc) => ({
        doctor_id: doc.doctor_id,
        name: doc.name,
        specialization: doc.specialization,
        qualification: doc.qualification,
        consultation_fee: doc.consultation_fee,
        department_id: doc.department.department_id,
        department_name: doc.department.name,
        hospital_id: doc.hospital.hospital_id,
        hospital_name: doc.hospital.name,
        city: doc.hospital.city,
      }));

      // Save the AI response message
      await prisma.aIMessage.create({
        data: {
          conversation_id: conversationId,
          sender: "AI",
          message: aiResult.message,
          language: lang,
          recommended_department: aiResult.recommended_department,
          is_emergency: aiResult.is_emergency,
        },
      });

      // Touch the conversation's updated_at
      await prisma.aIConversation.update({
        where: { conversation_id: conversationId },
        data: { updated_at: new Date() },
        select: { conversation_id: true },
      });

      return res.status(200).json({
        success: true,
        data: {
          conversation_id: conversationId,
          message: aiResult.message,
          is_emergency: aiResult.is_emergency,
          recommended_department: recommendedDepartment,
          doctors: doctorResults,
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
        message: "Failed to analyze symptoms",
      });
    }
  }
);

// GET /api/ai/history – List patient's AI conversations (newest first)
router.get(
  "/history",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const patient = await prisma.patient.findUnique({
        where: { user_id: req.user.user_id },
        select: { patient_id: true },
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      const conversations = await prisma.aIConversation.findMany({
        where: { patient_id: patient.patient_id },
        orderBy: { updated_at: "desc" },
        select: {
          conversation_id: true,
          title: true,
          created_at: true,
          updated_at: true,
          messages: {
            orderBy: { created_at: "desc" },
            take: 1,
            select: {
              message_id: true,
              sender: true,
              message: true,
              created_at: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      });

      const result = conversations.map((conv) => ({
        conversation_id: conv.conversation_id,
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        message_count: conv._count.messages,
        latest_message: conv.messages.length > 0 ? conv.messages[0] : null,
      }));

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("AI history list error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch conversation history",
      });
    }
  }
);

// GET /api/ai/history/:conversationId – Get full conversation with all messages
router.get(
  "/history/:conversationId",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      const patient = await prisma.patient.findUnique({
        where: { user_id: req.user.user_id },
        select: { patient_id: true },
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      const conversation = await prisma.aIConversation.findFirst({
        where: {
          conversation_id: conversationId,
          patient_id: patient.patient_id,
        },
        include: {
          messages: {
            orderBy: { created_at: "asc" },
            select: {
              message_id: true,
              sender: true,
              message: true,
              language: true,
              recommended_department: true,
              is_emergency: true,
              created_at: true,
            },
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          conversation_id: conversation.conversation_id,
          title: conversation.title,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          messages: conversation.messages,
        },
      });
    } catch (error) {
      console.error("AI history detail error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch conversation",
      });
    }
  }
);

// DELETE /api/ai/history/:conversationId – Delete a conversation and its messages
router.delete(
  "/history/:conversationId",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      const patient = await prisma.patient.findUnique({
        where: { user_id: req.user.user_id },
        select: { patient_id: true },
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      // Verify ownership before deleting
      const conversation = await prisma.aIConversation.findFirst({
        where: {
          conversation_id: conversationId,
          patient_id: patient.patient_id,
        },
        select: { conversation_id: true },
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      // Delete conversation (messages cascade via onDelete: Cascade)
      await prisma.aIConversation.delete({
        where: { conversation_id: conversationId },
      });

      return res.status(200).json({
        success: true,
        message: "Conversation deleted successfully",
      });
    } catch (error) {
      console.error("AI history delete error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete conversation",
      });
    }
  }
);

module.exports = router;
