import express from "express";
import Task from "../models/Task.js";
import authMiddleware from "../middleware/auth.js";
import mongoose from "mongoose";

const createRouter = (io) => {
  const router = express.Router();

  // ✅ Create a new task (remains accessible to all members)
  router.post("/", authMiddleware, async (req, res) => {
    try {
      const { title, description, workspaceId, assignedTo } = req.body;
      const task = new Task({
        title,
        description,
        workspace: workspaceId,
        assignedTo,
        createdBy: req.user.id,
      });
      await task.save();

      // FIX: Populate the task before emitting the event
      await task.populate("assignedTo createdBy", "name email");

      io.to(workspaceId).emit("task_created", task);
      res.status(201).json(task);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  // ✅ Get all tasks for a specific workspace
  router.get("/:workspaceId", authMiddleware, async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.workspaceId)) {
        return res.status(400).json({ msg: "Invalid workspace ID" });
      }
      const tasks = await Task.find({ workspace: req.params.workspaceId })
        .populate("assignedTo createdBy", "name email");
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  // ✅ Update a task (e.g., change status, assign to user)
  router.put("/:taskId", authMiddleware, async (req, res) => {
    try {
      const { status, assignedTo } = req.body;
      const task = await Task.findByIdAndUpdate(
        req.params.taskId,
        { status, assignedTo },
        { new: true }
      );
      if (!task) {
        return res.status(404).json({ msg: "Task not found" });
      }

      // FIX: Populate the task before emitting the event
      await task.populate("assignedTo createdBy", "name email");

      io.to(task.workspace.toString()).emit("task_updated", task);
      res.json(task);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  // ✅ Delete a task
  router.delete("/:taskId", authMiddleware, async (req, res) => {
    try {
      const task = await Task.findByIdAndDelete(req.params.taskId);
      if (!task) {
        return res.status(404).json({ msg: "Task not found" });
      }
      io.to(task.workspace.toString()).emit("task_deleted", task._id);
      res.json({ msg: "Task deleted successfully" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });

  return router;
};

export default createRouter;