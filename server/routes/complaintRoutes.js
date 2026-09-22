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
  getPublicFeed,
  upvoteComplaint,
  getStats,
} = require("../controllers/complaintController");

// ---- Public (citizen-facing) ----
router.post("/", complaintUpload, createComplaint);
router.get("/public-feed", getPublicFeed);
router.get("/track/:complaintId", trackComplaint);
router.post("/:id/upvote", upvoteComplaint);
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


