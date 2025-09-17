// backend/routes/workspace.js
import express from "express";
import Workspace from "../models/Workspace.js";
import authMiddleware from "../middleware/auth.js";
import adminAuthMiddleware from "../middleware/adminAuth.js";
import mongoose from "mongoose";
import Task from "../models/Task.js"; // Import Task model
import File from "../models/File.js"; // Import File model
import Message from "../models/Message.js"; // Import Message model
import Document from "../models/Document.js"; // Import Document model

const router = express.Router();

// Create Workspace (Admin Only)
router.post("/create", adminAuthMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const workspace = new Workspace({
      name,
      owner: req.user.id,
      members: [req.user.id],
    });
    await workspace.save();
    const inviteLink = `${process.env.FRONTEND_URL}/join/${workspace._id}`;
    res.status(201).json({
      msg: "Workspace created successfully",
      workspace,
      inviteLink,
    });
  } catch (err) {
    console.error("Error creating workspace:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get My Workspaces
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      members: req.user.id,
    }).populate("owner", "email name profilePicture");
    const workspacesWithCount = workspaces.map(ws => ({
      ...ws.toObject(),
      memberCount: ws.members.length
    }));
    res.json(workspacesWithCount);
  } catch (err) {
    console.error("Error fetching workspaces:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Join Workspace
router.post("/join/:id", authMiddleware, async (req, res) => {
  try {
    const workspaceId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ msg: "Invalid workspace ID" });
    }
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }
    if (workspace.members.some(member => member._id.equals(req.user.id))) {
      return res.status(400).json({ msg: "You are already a member of this workspace" });
    }
    workspace.members.push(req.user.id);
    await workspace.save();
    res.json({ msg: "Joined workspace successfully", workspace });
  } catch (err) {
    console.error("Error joining workspace:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get a single workspace by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const workspaceId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ msg: "Invalid workspace ID" });
    }
    const workspace = await Workspace.findById(workspaceId).populate(
      "owner members",
      "name email profilePicture"
    );
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }
    const isMember = workspace.members.some((member) =>
      member._id.equals(req.user.id)
    );
    if (!isMember) {
      return res.status(403).json({ msg: "Access denied. You are not a member of this workspace." });
    }
    res.json(workspace);
  } catch (err) {
    console.error("Error fetching single workspace:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ New PUT route to update a workspace name (Admin Only)
router.put("/:id", adminAuthMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const workspace = await Workspace.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true }
        );
        if (!workspace) {
            return res.status(404).json({ msg: "Workspace not found" });
        }
        res.json(workspace);
    } catch (err) {
        console.error("Error updating workspace:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
});

// ✅ New DELETE route to delete a workspace (Admin Only)
router.delete("/:id", adminAuthMiddleware, async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const workspace = await Workspace.findByIdAndDelete(workspaceId);
        if (!workspace) {
            return res.status(404).json({ msg: "Workspace not found" });
        }
        // Delete all associated data
        await Task.deleteMany({ workspace: workspaceId });
        await File.deleteMany({ workspace: workspaceId });
        await Message.deleteMany({ workspace: workspaceId });
        await Document.deleteMany({ workspace: workspaceId });

        res.json({ msg: "Workspace and all associated data deleted successfully." });
    } catch (err) {
        console.error("Error deleting workspace:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
});

export default router;