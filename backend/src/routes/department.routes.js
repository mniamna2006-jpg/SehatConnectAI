const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Get departments for a hospital
router.get("/hospital/:hospitalId", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: {
        hospital_id: req.params.hospitalId,
        is_active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
});

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
      message: "You do not have permission to manage this hospital's departments",
    });
    return null;
  }

  return admin;
};

// Create department - ADMIN only (with hospital ownership check)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { hospital_id, name, description } = req.body;

      if (!hospital_id || !name) {
        return res.status(400).json({
          success: false,
          message: "hospital_id and name are required",
        });
      }

      // Verify the admin belongs to the target hospital
      const admin = await verifyAdminHospital(
        req.user.user_id,
        hospital_id,
        res
      );

      if (!admin) return;

      // Verify the hospital exists and is active
      const hospital = await prisma.hospital.findUnique({
        where: { hospital_id },
      });

      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: "Hospital not found",
        });
      }

      if (!hospital.is_active) {
        return res.status(403).json({
          success: false,
          message: "Cannot add departments to an inactive hospital",
        });
      }

      if (
        typeof name !== "string" ||
        name.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Department name must be a non-empty string",
        });
      }

      if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Description must be a string or null",
        });
      }

      const department = await prisma.department.create({
        data: {
          hospital_id,
          name: name.trim(),
          description: description || null,
        },
      });

      res.status(201).json({
        success: true,
        message: "Department created successfully",
        data: department,
      });
    } catch (error) {
      console.error("Create department error:", error);

      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Update department - ADMIN only
router.patch(
  "/:department_id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { department_id } = req.params;
      const { name, description } = req.body;

      // Find the department
      const existing = await prisma.department.findUnique({
        where: { department_id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      // Verify the admin belongs to the department's hospital
      const admin = await verifyAdminHospital(
        req.user.user_id,
        existing.hospital_id,
        res
      );

      if (!admin) return;

      // Build update data
      const updateData = {};

      if (name !== undefined) {
        if (
          typeof name !== "string" ||
          name.trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            message: "Department name must be a non-empty string",
          });
        }

        updateData.name = name.trim();
      }

      if (description !== undefined) {
        if (description !== null && typeof description !== "string") {
          return res.status(400).json({
            success: false,
            message: "Description must be a string or null",
          });
        }

        updateData.description = description;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid fields to update. Allowed fields: name, description",
        });
      }

      const department = await prisma.department.update({
        where: { department_id },
        data: updateData,
      });

      return res.status(200).json({
        success: true,
        message: "Department updated successfully",
        data: department,
      });
    } catch (error) {
      console.error("Update department error:", error);

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Deactivate department (soft-delete) - ADMIN only
router.patch(
  "/:department_id/deactivate",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { department_id } = req.params;

      // Find the department
      const existing = await prisma.department.findUnique({
        where: { department_id },
        include: {
          doctors: {
            where: { is_active: true },
            select: { doctor_id: true },
          },
        },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      // Verify the admin belongs to the department's hospital
      const admin = await verifyAdminHospital(
        req.user.user_id,
        existing.hospital_id,
        res
      );

      if (!admin) return;

      if (!existing.is_active) {
        return res.status(400).json({
          success: false,
          message: "Department is already inactive",
        });
      }

      // Warn if there are active doctors in the department
      if (existing.doctors.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot deactivate: department has ${existing.doctors.length} active doctor(s). Reassign or deactivate them first.`,
        });
      }

      const department = await prisma.department.update({
        where: { department_id },
        data: { is_active: false },
      });

      return res.status(200).json({
        success: true,
        message: "Department deactivated successfully",
        data: department,
      });
    } catch (error) {
      console.error("Deactivate department error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to deactivate department",
      });
    }
  }
);

module.exports = router;
