// controllers/complaintController.js
const Complaint = require("../models/Complaint");
const Department = require("../models/Department");
const generateComplaintId = require("../utils/generateComplaintId");

// Category -> Department name routing table
const CATEGORY_DEPARTMENT_MAP = {
  "Water Supply": "Water Department",
  "Electricity": "Electricity Department",
  "Roads": "Roads & Infrastructure Department",
  "Sanitation": "Sanitation Department",
  "Street Lights": "Electricity Department",
  "Emergency SOS": "General/Municipal Department",
  "Other": "General/Municipal Department",
};

function fileUrl(req, filename) {
  if (!filename) return null;
  return `/uploads/${filename}`;
}

// POST /api/complaints  (public, multipart/form-data)
async function createComplaint(req, res, next) {
  try {
    const { citizenName, phone, category, description, lat, lng, address, isSOS, priority } = req.body;

    if (!phone || !category || !description) {
      return res.status(400).json({ message: "Phone, category and description are required." });
    }
    if (!CATEGORY_DEPARTMENT_MAP[category]) {
      return res.status(400).json({ message: "Invalid category selected." });
    }

    const isEmergency = isSOS === "true" || isSOS === true || category === "Emergency SOS";
    const deptName = CATEGORY_DEPARTMENT_MAP[category] || "General/Municipal Department";

    let department = await Department.findOne({ name: deptName });
    if (!department) {
      department = await Department.findOneAndUpdate(
        { name: deptName },
        { name: deptName },
        { upsert: true, new: true }
      );
    }

    // Extract photo and audio from req.files or req.file
    let photoFilename = null;
    let audioFilename = null;

    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photoFilename = req.files.photo[0].filename;
      }
      if (req.files.audio && req.files.audio[0]) {
        audioFilename = req.files.audio[0].filename;
      }
    } else if (req.file) {
      if (req.file.mimetype.startsWith("audio/")) {
        audioFilename = req.file.filename;
      } else {
        photoFilename = req.file.filename;
      }
    }

    const photoUrl = photoFilename ? fileUrl(req, photoFilename) : null;
    const audioUrl = audioFilename ? fileUrl(req, audioFilename) : null;

    const numLat = lat ? Number(lat) : null;
    const numLng = lng ? Number(lng) : null;
    const trimmedAddress = address ? address.trim() : "";

    // 🔍 Smart Duplicate Detection: Check for active unresolved complaint in same category nearby
    if (!isEmergency) {
      const activeSameCategory = await Complaint.find({
        category,
        status: { $ne: "Resolved" },
      });

      let existingMatch = null;
      for (const candidate of activeSameCategory) {
        // 1. Proximity check (~300 meters)
        if (numLat && numLng && candidate.location?.lat && candidate.location?.lng) {
          const latDiff = Math.abs(numLat - candidate.location.lat);
          const lngDiff = Math.abs(numLng - candidate.location.lng);
          if (latDiff <= 0.003 && lngDiff <= 0.003) {
            existingMatch = candidate;
            break;
          }
        }

        // 2. Address text match
        if (!existingMatch && trimmedAddress && candidate.location?.address) {
          const a1 = trimmedAddress.toLowerCase();
          const a2 = candidate.location.address.trim().toLowerCase();
          if (a1.length >= 6 && a2.length >= 6) {
            if (a1 === a2 || a1.includes(a2) || a2.includes(a1)) {
              existingMatch = candidate;
              break;
            }
          }
        }
      }

      // If duplicate/clustered match found, merge into parent complaint
      if (existingMatch) {
        existingMatch.additionalReports.push({
          citizenName: citizenName?.trim() || "Anonymous Citizen",
          phone: phone.trim(),
          description: description.trim(),
          photoUrl,
          audioUrl,
          reportedAt: new Date(),
        });
        existingMatch.duplicateCount = (existingMatch.duplicateCount || 1) + 1;
        if (existingMatch.duplicateCount >= 3 && existingMatch.priority === "Normal") {
          existingMatch.priority = "High";
        }
        await existingMatch.save();

        return res.status(200).json({
          message: `🔥 Issue already reported in this locality! Your report was merged with #${existingMatch.complaintId} (Piled: ${existingMatch.duplicateCount} citizen reports).`,
          complaintId: existingMatch.complaintId,
          department: deptName,
          isDuplicateMerged: true,
          duplicateCount: existingMatch.duplicateCount,
        });
      }
    }

    // Calculate Category-based SLA Deadline
    let slaHours = 48; // Default 48 hours for general
    if (isEmergency) {
      slaHours = 6; // 6 hours for SOS
    } else if (category === "Water Supply" || category === "Sanitation") {
      slaHours = 24; // 24 hours
    } else if (category === "Electricity" || category === "Street Lights") {
      slaHours = 24;
    }
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000);

    let complaint;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const complaintId = await generateComplaintId(isEmergency);
        complaint = await Complaint.create({
          complaintId,
          citizenName: citizenName?.trim() || (isEmergency ? "Emergency Citizen" : "Anonymous"),
          phone: phone.trim(),
          category,
          department: department._id,
          description: description.trim(),
          photoUrl,
          audioUrl,
          isSOS: isEmergency,
          duplicateCount: 1,
          additionalReports: [],
          slaDeadline,
          priority: isEmergency ? "EMERGENCY" : (priority || "Normal"),
          location: {
            lat: numLat,
            lng: numLng,
            address: trimmedAddress,
          },
        });
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < 2) continue; // duplicate complaintId, retry
        throw err;
      }
    }

    res.status(201).json({
      message: isEmergency ? "🚨 EMERGENCY SOS Filed Successfully!" : "Complaint filed successfully",
      complaintId: complaint.complaintId,
      department: deptName,
      isSOS: isEmergency,
      duplicateCount: 1,
      slaDeadline,
    });
  } catch (err) {
    console.error("Error creating complaint:", err);
    next(err);
  }
}

