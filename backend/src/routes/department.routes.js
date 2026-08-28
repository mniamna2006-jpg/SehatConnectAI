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

// Create department - ADMIN only
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

      const department = await prisma.department.create({
        data: {
          hospital_id,
          name,
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

module.exports = router;
