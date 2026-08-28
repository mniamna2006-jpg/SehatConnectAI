const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");
const {
  notifyPatientForAppointment,
} = require("../services/notification.service");

const router = express.Router();

// Get current patient's queue
router.get(
  "/my",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
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

      const queue = await prisma.queue.findMany({
        where: {
          appointment: {
            patient_id: patient.patient_id,
          },
          queue_status: {
            in: ["WAITING", "CALLED", "IN_PROGRESS"],
          },
        },
        include: {
          appointment: {
            include: {
              doctor: true,
              hospital: true,
              department: true,
            },
          },
        },
        orderBy: {
          token_number: "asc",
        },
      });

      return res.status(200).json({
        success: true,
        data: queue,
      });
    } catch (error) {
      console.error("Get patient queue error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch patient queue",
        error: error.message,
      });
    }
  }
);

// Get current hospital queue
router.get(
  "/hospital",
  authenticateToken,
  authorizeRoles("STAFF"),
  async (req, res) => {
    try {
      const staff = await prisma.hospitalStaff.findUnique({
        where: {
          user_id: req.user.user_id,
        },
      });

      if (!staff || !staff.is_active) {
        return res.status(403).json({
          success: false,
          message: "Active hospital staff profile required",
        });
      }

      const queue = await prisma.queue.findMany({
        where: {
          hospital_id: staff.hospital_id,
          queue_status: {
            in: ["WAITING", "CALLED", "IN_PROGRESS"],
          },
        },
        include: {
          appointment: {
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
            },
          },
        },
        orderBy: {
          token_number: "asc",
        },
      });

      return res.status(200).json({
        success: true,
        data: queue,
      });
    } catch (error) {
      console.error("Get hospital queue error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch hospital queue",
        error: error.message,
      });
    }
  }
);
// Update queue status - STAFF only
router.patch(
  "/:queue_id/status",
  authenticateToken,
  authorizeRoles("STAFF"),
  async (req, res) => {
    try {
      const { queue_id } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        "CALLED",
        "IN_PROGRESS",
        "COMPLETED",
      ];

      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid queue status. Allowed values: ${allowedStatuses.join(
            ", "
          )}`,
        });
      }

      // Find the logged-in staff member
      const staff = await prisma.hospitalStaff.findUnique({
        where: {
          user_id: req.user.user_id,
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

      // Find the queue entry and make sure it belongs
      // to the staff member's hospital
      const queue = await prisma.queue.findFirst({
        where: {
          queue_id,
          hospital_id: staff.hospital_id,
        },
        include: {
          appointment: true,
        },
      });

      if (!queue) {
        return res.status(404).json({
          success: false,
          message: "Queue entry not found in your hospital",
        });
      }

      // Validate the queue status transition
      const validTransitions = {
        WAITING: ["CALLED"],
        CALLED: ["IN_PROGRESS"],
        IN_PROGRESS: ["COMPLETED"],
        COMPLETED: [],
        SKIPPED: [],
      };

      if (!validTransitions[queue.queue_status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${queue.queue_status} to ${status}`,
        });
      }

      // Keep queue and appointment status synchronized
      const result = await prisma.$transaction(async (tx) => {
        const queueData = {
          queue_status: status,
        };

        if (status === "CALLED") {
          queueData.called_at = new Date();
        }

        if (status === "COMPLETED") {
          queueData.completed_at = new Date();
        }

        const updatedQueue = await tx.queue.update({
          where: {
            queue_id,
          },
          data: queueData,
        });

        let appointmentStatus;

        if (status === "IN_PROGRESS") {
          appointmentStatus = "IN_PROGRESS";
        } else if (status === "COMPLETED") {
          appointmentStatus = "COMPLETED";
        }

        let updatedAppointment = queue.appointment;

        if (appointmentStatus) {
          updatedAppointment = await tx.appointment.update({
            where: {
              appointment_id: queue.appointment_id,
            },
            data: {
              status: appointmentStatus,
            },
          });
        }

        return {
          queue: updatedQueue,
          appointment: updatedAppointment,
        };
      });

      return res.status(200).json({
        success: true,
        message: `Queue status updated to ${status}`,
        data: result,
      });
    } catch (error) {
      console.error("Update queue status error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update queue status",
        error: error.message,
      });
    }
  }
);
module.exports = router;
