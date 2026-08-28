const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

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
      data: schedules,
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
