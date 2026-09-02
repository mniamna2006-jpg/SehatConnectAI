const express = require("express");

const prisma = require("../config/prisma");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const { getPakistanDate, formatTime12h, addTime12hFields } = require("../utils/date.helpers");

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

// GET /api/admin/dashboard — ADMIN only
router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      // Resolve the admin's hospital
      const admin = await prisma.hospitalAdmin.findUnique({
        where: {
          user_id: req.user.user_id,
        },
        include: {
          hospital: true,
        },
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Hospital admin profile not found",
        });
      }

      if (!admin.hospital.is_active) {
        return res.status(403).json({
          success: false,
          message: "Hospital is inactive",
        });
      }

      const hospital_id = admin.hospital.hospital_id;

      // Today's date range in Pakistan Standard Time (Asia/Karachi)
      const todayStart = getPakistanDate();

      const todayEnd = new Date(todayStart);

      todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

      // Run all independent queries in parallel
      const [
        totalDepartments,
        activeDepartments,
        totalDoctors,
        activeDoctors,
        totalStaff,
        activeStaff,
        totalPatients,
        todayAppointments,
        appointmentStatusCounts,
        todayQueueCounts,
      ] = await Promise.all([
        // Department counts
        prisma.department.count({
          where: { hospital_id },
        }),

        prisma.department.count({
          where: { hospital_id, is_active: true },
        }),

        // Doctor counts
        prisma.doctor.count({
          where: { hospital_id },
        }),

        prisma.doctor.count({
          where: { hospital_id, is_active: true },
        }),

        // Staff counts
        prisma.hospitalStaff.count({
          where: { hospital_id },
        }),

        prisma.hospitalStaff.count({
          where: { hospital_id, is_active: true },
        }),

        // Patients with at least one appointment at this hospital
        prisma.patient.count({
          where: {
            appointments: { some: { hospital_id } },
          },
        }),

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
            doctor: true,
            department: true,
            slot: true,
          },
          orderBy: {
            appointment_time: "asc",
          },
        }),

        // Appointment counts grouped by status
        prisma.appointment.groupBy({
          by: ["status"],
          where: { hospital_id },
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
            hospital_id: admin.hospital.hospital_id,
            name: admin.hospital.name,
            facility_type: admin.hospital.facility_type,
            city: admin.hospital.city,
            phone: admin.hospital.phone,
            email: admin.hospital.email,
            logo_url: admin.hospital.logo_url,
            cover_image_url: admin.hospital.cover_image_url,
            theme: admin.hospital.theme,
            is_active: admin.hospital.is_active,
          },

          departments: {
            total: totalDepartments,
            active: activeDepartments,
          },

          doctors: {
            total: totalDoctors,
            active: activeDoctors,
          },

          staff: {
            total: totalStaff,
            active: activeStaff,
          },

          patients: {
            total: totalPatients,
          },

          today_appointments: todayAppointments.map(enrichAppointment),

          appointment_counts: {
            total: Object.values(statusCounts).reduce(
              (sum, c) => sum + c,
              0
            ),
            by_status: statusCounts,
          },

          today_queue: {
            total: totalQueueToday,
            by_status: queueCounts,
          },
        },
      });
    } catch (error) {
      console.error("Admin dashboard error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch admin dashboard data",
        error: error.message,
      });
    }
  }
);

module.exports = router;
