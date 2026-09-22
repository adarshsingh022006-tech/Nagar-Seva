// controllers/announcementController.js
const Announcement = require("../models/Announcement");

// GET /api/announcements (public)
async function getAnnouncements(req, res, next) {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ urgency: -1, createdAt: -1 })
      .limit(10);
    res.json(announcements);
  } catch (err) {
    next(err);
  }
}

// POST /api/announcements (protected - admin / department staff)
async function createAnnouncement(req, res, next) {
  try {
    const { title, content, category, urgency, ward } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required." });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      category: category || "General",
      urgency: urgency || "Info",
      ward: ward?.trim() || "All Wards",
      createdBy: req.user?.username || "Municipal Staff",
    });

    res.status(201).json({ message: "Announcement published successfully", announcement });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/announcements/:id (protected)
async function deleteAnnouncement(req, res, next) {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};
