const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");
const { addTime12hFields } = require("../utils/date.helpers");

const SCHEDULE_TIME_FIELDS = { start_time: true, end_time: true };

const router = express.Router();

const getPatientProfile = (userId) =>
  prisma.patient.findUnique({
    where: { user_id: userId },
    select: { patient_id: true },
  });

const getDoctorAvailabilityTarget = (doctorId) =>
  prisma.doctor.findUnique({
    where: { doctor_id: doctorId },
    include: {
      hospital: { select: { is_active: true } },
    },
  });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verify the logged-in ADMIN owns the given hospital.
 * Returns the admin record on success, or null (and sends an error response).
 */
const verifyAdminHospital = async (userId, hospitalId, res) => {
  const admin = await prisma.hospitalAdmin.findUnique({
    where: { user_id: userId },
  });

  if (!admin) {
    res.status(404).json({
      success: false,
      message: "Hospital admin profile not found",
    });
    return null;
  }

  if (admin.hospital_id !== hospitalId) {
    res.status(403).json({
      success: false,
      message: "You do not have permission to manage doctors in this hospital",
    });
    return null;
  }

  return admin;
};

// ---------------------------------------------------------------------------
// Patient-facing (public) endpoints
// ---------------------------------------------------------------------------

// Get active doctors for a hospital
router.get("/hospital/:hospitalId", async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        hospital_id: req.params.hospitalId,
        is_active: true,
        hospital: { is_active: true },
        department: { is_active: true },
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
        hospital: { is_active: true },
        department: { is_active: true },
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

// Get doctor profile
router.get("/:doctor_id", async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const doctor = await prisma.doctor.findFirst({
      where: {
        doctor_id,
        is_active: true,
        hospital: { is_active: true },
        department: { is_active: true },
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

// ---------------------------------------------------------------------------
// Admin doctor management (ADMIN only)
// ---------------------------------------------------------------------------

// Set temporary doctor availability - ADMIN only
router.patch(
  "/:doctor_id/availability",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { doctor_id } = req.params;
      const { is_available } = req.body;

      if (typeof is_available !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "is_available must be a boolean",
        });
      }

      const doctor = await getDoctorAvailabilityTarget(doctor_id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const admin = await verifyAdminHospital(
        req.user.user_id,
        doctor.hospital_id,
        res
      );
      if (!admin) return;

      if (!doctor.is_active) {
        return res.status(400).json({
          success: false,
          message: "Cannot change availability for an inactive doctor",
        });
      }

      if (!doctor.hospital?.is_active) {
        return res.status(403).json({
          success: false,
          message: "Hospital is inactive",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const changed = await tx.doctor.updateMany({
          where: {
            doctor_id,
            hospital_id: doctor.hospital_id,
            is_active: true,
            is_available: { not: is_available },
          },
          data: { is_available },
        });

        let notificationsCreated = 0;
        if (changed.count === 1 && is_available) {
          const subscriptions =
            await tx.doctorAvailabilitySubscription.findMany({
              where: {
                doctor_id,
                patient: { user: { is_active: true } },
              },
              select: {
                patient: { select: { user_id: true } },
              },
            });

          if (subscriptions.length > 0) {
            const created = await tx.notification.createMany({
              data: subscriptions.map(({ patient }) => ({
                user_id: patient.user_id,
                type: "DOCTOR_AVAILABILITY",
                title: "Doctor Available",
                message: `${doctor.name} is now available.`,
              })),
            });
            notificationsCreated = created.count;
          }
        }

        const updatedDoctor = await tx.doctor.findUnique({
          where: { doctor_id },
        });

        return {
          doctor: updatedDoctor,
          changed: changed.count === 1,
          notifications_created: notificationsCreated,
        };
      });

      return res.status(200).json({
        success: true,
        message: result.changed
          ? "Doctor availability updated successfully"
          : "Doctor availability is unchanged",
        data: {
          ...result.doctor,
          notifications_created: result.notifications_created,
        },
      });
    } catch (error) {
      console.error("Update doctor availability error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update doctor availability",
      });
    }
  }
);

// Get current patient's availability alert subscription state
router.get(
  "/:doctor_id/availability-subscription",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const { doctor_id } = req.params;
      const [patient, doctor] = await Promise.all([
        getPatientProfile(req.user.user_id),
        getDoctorAvailabilityTarget(doctor_id),
      ]);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      if (!doctor || !doctor.is_active || !doctor.hospital?.is_active) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const subscription =
        await prisma.doctorAvailabilitySubscription.findUnique({
          where: {
            patient_id_doctor_id: {
              patient_id: patient.patient_id,
              doctor_id,
            },
          },
          select: { subscription_id: true },
        });

      return res.status(200).json({
        success: true,
        data: {
          doctor_id,
          subscribed: Boolean(subscription),
          is_available: doctor.is_available,
        },
      });
    } catch (error) {
      console.error("Get doctor availability subscription error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch availability subscription",
      });
    }
  }
);

