const express = require("express");
const {
  registerPatient,
  login,
  loginHospitalUser,
  getCurrentUser,
} = require("../services/auth.service");

const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Get currently authenticated user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.user_id);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(401).json({
      success: false,
      message: error.message,cd
    });
  }
});
// Patient registration
router.post("/register/patient", async (req, res) => {
  try {
    const result = await registerPatient(req.body);

    res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      data: result,
    });
  } catch (error) {
    console.error("Patient registration error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const result = await login(req.body);

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

// Get currently authenticated user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        user_id: req.user.user_id,
      },
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
        patient: {
          select: {
            patient_id: true,
            date_of_birth: true,
            gender: true,
            address: true,
            city: true,
            emergency_contact: true,
          },
        },
        hospital_admin: {
          select: {
            admin_id: true,
            hospital_id: true,
            employee_id: true,
          },
        },
        hospital_staff: {
          select: {
            staff_id: true,
            hospital_id: true,
            employee_id: true,
            department_id: true,
            position: true,
            is_active: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch current user",
      error: error.message,
    });
  }
});

// Hospital website login (ADMIN / STAFF)
router.post("/login-hospital", async (req, res) => {
  try {
    const result = await loginHospitalUser(req.body);

    res.json({
      success: true,
      message: "Hospital login successful",
      data: result,
    });
  } catch (error) {
    console.error("Hospital login error:", error);

    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});
module.exports = router;