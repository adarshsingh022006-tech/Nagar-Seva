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
    });
  } catch (err) {
    console.error("Error creating complaint:", err);
    next(err);
  }
}

// GET /api/complaints/track/:complaintId  (public)
async function trackComplaint(req, res, next) {
  try {
    const queryId = req.params.complaintId.trim();
    const complaint = await Complaint.findOne({
      complaintId: { $regex: new RegExp(`^${queryId}$`, "i") },
    }).populate("department", "name");

    if (!complaint) {
      return res.status(404).json({ message: "No complaint found with that ID." });
    }
    res.json(complaint);
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints  (protected — department-scoped unless admin)
async function listComplaints(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === "department") {
      filter.department = req.user.department?._id || req.user.department;
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
    if (!["Pending", "In Progress"].includes(status)) {
      return res.status(400).json({
        message: "Resolving a complaint requires a proof-of-fix photo — use the Resolve action instead.",
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });

    if (req.user.role === "department") {
      const myDept = String(req.user.department?._id || req.user.department);
      if (String(complaint.department) !== myDept) {
        return res.status(403).json({ message: "This complaint isn't assigned to your department." });
      }
    }

    complaint.status = status;
    await complaint.save();
    res.json({ message: "Status updated", complaint });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/complaints/:id/resolve  (protected, multipart/form-data — photo required)
async function resolveComplaint(req, res, next) {
  try {
    const photoFile = req.file || (req.files?.photo && req.files.photo[0]);
    if (!photoFile) {
      return res.status(400).json({ message: "A proof-of-fix photo is required to resolve a complaint." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });

    if (req.user.role === "department") {
      const myDept = String(req.user.department?._id || req.user.department);
      if (String(complaint.department) !== myDept) {
        return res.status(403).json({ message: "This complaint isn't assigned to your department." });
      }
    }

    complaint.status = "Resolved";
    complaint.resolutionPhotoUrl = fileUrl(req, photoFile.filename);
    complaint.resolvedBy = req.user.username;
    complaint.resolvedAt = new Date();
    await complaint.save();

    res.json({ message: "Complaint marked as resolved", complaint });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints/stats  (protected — department-scoped unless admin)
async function getStats(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === "department") {
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
  getStats,
  CATEGORY_DEPARTMENT_MAP,
};


