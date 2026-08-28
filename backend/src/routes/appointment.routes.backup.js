const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Get patient's appointments
router.get(
  "/my",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    console.log("GET /api/appointments/my reached");
    console.log("Authenticated user:", req.user);

    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          patient: {
            user_id: req.user.user_id,
          },
        },
        include: {
          doctor: true,
          hospital: true,
          department: true,
          slot: true,
        },
        orderBy: {
          appointment_date: "desc",
        },
      });

      console.log("Patient appointments found:", appointments.length);

      return res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      console.error("Get patient appointments error:");
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch appointments",
        error: error.message,
      });
    }
  }
);

// Book an appointment
router.post(
  "/",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const {
        doctor_id,
        hospital_id,
        department_id,
        slot_id,
        reason,
      } = req.body;

      if (
        !doctor_id ||
        !hospital_id ||
        !department_id ||
        !slot_id
      ) {
        return res.status(400).json({
          success: false,
          message:
            "doctor_id, hospital_id, department_id and slot_id are required",
        });
      }

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

      const slot = await prisma.timeSlot.findUnique({
        where: {
          slot_id,
        },
      });

      if (!slot) {
        return res.status(404).json({
          success: false,
          message: "Time slot not found",
        });
      }

      if (slot.status !== "AVAILABLE") {
        return res.status(400).json({
          success: false,
          message: "This time slot is no longer available",
        });
      }

      if (
        slot.doctor_id !== doctor_id ||
        slot.hospital_id !== hospital_id
      ) {
        return res.status(400).json({
          success: false,
          message: "Time slot does not match doctor or hospital",
        });
      }

      const bookingReference =
        "APT-" +
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();

      const appointment = await prisma.$transaction(async (tx) => {
        const updatedSlot = await tx.timeSlot.updateMany({
          where: {
            slot_id,
            status: "AVAILABLE",
          },
          data: {
            status: "BOOKED",
          },
        });

        if (updatedSlot.count !== 1) {
          throw new Error("This time slot is no longer available");
        }

        return tx.appointment.create({
          data: {
            patient_id: patient.patient_id,
            doctor_id,
            hospital_id,
            department_id,
            slot_id,
            appointment_date: slot.date,
            appointment_time: slot.start_time,
            status: "BOOKED",
            booking_reference: bookingReference,
            reason: reason || null,
          },
        });
      });

      return res.status(201).json({
        success: true,
        message: "Appointment booked successfully",
        data: appointment,
      });
    } catch (error) {
      console.error("Book appointment error:");
      console.error(error);

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Get hospital appointments for STAFF
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

      const appointments = await prisma.appointment.findMany({
        where: {
          hospital_id: staff.hospital_id,
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
                  role: true,
                  profile_picture: true,
                  preferred_language: true,
                  location: true,
                  is_active: true,
                  created_at: true,
                  updated_at: true,
                  last_login: true,
                },
              },
            },
          },
          doctor: true,
          department: true,
          slot: true,
        },
        orderBy: [
          {
            appointment_date: "asc",
          },
          {
            appointment_time: "asc",
          },
        ],
      });

      return res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      console.error("Get hospital appointments error:");
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch hospital appointments",
      });
    }
  }
);
// Get a single patient's appointment
router.get(
  "/:appointment_id",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const { appointment_id } = req.params;

      const appointment = await prisma.appointment.findFirst({
        where: {
          appointment_id,
          patient: {
            user_id: req.user.user_id,
          },
        },
        include: {
          doctor: true,
          hospital: true,
          department: true,
          slot: true,
        },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      console.error("Get single appointment error:");
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch appointment",
      });
    }
  }
);

// Cancel a patient's appointment
router.patch(
  "/:appointment_id/cancel",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const { appointment_id } = req.params;

      const appointment = await prisma.appointment.findFirst({
        where: {
          appointment_id,
          patient: {
            user_id: req.user.user_id,
          },
        },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      if (
        appointment.status !== "BOOKED" &&
        appointment.status !== "CONFIRMED"
      ) {
        return res.status(400).json({
          success: false,
          message: "This appointment cannot be cancelled",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const cancelledAppointment = await tx.appointment.update({
          where: {
            appointment_id,
          },
          data: {
            status: "CANCELLED",
          },
        });

        await tx.timeSlot.update({
          where: {
            slot_id: appointment.slot_id,
          },
          data: {
            status: "AVAILABLE",
          },
        });

        return cancelledAppointment;
      });

      return res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully",
        data: result,
      });
    } catch (error) {
      console.error("Cancel appointment error:");
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to cancel appointment",
        error: error.message,
      });
    }
  }
);
// Update appointment status - STAFF only
router.patch(
  "/:appointment_id/status",
  authenticateToken,
  authorizeRoles("STAFF"),
  async (req, res) => {
    try {
      const { appointment_id } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        "BOOKED",
        "CONFIRMED",
        "CHECKED_IN",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ];

      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
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

      // Make sure the appointment belongs to the staff member's hospital
      const appointment = await prisma.appointment.findFirst({
        where: {
          appointment_id,
          hospital_id: staff.hospital_id,
        },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found in your hospital",
        });
      }

      // Update appointment status
      const updatedAppointment = await prisma.appointment.update({
        where: {
          appointment_id,
        },
        data: {
          status,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Appointment status updated successfully",
        data: updatedAppointment,
      });
    } catch (error) {
      console.error("Update appointment status error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update appointment status",
        error: error.message,
      });
    }
  }
);
module.exports = router;
