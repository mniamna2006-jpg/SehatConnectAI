const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");
const { addTime12hFields } = require("../utils/date.helpers");

const SCHEDULE_TIME_FIELDS = { start_time: true, end_time: true };

const router = express.Router();

// Get weekly schedule for a doctor
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        doctor_id: req.params.doctorId,
        is_active: true,
      },
      orderBy: [
        {
          day_of_week: "asc",
        },
        {
          start_time: "asc",
        },
      ],
    });

    res.json({
      success: true,
      data: addTime12hFields(schedules, SCHEDULE_TIME_FIELDS),
    });
  } catch (error) {
    console.error("Get doctor schedule error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor schedule",
    });
  }
});

// Create doctor schedule - ADMIN only
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const {
        doctor_id,
        day_of_week,
        start_time,
        end_time,
        appointment_duration,
      } = req.body;

      if (
        !doctor_id ||
        !day_of_week ||
        !start_time ||
        !end_time ||
        !appointment_duration
      ) {
        return res.status(400).json({
          success: false,
          message:
            "doctor_id, day_of_week, start_time, end_time and appointment_duration are required",
        });
      }

      const admin = await prisma.hospitalAdmin.findUnique({
        where: { user_id: req.user.user_id },
        select: { hospital_id: true },
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Hospital admin profile not found",
        });
      }

      const doctor = await prisma.doctor.findUnique({
        where: { doctor_id },
        select: { hospital_id: true },
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      if (doctor.hospital_id !== admin.hospital_id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to manage this doctor's schedule",
        });
      }

      const schedule = await prisma.doctorSchedule.create({
        data: {
          doctor_id,
          day_of_week,
          start_time,
          end_time,
          appointment_duration: Number(appointment_duration),
        },
      });

      res.status(201).json({
        success: true,
        message: "Doctor schedule created successfully",
        data: schedule,
      });
    } catch (error) {
      console.error("Create doctor schedule error:", error);

      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
