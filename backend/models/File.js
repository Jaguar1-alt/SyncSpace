// backend/models/File.js
import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("File", FileSchema);