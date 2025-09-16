// backend/routes/message.js
import express from "express";
import Message from "../models/Message.js";
import authMiddleware from "../middleware/auth.js";
import mongoose from "mongoose";

const createRouter = (io) => {
  const router = express.Router();

  // Get all messages for a specific workspace
  router.get("/:workspaceId", authMiddleware, async (req, res) => {
    try {
      const messages = await Message.find({ workspace: req.params.workspaceId })
        .populate("sender", "name email profilePicture")
        .sort({ createdAt: 1 });
      res.json(messages);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  // ✅ New DELETE route for messages
  router.delete("/:messageId", authMiddleware, async (req, res) => {
    try {
      const message = await Message.findById(req.params.messageId);

      if (!message) {
        return res.status(404).json({ msg: "Message not found" });
      }

      // Security check: Only the sender can delete their message
      if (message.sender.toString() !== req.user.id) {
        return res.status(403).json({ msg: "Access denied. You can only delete your own messages." });
      }

      await Message.findByIdAndDelete(req.params.messageId);

      // Emit a real-time event to all clients to update the chat
      io.to(message.workspace.toString()).emit("message_deleted", req.params.messageId);

      res.json({ msg: "Message deleted successfully" });
    } catch (err) {
      console.error("Error deleting message:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  });
  
  return router;
};

export default createRouter;