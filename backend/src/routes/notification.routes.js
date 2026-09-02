const express = require("express");
const prisma = require("../config/prisma");
const {
  authenticateToken,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Get notifications for logged-in user
router.get(
  "/my",
  authenticateToken,
  async (req, res) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          user_id: req.user.user_id,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error("Get notifications error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
      });
    }
  }
);

// Get unread notification count
router.get(
  "/unread-count",
  authenticateToken,
  async (req, res) => {
    try {
      const count = await prisma.notification.count({
        where: {
          user_id: req.user.user_id,
          is_read: false,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          count,
        },
      });
    } catch (error) {
      console.error("Get unread notification count error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch unread notification count",
      });
    }
  }
);

// Mark one notification as read
router.patch(
  "/:notification_id/read",
  authenticateToken,
  async (req, res) => {
    try {
      const { notification_id } = req.params;

      const notification = await prisma.notification.findFirst({
        where: {
          notification_id,
          user_id: req.user.user_id,
        },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      const updatedNotification =
        await prisma.notification.update({
          where: {
            notification_id,
          },
          data: {
            is_read: true,
          },
        });

      return res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: updatedNotification,
      });
    } catch (error) {
      console.error("Mark notification read error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update notification",
      });
    }
  }
);

// Mark all notifications as read
router.patch(
  "/read-all",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          user_id: req.user.user_id,
          is_read: false,
        },
        data: {
          is_read: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: "All notifications marked as read",
        data: {
          updated_count: result.count,
        },
      });
    } catch (error) {
      console.error("Mark all notifications read error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update notifications",
      });
    }
  }
);

module.exports = router;
