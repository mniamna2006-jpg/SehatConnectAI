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

// POST /api/ai/chat – Symptom-to-specialist recommendation
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

      return res.status(200).json({
        success: true,
        data: {
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

module.exports = router;
