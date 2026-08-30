// utils/generateComplaintId.js
// Produces a human-friendly, sortable ID like CMP-20260829-0001

const Complaint = require("../models/Complaint");

async function generateComplaintId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const datePart = `${y}${m}${d}`;

  const startOfDay = new Date(y, now.getMonth(), now.getDate());
  const endOfDay = new Date(y, now.getMonth(), now.getDate() + 1);

  const countToday = await Complaint.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  const sequence = String(countToday + 1).padStart(4, "0");
  return `CMP-${datePart}-${sequence}`;
}

module.exports = generateComplaintId;
