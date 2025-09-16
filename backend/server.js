// backend/server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import path from "path";
import { fileURLToPath } from 'url';
import Document from "./models/Document.js";
import Message from "./models/Message.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Import and use routes
import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspace.js";
import taskRoutes from "./routes/task.js";
import messageRoutes from "./routes/message.js";
import profileRoutes from "./routes/profile.js";
import fileRoutes from "./routes/file.js";
import documentRoutes from "./routes/document.js";

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/tasks", taskRoutes(io));
app.use("/api/messages", messageRoutes(io));
app.use("/api/profile", profileRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/documents", documentRoutes);

// Socket.IO connection event
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("join_workspace", (workspaceId) => {
    socket.join(workspaceId);
    console.log(`User ${socket.id} joined workspace ${workspaceId}`);
  });
  socket.on("send_message", async (messageData) => {
    try {
      const newMessage = new Message({
        sender: messageData.sender._id,
        workspace: messageData.workspace,
        content: messageData.content,
      });
      await newMessage.save();
      await newMessage.populate('sender', 'name email profilePicture');
      io.to(messageData.workspace).emit("receive_message", newMessage);
    } catch (err) {
      console.error("Error saving and broadcasting message:", err.message);
    }
  });

  socket.on("join_document", (documentId) => {
    socket.join(documentId);
    console.log(`User ${socket.id} joined document ${documentId}`);
  });
  
  socket.on("document_change", async (data) => {
    try {
      await Document.findByIdAndUpdate(data.documentId, { content: data.delta });
      socket.to(data.documentId).emit("document_update", data.delta);
    } catch (err) {
      console.error("Error updating document:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err));