const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");
const { addTime12hFields } = require("../utils/date.helpers");

const SCHEDULE_TIME_FIELDS = { start_time: true, end_time: true };

const router = express.Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verify the logged-in ADMIN owns the given hospital.
 * Returns the admin record on success, or null (and sends an error response).
 */
const verifyAdminHospital = async (userId, hospitalId, res) => {
  const admin = await prisma.hospitalAdmin.findUnique({
    where: { user_id: userId },
  });

  if (!admin) {
    res.status(404).json({
      success: false,
      message: "Hospital admin profile not found",
    });
    return null;
  }

  if (admin.hospital_id !== hospitalId) {
    res.status(403).json({
      success: false,
      message: "You do not have permission to manage doctors in this hospital",
    });
    return null;
  }

  return admin;
};

// ---------------------------------------------------------------------------
// Patient-facing (public) endpoints
// ---------------------------------------------------------------------------

// Get active doctors for a hospital
router.get("/hospital/:hospitalId", async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        hospital_id: req.params.hospitalId,
        is_active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error("Get hospital doctors error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hospital doctors",
    });
  }
});

// Get active doctors for a department
router.get("/department/:departmentId", async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        department_id: req.params.departmentId,
        is_active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error("Get doctors error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
    });
  }
});

// Get doctor profile
router.get("/:doctor_id", async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const doctor = await prisma.doctor.findFirst({
      where: {
        doctor_id,
        is_active: true,
      },
      include: {
        hospital: true,
        department: true,
        schedules: {
          where: {
            is_active: true,
          },
          orderBy: {
            day_of_week: "asc",
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Add 12-hour time display fields to nested schedules
    const doctorData = {
      ...doctor,
      schedules: addTime12hFields(doctor.schedules, SCHEDULE_TIME_FIELDS),
    };

    return res.status(200).json({
      success: true,
      data: doctorData,
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor profile",
    });
  }
});

// ---------------------------------------------------------------------------
// Admin doctor management (ADMIN only)
// ---------------------------------------------------------------------------

// Create doctor - ADMIN only (with hospital ownership check)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const {
        hospital_id,
        department_id,
        name,
        specialization,
        qualification,
        license_number,
        bio,
        consultation_fee,
      } = req.body;

      if (
        !hospital_id ||
        !department_id ||
        !name ||
        !specialization ||
        !license_number
      ) {
        return res.status(400).json({
          success: false,
          message:
            "hospital_id, department_id, name, specialization and license_number are required",
        });
      }

      // Verify the admin belongs to the target hospital
      const admin = await verifyAdminHospital(
        req.user.user_id,
        hospital_id,
        res
      );

      if (!admin) return;

      // Verify the department belongs to the same hospital
      const department = await prisma.department.findUnique({
        where: { department_id },
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      if (department.hospital_id !== hospital_id) {
        return res.status(400).json({
          success: false,
          message: "Department does not belong to the specified hospital",
        });
      }

      if (!department.is_active) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign doctor to an inactive department",
        });
      }

      // Basic field validation
      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Doctor name must be a non-empty string",
        });
      }

      if (typeof specialization !== "string" || specialization.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Specialization must be a non-empty string",
        });
      }

      if (typeof license_number !== "string" || license_number.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "License number must be a non-empty string",
        });
      }

      if (
        consultation_fee !== undefined &&
        consultation_fee !== null &&
        (typeof consultation_fee !== "number" || consultation_fee < 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Consultation fee must be a non-negative number or null",
        });
      }

      const doctor = await prisma.doctor.create({
        data: {
          hospital_id,
          department_id,
          name: name.trim(),
          specialization: specialization.trim(),
          qualification: qualification || null,
          license_number: license_number.trim(),
          bio: bio || null,
          consultation_fee:
            consultation_fee !== undefined && consultation_fee !== null
              ? consultation_fee
              : null,
        },
      });

      res.status(201).json({
        success: true,
        message: "Doctor created successfully",
        data: doctor,
      });
    } catch (error) {
      console.error("Create doctor error:", error);

      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Update doctor - ADMIN only
router.patch(
  "/:doctor_id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { doctor_id } = req.params;
      const {
        name,
        specialization,
        qualification,
        license_number,
        bio,
        consultation_fee,
        department_id,
      } = req.body;

      // Find the existing doctor
      const existing = await prisma.doctor.findUnique({
        where: { doctor_id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      // Verify the admin belongs to the doctor's hospital
      const admin = await verifyAdminHospital(
        req.user.user_id,
        existing.hospital_id,
        res
      );

      if (!admin) return;

      // Build update data
      const updateData = {};

      if (name !== undefined) {
        if (typeof name !== "string" || name.trim() === "") {
          return res.status(400).json({
            success: false,
            message: "Doctor name must be a non-empty string",
          });
        }

        updateData.name = name.trim();
      }

      if (specialization !== undefined) {
        if (
          typeof specialization !== "string" ||
          specialization.trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            message: "Specialization must be a non-empty string",
          });
        }

        updateData.specialization = specialization.trim();
      }

      if (qualification !== undefined) {
        if (qualification !== null && typeof qualification !== "string") {
          return res.status(400).json({
            success: false,
            message: "Qualification must be a string or null",
          });
        }

        updateData.qualification = qualification;
      }

      if (license_number !== undefined) {
        if (
          typeof license_number !== "string" ||
          license_number.trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            message: "License number must be a non-empty string",
          });
        }

        updateData.license_number = license_number.trim();
      }

      if (bio !== undefined) {
        if (bio !== null && typeof bio !== "string") {
          return res.status(400).json({
            success: false,
            message: "Bio must be a string or null",
          });
        }

        updateData.bio = bio;
      }

      if (consultation_fee !== undefined) {
        if (
          consultation_fee !== null &&
          (typeof consultation_fee !== "number" || consultation_fee < 0)
        ) {
          return res.status(400).json({
            success: false,
            message: "Consultation fee must be a non-negative number or null",
          });
        }

        updateData.consultation_fee = consultation_fee;
      }

      // Department reassignment — must be within the same hospital
      if (department_id !== undefined) {
        if (department_id === null) {
          return res.status(400).json({
            success: false,
            message: "Department cannot be null. Provide a valid department_id.",
          });
        }

        const department = await prisma.department.findUnique({
          where: { department_id },
        });

        if (!department) {
          return res.status(404).json({
            success: false,
            message: "Department not found",
          });
        }

        if (department.hospital_id !== existing.hospital_id) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot assign doctor to a department in a different hospital",
          });
        }

        if (!department.is_active) {
          return res.status(400).json({
            success: false,
            message: "Cannot assign doctor to an inactive department",
          });
        }

        updateData.department_id = department_id;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No valid fields to update. Allowed: name, specialization, qualification, license_number, bio, consultation_fee, department_id",
        });
      }

      const doctor = await prisma.doctor.update({
        where: { doctor_id },
        data: updateData,
      });

      return res.status(200).json({
        success: true,
        message: "Doctor updated successfully",
        data: doctor,
      });
    } catch (error) {
      console.error("Update doctor error:", error);

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Deactivate doctor (soft-delete) - ADMIN only
router.patch(
  "/:doctor_id/deactivate",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { doctor_id } = req.params;

      // Find the doctor
      const existing = await prisma.doctor.findUnique({
        where: { doctor_id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      // Verify the admin belongs to the doctor's hospital
      const admin = await verifyAdminHospital(
        req.user.user_id,
        existing.hospital_id,
        res
      );

      if (!admin) return;

      if (!existing.is_active) {
        return res.status(400).json({
          success: false,
          message: "Doctor is already inactive",
        });
      }

      const doctor = await prisma.doctor.update({
        where: { doctor_id },
        data: { is_active: false },
      });

      return res.status(200).json({
        success: true,
        message: "Doctor deactivated successfully",
        data: doctor,
      });
    } catch (error) {
      console.error("Deactivate doctor error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to deactivate doctor",
      });
    }
  }
);

module.exports = router;