// Subscribe current patient to future availability alerts
router.post(
  "/:doctor_id/availability-subscription",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const { doctor_id } = req.params;
      const [patient, doctor] = await Promise.all([
        getPatientProfile(req.user.user_id),
        getDoctorAvailabilityTarget(doctor_id),
      ]);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      if (!doctor || !doctor.is_active || !doctor.hospital?.is_active) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      await prisma.doctorAvailabilitySubscription.upsert({
        where: {
          patient_id_doctor_id: {
            patient_id: patient.patient_id,
            doctor_id,
          },
        },
        update: {},
        create: {
          patient_id: patient.patient_id,
          doctor_id,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Availability alert subscription active",
        data: {
          doctor_id,
          subscribed: true,
          is_available: doctor.is_available,
        },
      });
    } catch (error) {
      console.error("Subscribe to doctor availability error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to subscribe to availability alerts",
      });
    }
  }
);

// Unsubscribe current patient from availability alerts
router.delete(
  "/:doctor_id/availability-subscription",
  authenticateToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const { doctor_id } = req.params;
      const patient = await getPatientProfile(req.user.user_id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      await prisma.doctorAvailabilitySubscription.deleteMany({
        where: {
          patient_id: patient.patient_id,
          doctor_id,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Availability alert subscription removed",
        data: { doctor_id, subscribed: false },
      });
    } catch (error) {
      console.error("Unsubscribe from doctor availability error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to unsubscribe from availability alerts",
      });
    }
  }
);

