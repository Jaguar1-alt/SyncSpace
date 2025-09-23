import express from "express";
import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";
import Task from "../models/Task.js";
import File from "../models/File.js";
import Message from "../models/Message.js";
import Document from "../models/Document.js";
import authMiddleware from "../middleware/auth.js";
import adminAuthMiddleware from "../middleware/adminAuth.js";
import User from "../models/User.js";                  // 👈 1. IMPORT USER MODEL
import Notification from "../models/Notification.js";  // 👈 2. IMPORT NOTIFICATION MODEL
import { io, userSockets } from "../server.js";       // 👈 3. IMPORT SOCKET TOOLS

const router = express.Router();

// Create Workspace (Admin Only) - No changes needed here
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

// Get My Workspaces - No changes needed here
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

// Join Workspace - UPDATED WITH NOTIFICATION LOGIC
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

        // --- ✅ START: NOTIFICATION LOGIC ---
        const joiningUser = await User.findById(req.user.id);

        const notification = new Notification({
            recipient: workspace.owner, // The ID of the user to notify (the owner)
            sender: req.user.id,        // The ID of the user who caused the notification
            message: `${joiningUser.name} has joined your workspace '${workspace.name}'.`,
            link: `/workspace/${workspace._id}/members`
        });
        await notification.save();
        
        // Send the notification in real-time
        const ownerSocketId = userSockets.get(workspace.owner.toString());
        if (ownerSocketId) {
            io.to(ownerSocketId).emit("new_notification", notification);
        }
        // --- ✅ END: NOTIFICATION LOGIC ---

        res.json({ msg: "Joined workspace successfully", workspace });
    } catch (err) {
        console.error("Error joining workspace:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
});

// Get a single workspace by ID - No changes needed here
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

// New PUT route to update a workspace name (Admin Only) - No changes needed here
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

// New DELETE route to delete a workspace (Admin Only) - No changes needed here
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