// POST /api/complaints/:id/rate (public citizen rating on resolved complaint)
async function rateComplaint(req, res, next) {
  try {
    const { stars, comment } = req.body;
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Stars rating (1 to 5) is required." });
    }

    const complaint = await Complaint.findOne({
      $or: [{ _id: req.params.id }, { complaintId: req.params.id.toUpperCase() }],
    });

    if (!complaint) return res.status(404).json({ message: "Complaint not found." });
    if (complaint.status !== "Resolved") {
      return res.status(400).json({ message: "You can only rate a complaint once it has been resolved." });
    }

    complaint.rating = {
      stars: Number(stars),
      comment: comment?.trim() || "",
      ratedAt: new Date(),
    };
    await complaint.save();

    res.json({ message: "Thank you for rating municipal service! ⭐", complaint });
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints/:id/reopen (citizen re-opens complaint if fix is unsatisfactory)
async function reopenComplaint(req, res, next) {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Please provide a reason why this complaint should be re-opened." });
    }

    const complaint = await Complaint.findOne({
      $or: [{ _id: req.params.id }, { complaintId: req.params.id.toUpperCase() }],
    });

    if (!complaint) return res.status(404).json({ message: "Complaint not found." });

    complaint.status = "In Progress";
    complaint.isReopened = true;
    complaint.reopenReason = reason.trim();
    complaint.reopenedAt = new Date();
    complaint.priority = "High"; // Reopened issues get High priority automatically!
    await complaint.save();

    res.json({
      message: "Complaint has been re-opened and flagged as High Priority for departmental re-investigation.",
      complaint,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints/by-phone/:phone (citizen history & karma score)
async function getComplaintsByPhone(req, res, next) {
  try {
    const phone = req.params.phone.trim();
    if (!phone) return res.status(400).json({ message: "Phone number required." });

    const complaints = await Complaint.find({
      $or: [
        { phone: { $regex: phone, $options: "i" } },
        { "additionalReports.phone": { $regex: phone, $options: "i" } },
      ],
    })
      .populate("department", "name")
      .sort({ createdAt: -1 });

    // Compute Civic Karma Points
    const filedCount = complaints.length;
    const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;
    const ratedCount = complaints.filter((c) => c.rating?.stars).length;
    const karmaScore = filedCount * 50 + resolvedCount * 30 + ratedCount * 20;

    let badge = "🌱 Civic Starter";
    if (karmaScore >= 300) badge = "🏆 Diamond Citizen";
    else if (karmaScore >= 150) badge = "🌟 Gold Citizen";
    else if (karmaScore >= 80) badge = "🛡️ Silver Citizen";

    res.json({
      phone,
      complaints,
      stats: {
        totalFiled: filedCount,
        totalResolved: resolvedCount,
        totalRated: ratedCount,
        karmaScore,
        badge,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints/leaderboard (Top Civic Champions)
async function getLeaderboard(req, res, next) {
  try {
    const topCitizens = await Complaint.aggregate([
      {
        $group: {
          _id: "$phone",
          name: { $first: "$citizenName" },
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          phone: "$_id",
          name: { $ifNull: ["$name", "Citizen"] },
          count: 1,
          resolved: 1,
          karmaScore: { $add: [{ $multiply: ["$count", 50] }, { $multiply: ["$resolved", 30] }] },
        },
      },
      { $sort: { karmaScore: -1 } },
      { $limit: 10 },
    ]);

    // Mask phone numbers for privacy e.g. +91 98****3210
    const masked = topCitizens.map((c, i) => {
      const p = String(c.phone || "");
      const visible = p.length >= 6 ? `${p.slice(0, 3)}****${p.slice(-3)}` : "Citizen";
      return {
        rank: i + 1,
        name: c.name && c.name !== "Anonymous" && c.name !== "Anonymous Citizen" ? c.name : `Citizen ${visible}`,
        karmaScore: c.karmaScore,
        reportsFiled: c.count,
        resolvedIssues: c.resolved,
      };
    });

    res.json(masked);
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
  CATEGORY_DEPARTMENT_MAP,
};



