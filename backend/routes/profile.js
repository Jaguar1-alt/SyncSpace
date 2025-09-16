import express from "express";
import multer from "multer";
import path from "path";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '../uploads/profiles/')); 
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

router.post("/upload", authMiddleware, upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    await user.save();
    res.json({ msg: "Profile picture uploaded successfully", profilePicture: user.profilePicture });
  } catch (err) {
    console.error("Error during profile picture upload:", err);
    res.status(500).json({ msg: "Server error during file upload." });
  }
});

export default router;