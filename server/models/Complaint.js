// models/Complaint.js
const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, required: true, unique: true }, // e.g. CMP-20260829-0001 or SOS-20260829-0001
    citizenName: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },

    category: {
      type: String,
      required: true,
      enum: [
        "Water Supply",
        "Electricity",
        "Roads",
        "Sanitation",
        "Street Lights",
        "Emergency SOS",
        "Other",
      ],
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },

    description: { type: String, required: true, trim: true },
    photoUrl: { type: String, default: null }, // citizen's photo of the issue
    audioUrl: { type: String, default: null }, // citizen's voice note recording

    isSOS: { type: Boolean, default: false }, // Emergency SOS flag
    priority: {
      type: String,
      enum: ["Normal", "High", "EMERGENCY"],
      default: "Normal",
    },

    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },

    resolutionPhotoUrl: { type: String, default: null }, // proof-of-fix photo
    resolvedBy: { type: String, default: null }, // staff username
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

module.exports = mongoose.model("Complaint", complaintSchema);

