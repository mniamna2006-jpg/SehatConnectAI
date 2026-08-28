const express = require("express");
const prisma = require("../config/prisma");

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

    return res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    console.error("Error fetching hospital details:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hospital details",
    });
  }
});

module.exports = router;
