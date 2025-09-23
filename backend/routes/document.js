import express from "express";
import Document from "../models/Document.js";
import Workspace from "../models/Workspace.js";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";                  // 👈 1. IMPORT USER MODEL
import Notification from "../models/Notification.js";  // 👈 2. IMPORT NOTIFICATION MODEL
import { io, userSockets } from "../server.js";       // 👈 3. IMPORT SOCKET TOOLS

const router = express.Router();

// ✅ Create a new document in a workspace - UPDATED WITH NOTIFICATION LOGIC
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title, workspaceId } = req.body;
        const document = new Document({
            title,
            workspace: workspaceId,
            createdBy: req.user.id,
        });
        await document.save();

        // --- ✅ START: NOTIFICATION LOGIC ---
        const workspace = await Workspace.findById(workspaceId);
        const creator = await User.findById(req.user.id);
        
        // Create a notification for every member EXCEPT the person who created the document
        const notificationPromises = workspace.members
            .filter(memberId => memberId.toString() !== req.user.id)
            .map(memberId => {
                const notification = new Notification({
                    recipient: memberId,
                    sender: req.user.id,
                    message: `${creator.name} created a new document '${title}' in '${workspace.name}'.`,
                    link: `/workspace/${workspaceId}/documents`
                });
                return notification.save();
            });

        const notifications = await Promise.all(notificationPromises);
        
        // Send real-time updates to each recipient
        notifications.forEach(notification => {
            const socketId = userSockets.get(notification.recipient.toString());
            if (socketId) {
                io.to(socketId).emit("new_notification", notification);
            }
        });
        // --- ✅ END: NOTIFICATION LOGIC ---

        res.status(201).json(document);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// ✅ Get all documents for a specific workspace - No changes needed here
router.get("/workspace/:workspaceId", authMiddleware, async (req, res) => {
    try {
        const documents = await Document.find({ workspace: req.params.workspaceId }).populate("createdBy", "name email");
        res.json(documents);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// ✅ Get a single document by ID - No changes needed here
router.get("/:documentId", authMiddleware, async (req, res) => {
    try {
        const document = await Document.findById(req.params.documentId).populate("createdBy", "name email");
        if (!document) {
            return res.status(404).json({ msg: "Document not found" });
        }
        res.json(document);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

export default router;