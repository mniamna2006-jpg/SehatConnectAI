const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");
const {
  getPakistanDate,
  getPakistanDayOfWeek,
  formatTime12h,
  addTime12hFields,
} = require("../utils/date.helpers");

const SLOT_TIME_FIELDS = { start_time: true, end_time: true };

/**
 * Add 12-hour companion fields to an appointment and its nested slot.
 */
const enrichAppointment = (apt) => {
  if (!apt) return apt;

  const result = {
    ...apt,
    appointment_time_12h: formatTime12h(apt.appointment_time),
  };

  if (result.slot) {
    result.slot = addTime12hFields(result.slot, SLOT_TIME_FIELDS);
  }

  return result;
};

const router = express.Router();

// ---------------------------------------------------------------------------
// Staff dashboard (STAFF and ADMIN)
// ---------------------------------------------------------------------------

// GET /dashboard — summary data for the staff member's hospital
router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("STAFF", "ADMIN"),
  async (req, res) => {
    try {
      // Resolve the staff member's hospital from the authenticated user
      const staff = await prisma.hospitalStaff.findUnique({
        where: { user_id: req.user.user_id },
        include: {
          hospital: true,
          department: {
            select: { department_id: true, name: true },
          },
        },
      });

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: "Hospital staff profile not found",
        });
      }

      if (!staff.is_active) {
        return res.status(403).json({
          success: false,
          message: "Staff account is inactive",
        });
      }

      if (!staff.hospital.is_active) {
        return res.status(403).json({
          success: false,
          message: "Hospital is inactive",
        });
      }

      const hospital_id = staff.hospital_id;

      // Today's date range in Pakistan Standard Time (Asia/Karachi)
      const todayStart = getPakistanDate();
      const todayEnd = new Date(todayStart);
      todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

      // Run all independent queries in parallel
      const [
        todayAppointments,
        appointmentStatusCounts,
        todayQueueCounts,
        activeDoctorCount,
        doctorsOnScheduleToday,
        activeDepartmentCount,
      ] = await Promise.all([
        // Today's appointments (PKT calendar day)
        prisma.appointment.findMany({
          where: {
            hospital_id,
            appointment_date: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    user_id: true,
                    full_name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            doctor: {
              select: {
                doctor_id: true,
                name: true,
                specialization: true,
              },
            },
            department: {
              select: {
                department_id: true,
                name: true,
              },
            },
            slot: true,
          },
          orderBy: {
            appointment_time: "asc",
          },
        }),

        // Appointment counts grouped by status (today, hospital-scoped)
        prisma.appointment.groupBy({
          by: ["status"],
          where: {
            hospital_id,
            appointment_date: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
          _count: { status: true },
        }),

        // Today's queue summary (PKT calendar day)
        prisma.queue.groupBy({
          by: ["queue_status"],
          where: {
            hospital_id,
            appointment: {
              appointment_date: {
                gte: todayStart,
                lt: todayEnd,
              },
            },
          },
          _count: { queue_status: true },
        }),

        // Total active doctors at the hospital
        prisma.doctor.count({
          where: { hospital_id, is_active: true },
        }),

        // Doctors available today (based on DoctorAvailability day_of_week)
        prisma.doctorAvailability.count({
          where: {
            doctor: { hospital_id },
            day_of_week: getPakistanDayOfWeek(),
            is_available: true,
          },
        }),

        // Active department count
        prisma.department.count({
          where: { hospital_id, is_active: true },
        }),
      ]);

      // Shape appointment status counts into a flat object
      const statusCounts = {};
      for (const group of appointmentStatusCounts) {
        statusCounts[group.status] = group._count.status;
      }

      // Shape queue counts into a flat object
      const queueCounts = {};
      let totalQueueToday = 0;
      for (const group of todayQueueCounts) {
        queueCounts[group.queue_status] = group._count.queue_status;
        totalQueueToday += group._count.queue_status;
      }

      return res.status(200).json({
        success: true,
        data: {
          hospital: {
            hospital_id: staff.hospital.hospital_id,
            name: staff.hospital.name,
            facility_type: staff.hospital.facility_type,
            city: staff.hospital.city,
            phone: staff.hospital.phone,
            email: staff.hospital.email,
            logo_url: staff.hospital.logo_url,
            is_active: staff.hospital.is_active,
          },

          staff_context: {
            staff_id: staff.staff_id,
            employee_id: staff.employee_id,
            position: staff.position,
            department: staff.department,
          },

          departments: {
            active: activeDepartmentCount,
          },

          doctors: {
            active: activeDoctorCount,
            available_today: doctorsOnScheduleToday,
          },

          today_appointments: {
            total: todayAppointments.length,
            by_status: statusCounts,
            list: todayAppointments.map(enrichAppointment),
          },

          today_queue: {
            total: totalQueueToday,
            by_status: queueCounts,
          },
        },
      });
    } catch (error) {
      console.error("Staff dashboard error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch staff dashboard data",
        error: error.message,
      });
    }
  }
);

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

// ---------------------------------------------------------------------------
// Admin staff invitation management (ADMIN only)
// ---------------------------------------------------------------------------

// List invitations for the admin's hospital
router.get(
  "/invitations/hospital/:hospitalId",
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

      const invitations = await prisma.staffInvitation.findMany({
        where: { hospital_id: hospitalId },
        orderBy: { created_at: "desc" },
      });

      return res.status(200).json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      console.error("List invitations error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch invitation list",
      });
    }
  }
);

