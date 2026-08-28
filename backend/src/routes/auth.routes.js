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
      message: error.message,
    });
  }
});

// Patient registration
router.post("/register/patient", async (req, res) => {
  try {
    const result = await registerPatient(req.body);

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      data: result,
    });
  } catch (error) {
    console.error("Patient registration error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Patient login
router.post("/login", async (req, res) => {
  try {
    const result = await login(req.body);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

// Hospital website login - ADMIN / STAFF
router.post("/login-hospital", async (req, res) => {
  try {
    const result = await loginHospitalUser(req.body);

    return res.status(200).json({
      success: true,
      message: "Hospital login successful",
      data: result,
    });
  } catch (error) {
    console.error("Hospital login error:", error);

    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
