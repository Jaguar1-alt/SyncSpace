import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import File from "../models/File.js";
import Workspace from "../models/Workspace.js";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";                  // 👈 1. IMPORT USER MODEL
import Notification from "../models/Notification.js";  // 👈 2. IMPORT NOTIFICATION MODEL
import { io, userSockets } from "../server.js";       // 👈 3. IMPORT SOCKET TOOLS

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Set up Multer for file uploads - No changes needed here
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        cb(null, path.resolve(__dirname, '../uploads/files/'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage: storage });

// ✅ Upload a new file to a workspace - UPDATED WITH NOTIFICATION LOGIC
router.post("/upload/:workspaceId", authMiddleware, upload.single("file"), async (req, res) => {
    try {
        const { workspaceId } = req.params;
        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ msg: "Workspace not found." });
        }
        if (!workspace.members.some(member => member._id.equals(req.user.id))) {
            return res.status(403).json({ msg: "Access denied. You are not a member of this workspace." });
        }

        const newFile = new File({
            name: req.file.originalname,
            path: `/uploads/files/${req.file.filename}`,
            size: req.file.size,
            workspace: workspaceId,
            uploader: req.user.id,
            contentType: req.file.mimetype,
        });
        await newFile.save();

        // --- ✅ START: NOTIFICATION LOGIC ---
        const uploader = await User.findById(req.user.id);
        
        // Create a notification for every member EXCEPT the person who uploaded the file
        const notificationPromises = workspace.members
            .filter(memberId => memberId.toString() !== req.user.id)
            .map(memberId => {
                const notification = new Notification({
                    recipient: memberId,
                    sender: req.user.id,
                    message: `${uploader.name} uploaded a new file '${req.file.originalname}' in '${workspace.name}'.`,
                    link: `/workspace/${workspaceId}/files`
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

        res.status(201).json({ msg: "File uploaded successfully", file: newFile });
    } catch (err) {
        console.error("Error during file upload:", err);
        res.status(500).json({ msg: "Server error during file upload." });
    }
});

// ✅ Get all files for a specific workspace - No changes needed here
router.get("/:workspaceId", authMiddleware, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const files = await File.find({ workspace: workspaceId }).populate("uploader", "name email");
        res.json(files);
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
});

// ✅ Download a file - No changes needed here
router.get("/download/:fileId", authMiddleware, async (req, res) => {
    try {
        const file = await File.findById(req.params.fileId);
        if (!file) {
            return res.status(404).json({ msg: "File not found" });
        }
        const filePath = path.join(__dirname, '..', file.path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ msg: "Physical file not found on server" });
        }
        res.download(filePath, file.name);
    } catch (err) {
        console.error("Error in download route:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// ✅ New DELETE route for files - No changes needed here
router.delete("/:fileId", authMiddleware, async (req, res) => {
    try {
        const file = await File.findById(req.params.fileId);
        if (!file) {
            return res.status(404).json({ msg: "File not found" });
        }

        if (file.uploader.toString() !== req.user.id) {
            return res.status(403).json({ msg: "Access denied. You can only delete your own files." });
        }

        await File.findByIdAndDelete(req.params.fileId);

        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        res.json({ msg: "File deleted successfully" });
    } catch (err) {
        console.error("Error deleting file:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
});

export default router;