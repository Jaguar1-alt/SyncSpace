import express from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";                  // 👈 1. IMPORT USER MODEL
import Notification from "../models/Notification.js";  // 👈 2. IMPORT NOTIFICATION MODEL
import { userSockets } from "../server.js";       // 👈 3. IMPORT SOCKET TOOLS

const createRouter = (io) => {
    const router = express.Router();

    // ✅ Create a new task - UPDATED WITH NOTIFICATION LOGIC
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

            // --- ✅ START: NOTIFICATION LOGIC ---
            // If the task is assigned to someone, send them a notification
            if (assignedTo) {
                const creator = await User.findById(req.user.id);
                const notification = new Notification({
                    recipient: assignedTo,
                    sender: req.user.id,
                    message: `${creator.name} assigned you a new task: '${title}'.`,
                    link: `/workspace/${workspaceId}/tasks`
                });
                await notification.save();

                // Send the notification in real-time
                const recipientSocketId = userSockets.get(assignedTo.toString());
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("new_notification", notification);
                }
            }
            // --- ✅ END: NOTIFICATION LOGIC ---

            await task.populate("assignedTo createdBy", "name email");
            io.to(workspaceId).emit("task_created", task);
            res.status(201).json(task);
        } catch (err) {
            res.status(500).json({ msg: err.message });
        }
    });

    // ✅ Get all tasks for a specific workspace - No changes needed here
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

    // ✅ Update a task - UPDATED WITH NOTIFICATION LOGIC
    router.put("/:taskId", authMiddleware, async (req, res) => {
        try {
            const { assignedTo } = req.body;
            // Get the original task to check if the assignee changed
            const originalTask = await Task.findById(req.params.taskId);

            const updatedTask = await Task.findByIdAndUpdate(
                req.params.taskId,
                req.body, // Pass the entire body to update any field (like status)
                { new: true }
            );
            if (!updatedTask) {
                return res.status(404).json({ msg: "Task not found" });
            }

            // --- ✅ START: NOTIFICATION LOGIC FOR RE-ASSIGNMENT ---
            // Notify only if the assignee has changed to a new person
            if (assignedTo && originalTask.assignedTo?.toString() !== assignedTo.toString()) {
                const updater = await User.findById(req.user.id);
                const notification = new Notification({
                    recipient: assignedTo,
                    sender: req.user.id,
                    message: `${updater.name} assigned the task '${updatedTask.title}' to you.`,
                    link: `/workspace/${updatedTask.workspace}/tasks`
                });
                await notification.save();

                // Send the notification in real-time
                const recipientSocketId = userSockets.get(assignedTo.toString());
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("new_notification", notification);
                }
            }
            // --- ✅ END: NOTIFICATION LOGIC ---

            await updatedTask.populate("assignedTo createdBy", "name email");
            io.to(updatedTask.workspace.toString()).emit("task_updated", updatedTask);
            res.json(updatedTask);
        } catch (err) {
            res.status(500).json({ msg: err.message });
        }
    });

    // ✅ Delete a task - No changes needed here
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