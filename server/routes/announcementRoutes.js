// routes/announcementRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");

router.get("/", getAnnouncements);
router.post("/", protect, createAnnouncement);
router.delete("/:id", protect, deleteAnnouncement);

module.exports = router;
