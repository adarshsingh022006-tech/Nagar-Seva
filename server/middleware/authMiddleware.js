// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the "Authorization: Bearer <token>" header and attaches the
// logged-in user to req.user. Used on every protected staff/admin route.
async function protect(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized — no token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("department");
    if (!user) return res.status(401).json({ message: "User no longer exists" });
    req.user = user; // { _id, username, role, department, ... }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Restricts a route to the "admin" role only.
function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
}

module.exports = { protect, adminOnly };
