// backend/routes/notifications.js
import express from "express";
import Notification from "../models/Notification.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// ✅ Get all notifications for the current user
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "name email profilePicture")
      .sort({ createdAt: -1 });
      
    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Mark a notification as read
router.put("/mark-read/:notificationId", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { readStatus: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    if (notification.recipient.toString() !== req.user.id) {
        return res.status(403).json({ msg: "Access denied. You can only mark your own notifications as read." });
    }
    
    res.json(notification);
  } catch (err) {
    console.error("Error marking notification as read:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;