// Create invitation - ADMIN only
router.post(
  "/invitations",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { hospital_id, email, employee_id, position, department_id } =
        req.body;

      // Required fields
      if (!hospital_id || !email || !employee_id || !position) {
        return res.status(400).json({
          success: false,
          message:
            "hospital_id, email, employee_id and position are required",
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
          message: "Cannot invite staff to an inactive hospital",
        });
      }

      // Validate email format
      if (typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Email must be a non-empty string",
        });
      }

      if (typeof employee_id !== "string" || employee_id.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Employee ID must be a non-empty string",
        });
      }

      if (typeof position !== "string" || position.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Position must be a non-empty string",
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
            message: "Cannot assign invitation to an inactive department",
          });
        }
      }

      // Check for existing PENDING invitation for same email + hospital
      const existingInvitation = await prisma.staffInvitation.findFirst({
        where: {
          hospital_id,
          email: email.trim().toLowerCase(),
          status: "PENDING",
        },
      });

      if (existingInvitation) {
        return res.status(400).json({
          success: false,
          message:
            "A pending invitation already exists for this email at this hospital",
        });
      }

      // Check if a user with this email already exists
      const existingUser = await prisma.user.findFirst({
        where: { email: email.trim().toLowerCase() },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "A user with this email already exists",
        });
      }

      // Generate invitation token and set expiry (7 days)
      const invitation_token = crypto.randomUUID();
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 7);

      const invitation = await prisma.staffInvitation.create({
        data: {
          hospital_id,
          email: email.trim().toLowerCase(),
          employee_id: employee_id.trim(),
          position: position.trim(),
          department_id: department_id || null,
          invitation_token,
          expires_at,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Invitation created successfully",
        data: invitation,
      });
    } catch (error) {
      console.error("Create invitation error:", error);

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Revoke invitation - ADMIN only
router.patch(
  "/invitations/:invitation_id/revoke",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { invitation_id } = req.params;

      // Find the invitation
      const invitation = await prisma.staffInvitation.findUnique({
        where: { invitation_id },
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: "Invitation not found",
        });
      }

      // Verify admin ownership of the invitation's hospital
      const admin = await verifyAdminHospital(
        req.user.user_id,
        invitation.hospital_id,
        res
      );

      if (!admin) return;

      if (invitation.status !== "PENDING") {
        return res.status(400).json({
          success: false,
          message: `Cannot revoke an invitation with status ${invitation.status}`,
        });
      }

      const updated = await prisma.staffInvitation.update({
        where: { invitation_id },
        data: { status: "REVOKED" },
      });

      return res.status(200).json({
        success: true,
        message: "Invitation revoked successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Revoke invitation error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to revoke invitation",
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Public invitation endpoints (no authentication required)
// ---------------------------------------------------------------------------

// Get invitation details by token (for the invitee)
router.get("/invitations/token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.staffInvitation.findUnique({
      where: { invitation_token: token },
      include: {
        hospital: {
          select: {
            hospital_id: true,
            name: true,
            city: true,
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

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `This invitation is no longer pending (status: ${invitation.status})`,
      });
    }

    if (invitation.expires_at < new Date()) {
      // Auto-expire if past expiry date
      await prisma.staffInvitation.update({
        where: { invitation_id: invitation.invitation_id },
        data: { status: "EXPIRED" },
      });

      return res.status(400).json({
        success: false,
        message: "This invitation has expired",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        invitation_id: invitation.invitation_id,
        email: invitation.email,
        employee_id: invitation.employee_id,
        position: invitation.position,
        expires_at: invitation.expires_at,
        hospital: invitation.hospital,
        department: invitation.department,
      },
    });
  } catch (error) {
    console.error("Get invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invitation details",
    });
  }
});

// Accept invitation (creates user account + staff record)
router.post("/invitations/accept", async (req, res) => {
  try {
    const { invitation_token, full_name, password } = req.body;

    // Required fields
    if (!invitation_token || !full_name || !password) {
      return res.status(400).json({
        success: false,
        message: "invitation_token, full_name and password are required",
      });
    }

    // Validate fields
    if (typeof full_name !== "string" || full_name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Full name must be a non-empty string",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Find invitation by token
    const invitation = await prisma.staffInvitation.findUnique({
      where: { invitation_token },
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    // Check status
    if (invitation.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `This invitation is no longer pending (status: ${invitation.status})`,
      });
    }

    // Check expiry
    if (invitation.expires_at < new Date()) {
      await prisma.staffInvitation.update({
        where: { invitation_id: invitation.invitation_id },
        data: { status: "EXPIRED" },
      });

      return res.status(400).json({
        success: false,
        message: "This invitation has expired",
      });
    }

    // Check if user already exists with this email
    const existingUser = await prisma.user.findFirst({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists. Please login instead.",
      });
    }

    // Create User + HospitalStaff + mark invitation ACCEPTED in a transaction
    const password_hash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          full_name: full_name.trim(),
          email: invitation.email,
          password_hash,
          role: "STAFF",
        },
      });

      const staff = await tx.hospitalStaff.create({
        data: {
          user_id: user.user_id,
          hospital_id: invitation.hospital_id,
          employee_id: invitation.employee_id,
          position: invitation.position,
          department_id: invitation.department_id || null,
        },
        include: {
          user: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
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

      await tx.staffInvitation.update({
        where: { invitation_id: invitation.invitation_id },
        data: { status: "ACCEPTED" },
      });

      return staff;
    });

    return res.status(201).json({
      success: true,
      message: "Invitation accepted. Staff account created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
