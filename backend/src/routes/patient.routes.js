const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Get logged-in patient's profile
router.get(
  "/profile",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const patient = await prisma.patient.findUnique({
        where: {
          user_id: req.user.user_id,
        },
        include: {
          user: true,
        },
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          patient_id: patient.patient_id,
          user_id: patient.user_id,
          full_name: patient.user.full_name,
          email: patient.user.email,
          phone: patient.user.phone,
          preferred_language: patient.user.preferred_language,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          address: patient.address,
          city: patient.city,
          emergency_contact: patient.emergency_contact,
        },
      });
    } catch (error) {
      console.error("Get patient profile error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch patient profile",
      });
    }
  }
);

// Update logged-in patient's profile
router.patch(
  "/profile",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const {
        full_name,
        phone,
        preferred_language,
        date_of_birth,
        gender,
        address,
        city,
        emergency_contact,
      } = req.body;

      const patient = await prisma.patient.findUnique({
        where: {
          user_id: req.user.user_id,
        },
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: {
            user_id: req.user.user_id,
          },
          data: {
            ...(full_name !== undefined && { full_name }),
            ...(phone !== undefined && { phone }),
            ...(preferred_language !== undefined && {
              preferred_language,
            }),
          },
        });

        const updatedPatient = await tx.patient.update({
          where: {
            patient_id: patient.patient_id,
          },
          data: {
            ...(date_of_birth !== undefined && {
              date_of_birth: date_of_birth
                ? new Date(date_of_birth)
                : null,
            }),
            ...(gender !== undefined && { gender }),
            ...(address !== undefined && { address }),
            ...(city !== undefined && { city }),
            ...(emergency_contact !== undefined && {
              emergency_contact,
            }),
          },
        });

        return {
          patient: updatedPatient,
          user,
        };
      });

      return res.status(200).json({
        success: true,
        message: "Patient profile updated successfully",
        data: {
          patient_id: result.patient.patient_id,
          user_id: result.user.user_id,
          full_name: result.user.full_name,
          email: result.user.email,
          phone: result.user.phone,
          preferred_language: result.user.preferred_language,
          date_of_birth: result.patient.date_of_birth,
          gender: result.patient.gender,
          address: result.patient.address,
          city: result.patient.city,
          emergency_contact: result.patient.emergency_contact,
        },
      });
    } catch (error) {
      console.error("Update patient profile error:", error);

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
