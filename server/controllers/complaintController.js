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
  "Street Lights": "Electricity Department", // shares the Electrical/Municipal team
  "Other": "General/Municipal Department",
};

function fileUrl(req, filename) {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

// POST /api/complaints  (public, multipart/form-data)
async function createComplaint(req, res) {
  try {
    const { citizenName, phone, category, description, lat, lng, address } = req.body;

    if (!phone || !category || !description) {
      return res.status(400).json({ message: "Phone, category and description are required." });
    }
    if (!CATEGORY_DEPARTMENT_MAP[category]) {
      return res.status(400).json({ message: "Invalid category." });
    }

    const deptName = CATEGORY_DEPARTMENT_MAP[category];
    const department = await Department.findOne({ name: deptName });
    if (!department) {
      return res.status(500).json({ message: `Department "${deptName}" not found — did you run "npm run seed"?` });
    }

    const photoUrl = req.file ? fileUrl(req, req.file.filename) : null;

    // Retry a couple of times in the rare case two complaints are filed in
    // the same millisecond and collide on the generated ID.
    let complaint;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const complaintId = await generateComplaintId();
        complaint = await Complaint.create({
          complaintId,
          citizenName,
          phone,
          category,
          department: department._id,
          description,
          photoUrl,
          location: {
            lat: lat ? Number(lat) : null,
            lng: lng ? Number(lng) : null,
            address: address || "",
          },
        });
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < 2) continue; // duplicate complaintId, retry
        throw err;
      }
    }

    res.status(201).json({
      message: "Complaint filed successfully",
      complaintId: complaint.complaintId,
      department: deptName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong while filing the complaint." });
  }
}

// GET /api/complaints/track/:complaintId  (public)
async function trackComplaint(req, res) {
  const complaint = await Complaint.findOne({ complaintId: req.params.complaintId })
    .populate("department", "name");
  if (!complaint) return res.status(404).json({ message: "No complaint found with that ID." });
  res.json(complaint);
}

// GET /api/complaints  (protected — department-scoped unless admin)
async function listComplaints(req, res) {
  const filter = {};
  if (req.user.role === "department") {
    filter.department = req.user.department._id || req.user.department;
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const complaints = await Complaint.find(filter)
    .populate("department", "name")
    .sort("-createdAt");
  res.json(complaints);
}

// PATCH /api/complaints/:id/status  (protected — Pending / In Progress only)
// Resolving requires a proof photo, so it's handled by resolveComplaint() instead.
async function updateStatus(req, res) {
  const { status } = req.body;
  if (!["Pending", "In Progress"].includes(status)) {
    return res.status(400).json({
      message: "Resolving a complaint requires a proof-of-fix photo — use the Resolve action instead.",
    });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: "Complaint not found." });

  if (req.user.role === "department") {
    const myDept = String(req.user.department._id || req.user.department);
    if (String(complaint.department) !== myDept) {
      return res.status(403).json({ message: "This complaint isn't assigned to your department." });
    }
  }

  complaint.status = status;
  await complaint.save();
  res.json({ message: "Status updated", complaint });
}

// PATCH /api/complaints/:id/resolve  (protected, multipart/form-data — photo required)
async function resolveComplaint(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "A proof-of-fix photo is required to resolve a complaint." });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: "Complaint not found." });

  if (req.user.role === "department") {
    const myDept = String(req.user.department._id || req.user.department);
    if (String(complaint.department) !== myDept) {
      return res.status(403).json({ message: "This complaint isn't assigned to your department." });
    }
  }

  complaint.status = "Resolved";
  complaint.resolutionPhotoUrl = fileUrl(req, req.file.filename);
  complaint.resolvedBy = req.user.username;
  complaint.resolvedAt = new Date();
  await complaint.save();

  res.json({ message: "Complaint marked as resolved", complaint });
}

// GET /api/complaints/stats  (protected — department-scoped unless admin)
async function getStats(req, res) {
  const filter = {};
  if (req.user.role === "department") {
    filter.department = req.user.department._id || req.user.department;
  }

  const [total, pending, inProgress, resolved] = await Promise.all([
    Complaint.countDocuments(filter),
    Complaint.countDocuments({ ...filter, status: "Pending" }),
    Complaint.countDocuments({ ...filter, status: "In Progress" }),
    Complaint.countDocuments({ ...filter, status: "Resolved" }),
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

  res.json({ total, pending, inProgress, resolved, byDepartment });
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
