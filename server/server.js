// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const connectDB = require("./config/db");
const Department = require("./models/Department");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const departmentRoutes = require("./routes/departmentRoutes");

const app = express();

// Trust proxy for reverse proxies (Render, Railway, Heroku, Nginx, Cloudflare)
app.set("trust proxy", 1);

// Auto-seed default departments on first startup if empty
const DEFAULT_DEPARTMENTS = [
  "Water Department",
  "Electricity Department",
  "Roads & Infrastructure Department",
  "Sanitation Department",
  "General/Municipal Department",
];

async function ensureDefaultDepartments() {
  try {
    const count = await Department.countDocuments();
    if (count === 0) {
      console.log("🌱 Auto-seeding initial department records...");
      for (const name of DEFAULT_DEPARTMENTS) {
        await Department.findOneAndUpdate(
          { name },
          { name },
          { upsert: true, new: true }
        );
      }
      console.log("✅ Initial departments seeded successfully.");
    }
  } catch (err) {
    console.error("⚠️ Failed to auto-seed departments:", err.message);
  }
}

connectDB().then(ensureDefaultDepartments);

// CORS configuration supporting dynamic origin / env var
const clientOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
  : true;

app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded photos statically with CORS enabled
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", cors(), express.static(uploadsPath));

// API health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Nagar Seva API",
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/departments", departmentRoutes);

// If client build exists (production / full-stack deployment), serve it statically
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// 404 for unhandled API endpoints
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// Centralized error handler (multer errors, uncaught route errors)
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  const status = err.status || (err.name === "ValidationError" ? 400 : 500);
  res.status(status).json({
    message: err.message || "An unexpected server error occurred",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Nagar Seva API running on port ${PORT}`));

