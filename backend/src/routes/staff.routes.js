const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

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
      message: "You do not have permission to manage staff in this hospital",
    });
    return null;
  }

  return admin;
};

// ---------------------------------------------------------------------------
// Admin staff management (ADMIN only)
// ---------------------------------------------------------------------------

// List staff for the admin's hospital
router.get(
  "/hospital/:hospitalId",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { hospitalId } = req.params;

      // Verify admin ownership
      const admin = await verifyAdminHospital(
        req.user.user_id,
        hospitalId,
        res
      );

      if (!admin) return;

      const staff = await prisma.hospitalStaff.findMany({
        where: { hospital_id: hospitalId },
        include: {
          user: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
              phone: true,
              is_active: true,
            },
          },
          department: {
            select: {
              department_id: true,
              name: true,
              is_active: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return res.status(200).json({
        success: true,
        data: staff,
      });
    } catch (error) {
      console.error("List staff error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch staff list",
      });
    }
  }
);

// Create staff - ADMIN only (with hospital ownership check)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const {
        hospital_id,
        department_id,
        employee_id,
        position,
        full_name,
        email,
        phone,
        password,
      } = req.body;

      // Required fields
      if (
        !hospital_id ||
        !employee_id ||
        !position ||
        !full_name ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "hospital_id, employee_id, position, full_name and password are required",
        });
      }

      // At least email or phone is needed for login
      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: "Either email or phone is required",
        });
      }

      // Verify admin ownership
      const admin = await verifyAdminHospital(
        req.user.user_id,
        hospital_id,
        res
      );

      if (!admin) return;

      // Validate hospital is active
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
          message: "Cannot add staff to an inactive hospital",
        });
      }

      // Field validation
      if (typeof full_name !== "string" || full_name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Full name must be a non-empty string",
        });
      }

      if (typeof position !== "string" || position.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Position must be a non-empty string",
        });
      }

      if (typeof employee_id !== "string" || employee_id.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Employee ID must be a non-empty string",
        });
      }

      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      // Validate department if provided
      if (department_id) {
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
            message: "Cannot assign staff to an inactive department",
          });
        }
      }

      // Check for existing user with same email/phone
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "A user with this email or phone already exists",
        });
      }

      // Create User + HospitalStaff in a transaction
      const password_hash = await bcrypt.hash(password, 12);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            full_name: full_name.trim(),
            email: email || null,
            phone: phone || null,
            password_hash,
            role: "STAFF",
          },
        });

        const staff = await tx.hospitalStaff.create({
          data: {
            user_id: user.user_id,
            hospital_id,
            employee_id: employee_id.trim(),
            position: position.trim(),
            department_id: department_id || null,
          },
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true,
                phone: true,
                is_active: true,
              },
            },
            department: {
              select: {
                department_id: true,
                name: true,
              },
            },
          },
        });

        return staff;
      });

      return res.status(201).json({
        success: true,
        message: "Staff member created successfully",
        data: result,
      });
    } catch (error) {
      console.error("Create staff error:", error);

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Update staff - ADMIN only
router.patch(
  "/:staff_id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { staff_id } = req.params;
      const {
        position,
        employee_id,
        department_id,
        full_name,
        email,
        phone,
      } = req.body;

      // Find the staff record
      const existing = await prisma.hospitalStaff.findUnique({
        where: { staff_id },
        include: { user: true },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Staff member not found",
        });
      }

      // Verify admin ownership
      const admin = await verifyAdminHospital(
        req.user.user_id,
        existing.hospital_id,
        res
      );

      if (!admin) return;

      // Build update data for HospitalStaff and User separately
      const staffUpdate = {};
      const userUpdate = {};

      if (position !== undefined) {
        if (typeof position !== "string" || position.trim() === "") {
          return res.status(400).json({
            success: false,
            message: "Position must be a non-empty string",
          });
        }

        staffUpdate.position = position.trim();
      }

      if (employee_id !== undefined) {
        if (typeof employee_id !== "string" || employee_id.trim() === "") {
          return res.status(400).json({
            success: false,
            message: "Employee ID must be a non-empty string",
          });
        }

        staffUpdate.employee_id = employee_id.trim();
      }

      // Department reassignment — must be within the same hospital
      if (department_id !== undefined) {
        if (department_id === null) {
          // Allow removing department assignment
          staffUpdate.department_id = null;
        } else {
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
                "Cannot assign staff to a department in a different hospital",
            });
          }

          if (!department.is_active) {
            return res.status(400).json({
              success: false,
              message: "Cannot assign staff to an inactive department",
            });
          }

          staffUpdate.department_id = department_id;
        }
      }

      if (full_name !== undefined) {
        if (typeof full_name !== "string" || full_name.trim() === "") {
          return res.status(400).json({
            success: false,
            message: "Full name must be a non-empty string",
          });
        }

        userUpdate.full_name = full_name.trim();
      }

      if (email !== undefined) {
        if (email !== null && typeof email !== "string") {
          return res.status(400).json({
            success: false,
            message: "Email must be a string or null",
          });
        }

        userUpdate.email = email;
      }

      if (phone !== undefined) {
        if (phone !== null && typeof phone !== "string") {
          return res.status(400).json({
            success: false,
            message: "Phone must be a string or null",
          });
        }

        userUpdate.phone = phone;
      }

      if (
        Object.keys(staffUpdate).length === 0 &&
        Object.keys(userUpdate).length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No valid fields to update. Allowed: position, employee_id, department_id, full_name, email, phone",
        });
      }

      // Check email/phone uniqueness if being changed
      if (userUpdate.email || userUpdate.phone) {
        const conflict = await prisma.user.findFirst({
          where: {
            AND: [
              { user_id: { not: existing.user_id } },
              {
                OR: [
                  ...(userUpdate.email ? [{ email: userUpdate.email }] : []),
                  ...(userUpdate.phone ? [{ phone: userUpdate.phone }] : []),
                ],
              },
            ],
          },
        });

        if (conflict) {
          return res.status(400).json({
            success: false,
            message: "Email or phone is already in use by another user",
          });
        }
      }

      // Apply updates in a transaction
      const result = await prisma.$transaction(async (tx) => {
        if (Object.keys(userUpdate).length > 0) {
          await tx.user.update({
            where: { user_id: existing.user_id },
            data: userUpdate,
          });
        }

        if (Object.keys(staffUpdate).length > 0) {
          await tx.hospitalStaff.update({
            where: { staff_id },
            data: staffUpdate,
          });
        }

        return tx.hospitalStaff.findUnique({
          where: { staff_id },
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true,
                phone: true,
                is_active: true,
              },
            },
            department: {
              select: {
                department_id: true,
                name: true,
                is_active: true,
              },
            },
          },
        });
      });

      return res.status(200).json({
        success: true,
        message: "Staff member updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Update staff error:", error);

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Deactivate staff (soft-delete) - ADMIN only
router.patch(
  "/:staff_id/deactivate",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { staff_id } = req.params;

      // Find the staff record
      const existing = await prisma.hospitalStaff.findUnique({
        where: { staff_id },
        include: { user: true },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Staff member not found",
        });
      }

      // Verify admin ownership
      const admin = await verifyAdminHospital(
        req.user.user_id,
        existing.hospital_id,
        res
      );

      if (!admin) return;

      if (!existing.is_active && !existing.user.is_active) {
        return res.status(400).json({
          success: false,
          message: "Staff member is already inactive",
        });
      }

      // Deactivate both HospitalStaff and User in a transaction
      const result = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { user_id: existing.user_id },
          data: { is_active: false },
        });

        return tx.hospitalStaff.update({
          where: { staff_id },
          data: { is_active: false },
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true,
                phone: true,
                is_active: true,
              },
            },
            department: {
              select: {
                department_id: true,
                name: true,
              },
            },
          },
        });
      });

      return res.status(200).json({
        success: true,
        message: "Staff member deactivated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Deactivate staff error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to deactivate staff member",
      });
    }
  }
);

module.exports = router;
