// backend/routes/document.js
import express from "express";
import Document from "../models/Document.js";
import authMiddleware from "../middleware/auth.js";
import Workspace from "../models/Workspace.js";

const router = express.Router();

// ✅ Create a new document in a workspace
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, workspaceId } = req.body;
    const document = new Document({
      title,
      workspace: workspaceId,
      createdBy: req.user.id,
    });
    await document.save();
    res.status(201).json(document);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Get all documents for a specific workspace (FIXED)
router.get("/workspace/:workspaceId", authMiddleware, async (req, res) => {
  try {
    const documents = await Document.find({ workspace: req.params.workspaceId }).populate("createdBy", "name email");
    res.json(documents);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Get a single document by ID
router.get("/:documentId", authMiddleware, async (req, res) => {
  try {
    const document = await Document.findById(req.params.documentId).populate("createdBy", "name email");
    if (!document) {
      return res.status(404).json({ msg: "Document not found" });
    }
    // You can add a security check here to ensure the user is in the workspace
    res.json(document);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;