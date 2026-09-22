// models/Announcement.js
const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Water", "Electricity", "Roads", "Sanitation", "General", "Emergency"],
      default: "General",
    },
    urgency: {
      type: String,
      enum: ["Info", "Warning", "Urgent"],
      default: "Info",
    },
    ward: { type: String, default: "All Wards" },
    createdBy: { type: String, default: "Municipal Admin" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
