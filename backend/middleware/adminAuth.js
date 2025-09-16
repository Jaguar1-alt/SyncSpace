// backend/middleware/adminAuth.js
import jwt from "jsonwebtoken";

const adminAuth = (req, res, next) => {
  // --- FIX #1: Look for the same "Authorization" header as in auth.js ---
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;

    // --- FIX #2: Check the user's role directly from the token payload ---
    // This is more efficient and works for routes where a workspace doesn't exist yet.
    // Make sure you add the 'role' to the JWT payload when the user logs in.
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin role required." });
    }

    next();
  } catch (err) {
    console.error("Admin auth error:", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};

export default adminAuth;