// Create doctor - ADMIN only (with hospital ownership check)
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

      // Verify the admin belongs to the target hospital
      const admin = await verifyAdminHospital(
        req.user.user_id,
        hospital_id,
        res
      );

      if (!admin) return;

      // Verify the department belongs to the same hospital
      const department = await prisma.department.findUnique({
        where: { department_id },
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      if (department.hospital_id !== hospital_id) {
        return res.status(400).json({
          success: false,
          message: "Department does not belong to the specified hospital",
        });
      }

      if (!department.is_active) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign doctor to an inactive department",
        });
      }

      // Basic field validation
      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Doctor name must be a non-empty string",
        });
      }

      if (typeof specialization !== "string" || specialization.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Specialization must be a non-empty string",
        });
      }

      if (typeof license_number !== "string" || license_number.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "License number must be a non-empty string",
        });
      }

      if (
        consultation_fee !== undefined &&
        consultation_fee !== null &&
        (typeof consultation_fee !== "number" || consultation_fee < 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Consultation fee must be a non-negative number or null",
        });
      }

      const doctor = await prisma.doctor.create({
        data: {
          hospital_id,
          department_id,
          name: name.trim(),
          specialization: specialization.trim(),
          qualification: qualification || null,
          license_number: license_number.trim(),
          bio: bio || null,
          consultation_fee:
            consultation_fee !== undefined && consultation_fee !== null
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

// Update doctor - ADMIN only
router.patch(
  "/:doctor_id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { doctor_id } = req.params;
      const {
        name,
        specialization,
        qualification,
        license_number,
        bio,
        consultation_fee,
        department_id,
      } = req.body;

      // Find the existing doctor
      const existing = await prisma.doctor.findUnique({
        where: { doctor_id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      // Verify the admin belongs to the doctor's hospital
      const admin = await verifyAdminHospital(
        req.user.user_id,
        existing.hospital_id,
        res
      );

      if (!admin) return;

      // Build update data
      const updateData = {};

      if (name !== undefined) {
        if (typeof name !== "string" || name.trim() === "") {
          return res.status(400).json({
            success: false,
            message: "Doctor name must be a non-empty string",
          });
        }

        updateData.name = name.trim();
      }

      if (specialization !== undefined) {
        if (
          typeof specialization !== "string" ||
          specialization.trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            message: "Specialization must be a non-empty string",
          });
        }

        updateData.specialization = specialization.trim();
      }

      if (qualification !== undefined) {
        if (qualification !== null && typeof qualification !== "string") {
          return res.status(400).json({
            success: false,
            message: "Qualification must be a string or null",
          });
        }

        updateData.qualification = qualification;
      }

      if (license_number !== undefined) {
        if (
          typeof license_number !== "string" ||
          license_number.trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            message: "License number must be a non-empty string",
          });
        }

        updateData.license_number = license_number.trim();
      }

      if (bio !== undefined) {
        if (bio !== null && typeof bio !== "string") {
          return res.status(400).json({
            success: false,
            message: "Bio must be a string or null",
          });
        }

        updateData.bio = bio;
      }

      if (consultation_fee !== undefined) {
        if (
          consultation_fee !== null &&
          (typeof consultation_fee !== "number" || consultation_fee < 0)
        ) {
          return res.status(400).json({
            success: false,
            message: "Consultation fee must be a non-negative number or null",
          });
        }

        updateData.consultation_fee = consultation_fee;
      }

      // Department reassignment — must be within the same hospital
      if (department_id !== undefined) {
        if (department_id === null) {
          return res.status(400).json({
            success: false,
            message: "Department cannot be null. Provide a valid department_id.",
          });
        }

        const department = await prisma.department.findUnique({
          where: { department_id },
        });

        if (!department) {
          return res.status(404).json({
            success: false,
            message: "Department not found",
          });
        }

        if (department.hospital_id !== existing.hospital_id) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot assign doctor to a department in a different hospital",
          });
        }

        if (!department.is_active) {
          return res.status(400).json({
            success: false,
            message: "Cannot assign doctor to an inactive department",
          });
        }

        updateData.department_id = department_id;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No valid fields to update. Allowed: name, specialization, qualification, license_number, bio, consultation_fee, department_id",
        });
      }

      const doctor = await prisma.doctor.update({
        where: { doctor_id },
        data: updateData,
      });

      return res.status(200).json({
        success: true,
        message: "Doctor updated successfully",
        data: doctor,
      });
    } catch (error) {
      console.error("Update doctor error:", error);

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Deactivate doctor (soft-delete) - ADMIN only
router.patch(
  "/:doctor_id/deactivate",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { doctor_id } = req.params;

      // Find the doctor
      const existing = await prisma.doctor.findUnique({
        where: { doctor_id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      // Verify the admin belongs to the doctor's hospital
      const admin = await verifyAdminHospital(
        req.user.user_id,
        existing.hospital_id,
        res
      );

      if (!admin) return;

      if (!existing.is_active) {
        return res.status(400).json({
          success: false,
          message: "Doctor is already inactive",
        });
      }

      const doctor = await prisma.doctor.update({
        where: { doctor_id },
        data: { is_active: false, is_available: false },
      });

      return res.status(200).json({
        success: true,
        message: "Doctor deactivated successfully",
        data: doctor,
      });
    } catch (error) {
      console.error("Deactivate doctor error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to deactivate doctor",
      });
    }
  }
);

module.exports = router;
