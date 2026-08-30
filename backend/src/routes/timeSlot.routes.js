const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");
const { getPakistanDayOfWeekForDate } = require("../utils/date.helpers");

const router = express.Router();

// Get time slots for a doctor on a specific date
router.get("/doctor/:doctorId/date/:date", async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    const slots = await prisma.timeSlot.findMany({
      where: {
        doctor_id: doctorId,
        date: new Date(`${date}T00:00:00.000Z`),
      },
      orderBy: {
        start_time: "asc",
      },
    });

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error("Get time slots error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch time slots",
    });
  }
});

// Generate time slots - ADMIN only
router.post(
  "/generate",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { doctor_id, hospital_id, date } = req.body;

      if (!doctor_id || !hospital_id || !date) {
        return res.status(400).json({
          success: false,
          message: "doctor_id, hospital_id and date are required",
        });
      }

      const requestedDate = new Date(`${date}T00:00:00.000Z`);

      if (Number.isNaN(requestedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }

      const dayOfWeek = getPakistanDayOfWeekForDate(requestedDate);

      const schedule = await prisma.doctorSchedule.findFirst({
        where: {
          doctor_id,
          day_of_week: dayOfWeek,
          is_active: true,
        },
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: `Doctor has no active schedule for ${dayOfWeek}`,
        });
      }

      const [startHour, startMinute] = schedule.start_time
        .split(":")
        .map(Number);

      const [endHour, endMinute] = schedule.end_time
        .split(":")
        .map(Number);

      let currentMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      const slots = [];

      while (currentMinutes + schedule.appointment_duration <= endMinutes) {
        const nextMinutes =
          currentMinutes + schedule.appointment_duration;

        const formatTime = (minutes) => {
          const hour = Math.floor(minutes / 60);
          const minute = minutes % 60;

          return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
            2,
            "0"
          )}`;
        };

        const start_time = formatTime(currentMinutes);
        const end_time = formatTime(nextMinutes);

        const slot = await prisma.timeSlot.create({
          data: {
            doctor_id,
            hospital_id,
            date: requestedDate,
            start_time,
            end_time,
            status: "AVAILABLE",
          },
        });

        slots.push(slot);

        currentMinutes = nextMinutes;
      }

      res.status(201).json({
        success: true,
        message: "Time slots generated successfully",
        data: slots,
      });
    } catch (error) {
      console.error("Generate time slots error:", error);

      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;