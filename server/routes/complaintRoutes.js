// routes/complaintRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const {
  createComplaint,
  trackComplaint,
  listComplaints,
  updateStatus,
  resolveComplaint,
  getStats,
} = require("../controllers/complaintController");

// ---- Public (citizen-facing) ----
router.post("/", upload.single("photo"), createComplaint);
router.get("/track/:complaintId", trackComplaint);

// ---- Protected (staff/admin) ----
router.get("/", protect, listComplaints);
router.get("/stats", protect, getStats);
router.patch("/:id/status", protect, updateStatus);
router.patch("/:id/resolve", protect, upload.single("photo"), resolveComplaint);

module.exports = router;
