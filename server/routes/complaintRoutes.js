// routes/complaintRoutes.js
const express = require("express");
const router = express.Router();
const { upload, complaintUpload } = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const {
  createComplaint,
  trackComplaint,
  listComplaints,
  updateStatus,
  resolveComplaint,
  rateComplaint,
  reopenComplaint,
  getComplaintsByPhone,
  getLeaderboard,
  getStats,
} = require("../controllers/complaintController");

// ---- Public (citizen-facing) ----
router.post("/", complaintUpload, createComplaint);
router.get("/track/:complaintId", trackComplaint);
router.post("/:id/rate", rateComplaint);
router.post("/:id/reopen", reopenComplaint);
router.get("/by-phone/:phone", getComplaintsByPhone);
router.get("/leaderboard", getLeaderboard);

// ---- Protected (staff/admin) ----
router.get("/", protect, listComplaints);
router.get("/stats", protect, getStats);
router.patch("/:id/status", protect, updateStatus);
router.patch("/:id/resolve", protect, upload.single("photo"), resolveComplaint);

module.exports = router;


