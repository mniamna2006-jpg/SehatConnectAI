const express = require("express");
const prisma = require("../config/prisma");
const { addTime12hFields } = require("../utils/date.helpers");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const WORKING_HOUR_TIME_FIELDS = { opening_time: true, closing_time: true };

// Allowed fields for admin hospital profile update
const UPDATABLE_HOSPITAL_FIELDS = [
  "name",
  "facility_type",
  "description",
  "logo_url",
  "cover_image_url",
  "theme",
  "phone",
  "email",
  "address",
  "city",
  "latitude",
  "longitude",
];

const VALID_FACILITY_TYPES = ["HOSPITAL", "CLINIC", "MEDICAL_CENTER"];

const router = express.Router();

// Get all active hospitals
router.get("/", async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      data: hospitals,
    });
  } catch (error) {
    console.error("Error fetching hospitals:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch hospitals",
    });
  }
});



// Find nearby hospitals using GPS coordinates
router.get("/nearby", async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const radius = Number(req.query.radius) || 10;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90",
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180",
      });
    }

    if (!Number.isFinite(radius) || radius <= 0 || radius > 100) {
      return res.status(400).json({
        success: false,
        message: "Radius must be between 0 and 100 km",
      });
    }

    const hospitals = await prisma.$queryRaw`
      SELECT
        hospital_id,
        name,
        facility_type,
        description,
        logo_url,
        cover_image_url,
        theme,
        phone,
        email,
        address,
        city,
        latitude,
        longitude,
        is_active,
        created_at,
        updated_at,
        (
          6371 * acos(
            LEAST(
              1,
              GREATEST(
                -1,
                cos(radians(${latitude}))
                * cos(radians(latitude))
                * cos(radians(longitude) - radians(${longitude}))
                + sin(radians(${latitude}))
                * sin(radians(latitude))
              )
            )
          )
        ) AS distance_km
      FROM hospitals
      WHERE is_active = true
      AND (
        6371 * acos(
          LEAST(
            1,
            GREATEST(
              -1,
              cos(radians(${latitude}))
              * cos(radians(latitude))
              * cos(radians(longitude) - radians(${longitude}))
              + sin(radians(${latitude}))
              * sin(radians(latitude))
            )
          )
        )
      ) <= ${radius}
      ORDER BY distance_km ASC;
    `;

    return res.status(200).json({
      success: true,
      data: hospitals,
    });
  } catch (error) {
    console.error("Error finding nearby hospitals:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to find nearby hospitals",
    });
  }
});

// Search hospitals by city
router.get("/search", async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    const hospitals = await prisma.hospital.findMany({
      where: {
        is_active: true,
        city: {
          contains: city,
          mode: "insensitive",
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: hospitals,
    });
  } catch (error) {
    console.error("Error searching hospitals:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search hospitals",
    });
  }
});

// Get hospital details
router.get("/:hospital_id", async (req, res) => {
  try {
    const { hospital_id } = req.params;

    const hospital = await prisma.hospital.findFirst({
      where: {
        hospital_id,
        is_active: true,
      },
      include: {
        working_hours: {
          orderBy: {
            day_of_week: "asc",
          },
        },
        departments: {
          where: {
            is_active: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        doctors: {
          where: {
            is_active: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    // Add 12-hour time display fields to nested working hours
    const hospitalData = {
      ...hospital,
      working_hours: addTime12hFields(
        hospital.working_hours,
        WORKING_HOUR_TIME_FIELDS
      ),
    };

    return res.status(200).json({
      success: true,
      data: hospitalData,
    });
  } catch (error) {
    console.error("Error fetching hospital details:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hospital details",
    });
  }
});

// Update hospital profile - ADMIN only
router.patch(
  "/:hospital_id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { hospital_id } = req.params;

      // Resolve the admin's hospital
      const admin = await prisma.hospitalAdmin.findUnique({
        where: {
          user_id: req.user.user_id,
        },
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Hospital admin profile not found",
        });
      }

      // Verify the admin belongs to the target hospital
      if (admin.hospital_id !== hospital_id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to modify this hospital",
        });
      }

      // Verify the hospital exists
      const existingHospital = await prisma.hospital.findUnique({
        where: { hospital_id },
      });

      if (!existingHospital) {
        return res.status(404).json({
          success: false,
          message: "Hospital not found",
        });
      }

      // Filter request body to only allowed fields
      const updateData = {};

      for (const field of UPDATABLE_HOSPITAL_FIELDS) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      // Reject empty request
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: `No valid fields to update. Allowed fields: ${UPDATABLE_HOSPITAL_FIELDS.join(", ")}`,
        });
      }

      // Validate name if provided
      if (updateData.name !== undefined) {
        if (
          typeof updateData.name !== "string" ||
          updateData.name.trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            message: "Hospital name must be a non-empty string",
          });
        }

        updateData.name = updateData.name.trim();
      }

      // Validate facility_type if provided
      if (updateData.facility_type !== undefined) {
        if (!VALID_FACILITY_TYPES.includes(updateData.facility_type)) {
          return res.status(400).json({
            success: false,
            message: `Invalid facility_type. Allowed values: ${VALID_FACILITY_TYPES.join(", ")}`,
          });
        }
      }

      // Validate address if provided
      if (updateData.address !== undefined) {
        if (
          typeof updateData.address !== "string" ||
          updateData.address.trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            message: "Address must be a non-empty string",
          });
        }

        updateData.address = updateData.address.trim();
      }

      // Validate city if provided
      if (updateData.city !== undefined) {
        if (
          typeof updateData.city !== "string" ||
          updateData.city.trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            message: "City must be a non-empty string",
          });
        }

        updateData.city = updateData.city.trim();
      }

      // Validate latitude if provided
      if (updateData.latitude !== undefined) {
        const lat = Number(updateData.latitude);

        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
          return res.status(400).json({
            success: false,
            message: "Latitude must be a number between -90 and 90",
          });
        }

        updateData.latitude = lat;
      }

      // Validate longitude if provided
      if (updateData.longitude !== undefined) {
        const lng = Number(updateData.longitude);

        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
          return res.status(400).json({
            success: false,
            message: "Longitude must be a number between -180 and 180",
          });
        }

        updateData.longitude = lng;
      }

      // Validate string fields (description, logo_url, cover_image_url, theme, phone, email)
      const optionalStringFields = [
        "description",
        "logo_url",
        "cover_image_url",
        "theme",
        "phone",
        "email",
      ];

      for (const field of optionalStringFields) {
        if (
          updateData[field] !== undefined &&
          updateData[field] !== null &&
          typeof updateData[field] !== "string"
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a string or null`,
          });
        }
      }

      const updatedHospital = await prisma.hospital.update({
        where: { hospital_id },
        data: updateData,
      });

      return res.status(200).json({
        success: true,
        message: "Hospital profile updated successfully",
        data: updatedHospital,
      });
    } catch (error) {
      console.error("Update hospital profile error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update hospital profile",
      });
    }
  }
);

module.exports = router;
