// backend/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    profilePicture: {
      type: String,
      default: "", // Default empty string or a placeholder image URL
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);