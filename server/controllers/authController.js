// controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "default_jwt_secret_nagar_seva_2026",
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() }).populate("department");
    if (!user) return res.status(401).json({ message: "Invalid username or password" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid username or password" });

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        department: user.department ? { id: user.department._id, name: user.department.name } : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me — used by the frontend to restore a session on refresh
async function me(req, res, next) {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      username: user.username,
      role: user.role,
      department: user.department || null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };

