const express = require("express");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const {
  getOverview,
  resolveHospitalId,
} = require("../services/analytics.service");

const router = express.Router();

// UUID v4 format check
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/analytics/overview
 *
 * Returns aggregated analytics for the authenticated admin/staff member's
 * hospital.  Data is always scoped to the user's own hospital — supplying a
 * different hospital_id query parameter will be rejected.
 *
 * Optional query parameters:
 *   hospital_id — if provided, must match the caller's own hospital (safety check).
 *
 * Response sections:
 *   appointments  — total, per-status, today / this_week / this_month
 *   patients      — system-wide totals (patients are not hospital-scoped)
 *   queue         — per-status counts + average wait minutes
 *   operations    — hospital / doctor / department counts + breakdowns
 */
router.get(
  "/overview",
  authenticateToken,
  authorizeRoles("ADMIN", "STAFF"),
  async (req, res) => {
    try {
      // Resolve the caller's hospital from the auth token
      const resolved = await resolveHospitalId(req.user);

      if (resolved.error) {
        return res
          .status(resolved.error.status)
          .json({ success: false, message: resolved.error.message });
      }

      const hospitalId = resolved.hospital_id;

      // If a hospital_id query param was supplied, verify it matches
      const requestedHospitalId = req.query.hospital_id;

      if (requestedHospitalId) {
        if (!UUID_RE.test(requestedHospitalId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid hospital_id format",
          });
        }

        if (requestedHospitalId !== hospitalId) {
          return res.status(403).json({
            success: false,
            message:
              "You do not have permission to access analytics for this hospital",
          });
        }
      }

      const data = await getOverview(hospitalId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Analytics overview error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch analytics overview",
      });
    }
  }
);

module.exports = router;
