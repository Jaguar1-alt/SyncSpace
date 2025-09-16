import express from "express";
import authMiddleware from "../middleware/auth.js";
import Project from "../models/Project.js";

const router = express.Router();

// ✅ Create Project
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, workspaceId } = req.body;
    const project = new Project({
      name,
      description,
      workspace: workspaceId,
      createdBy: req.user.id
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Get Projects by Workspace
router.get("/:workspaceId", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ workspace: req.params.workspaceId });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Update Project
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Delete Project
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: "Project deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
