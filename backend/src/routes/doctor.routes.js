const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");
const { addTime12hFields } = require("../utils/date.helpers");

const SCHEDULE_TIME_FIELDS = { start_time: true, end_time: true };

const router = express.Router();
// Get doctor profile

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
// Create doctor - ADMIN only
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

      const doctor = await prisma.doctor.create({
        data: {
          hospital_id,
          department_id,
          name,
          specialization,
          qualification: qualification || null,
          license_number,
          bio: bio || null,
          consultation_fee:
            consultation_fee !== undefined
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

module.exports = router;
