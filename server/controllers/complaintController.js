// controllers/complaintController.js
const mongoose = require("mongoose");
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

function findComplaintByIdOrCode(idOrCode) {
  if (!idOrCode) return Promise.resolve(null);
  const str = String(idOrCode).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  if (isObjectId) {
    return Complaint.findOne({
      $or: [{ _id: str }, { complaintId: str.toUpperCase() }],
    });
  }
  return Complaint.findOne({ complaintId: str.toUpperCase() });
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

// GET /api/complaints/track/:complaintId (public)
async function trackComplaint(req, res, next) {
  try {
    const { complaintId } = req.params;
    const complaint = await Complaint.findOne({
      complaintId: complaintId.trim().toUpperCase(),
    }).populate("department", "name");

    if (!complaint) {
      return res.status(404).json({ message: "No complaint found with that ID." });
    }

    res.json(complaint);
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints  (protected — staff sees own dept, admin sees all)
async function listComplaints(req, res, next) {
  try {
    const filter = {};

    if (req.user.role !== "admin") {
      filter.department = req.user.department?._id || req.user.department;
    } else if (req.query.department) {
      filter.department = req.query.department;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.isSOS !== undefined) filter.isSOS = req.query.isSOS === "true";
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.piledOnly === "true") filter.duplicateCount = { $gt: 1 };

    const complaints = await Complaint.find(filter)
      .populate("department", "name")
      .sort({ isSOS: -1, duplicateCount: -1, createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/complaints/:id/status  (protected — Pending / In Progress only)
async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ["Pending", "In Progress"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: 'Use this endpoint only for "Pending" or "In Progress". For "Resolved", use /resolve with a proof photo.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });

    if (
      req.user.role !== "admin" &&
      complaint.department.toString() !== (req.user.department?._id || req.user.department).toString()
    ) {
      return res.status(403).json({ message: "Access denied. Not your department." });
    }

    complaint.status = status;
    await complaint.save();

    res.json({ message: `Status updated to ${status}`, complaint });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/complaints/:id/resolve  (protected — multipart/form-data with proof photo)
async function resolveComplaint(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "A resolution proof photo is required to mark a complaint as Resolved.",
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });

    if (
      req.user.role !== "admin" &&
      complaint.department.toString() !== (req.user.department?._id || req.user.department).toString()
    ) {
      return res.status(403).json({ message: "Access denied. Not your department." });
    }

    complaint.status = "Resolved";
    complaint.resolutionPhotoUrl = fileUrl(req, req.file.filename);
    complaint.resolvedAt = new Date();
    complaint.resolvedBy = req.user.username;
    await complaint.save();

    res.json({ message: "Complaint marked as Resolved with proof photo.", complaint });
  } catch (err) {
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

    const complaint = await findComplaintByIdOrCode(req.params.id);

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

    const complaint = await findComplaintByIdOrCode(req.params.id);

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

// GET /api/complaints/public-feed (public community feed with upvotes & before/after showcase)
async function getPublicFeed(req, res, next) {
  try {
    const { tab = "all", category, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (tab === "resolved") {
      filter.status = "Resolved";
    } else if (tab === "emergency") {
      filter.isSOS = true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { complaintId: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { "location.address": { $regex: q, $options: "i" } },
      ];
    }

    let sort = { createdAt: -1 };
    if (tab === "trending") {
      sort = { upvotes: -1, duplicateCount: -1, createdAt: -1 };
    } else if (tab === "resolved") {
      sort = { resolvedAt: -1, createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [complaints, totalCount] = await Promise.all([
      Complaint.find(filter)
        .populate("department", "name")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Complaint.countDocuments(filter),
    ]);

    res.json({
      complaints,
      pagination: {
        total: totalCount,
        page: Number(page),
        pages: Math.ceil(totalCount / Number(limit)) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints/:id/upvote (Community 'Affected Too / +1' Upvoting)
async function upvoteComplaint(req, res, next) {
  try {
    const { voterId } = req.body;
    const complaint = await findComplaintByIdOrCode(req.params.id);

    if (!complaint) return res.status(404).json({ message: "Complaint not found." });

    const voterKey = voterId?.trim() || req.ip || "anon_citizen";
    const hasUpvoted = complaint.upvoters && complaint.upvoters.includes(voterKey);

    if (hasUpvoted) {
      // Toggle off upvote
      complaint.upvoters = complaint.upvoters.filter((v) => v !== voterKey);
      complaint.upvotes = Math.max(0, (complaint.upvotes || 1) - 1);
    } else {
      // Add upvote
      if (!complaint.upvoters) complaint.upvoters = [];
      complaint.upvoters.push(voterKey);
      complaint.upvotes = (complaint.upvotes || 0) + 1;

      // Auto-escalate priority to High if >= 5 neighbors upvote
      if (complaint.upvotes >= 5 && complaint.priority === "Normal") {
        complaint.priority = "High";
      }
    }

    await complaint.save();

    res.json({
      message: hasUpvoted ? "Upvote removed" : "Community upvote recorded! (+1 Me Too)",
      upvotes: complaint.upvotes,
      hasUpvoted: !hasUpvoted,
      priority: complaint.priority,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints/stats  (protected)
async function getStats(req, res, next) {
  try {
    const filter = {};
    if (req.user.role !== "admin") {
      filter.department = req.user.department?._id || req.user.department;
    }

    const [total, pending, inProgress, resolved, emergencyCount, piledCount] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.countDocuments({ ...filter, status: "Pending" }),
      Complaint.countDocuments({ ...filter, status: "In Progress" }),
      Complaint.countDocuments({ ...filter, status: "Resolved" }),
      Complaint.countDocuments({ ...filter, isSOS: true, status: { $ne: "Resolved" } }),
      Complaint.countDocuments({ ...filter, duplicateCount: { $gt: 1 }, status: { $ne: "Resolved" } }),
    ]);

    let byDepartment = [];
    if (req.user.role === "admin") {
      byDepartment = await Complaint.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" } },
        { $unwind: "$dept" },
        { $project: { _id: 0, department: "$dept.name", count: 1 } },
        { $sort: { count: -1 } },
      ]);
    }

    res.json({ total, pending, inProgress, resolved, emergencyCount, piledCount, byDepartment });
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
  getPublicFeed,
  upvoteComplaint,
  getStats,
  CATEGORY_DEPARTMENT_MAP,
};
