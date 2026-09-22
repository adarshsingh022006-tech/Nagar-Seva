// utils/generateComplaintId.js
// Produces a human-friendly, sortable ID like CMP-20260829-0001 or SOS-20260829-0001

const Complaint = require("../models/Complaint");

async function generateComplaintId(isSOS = false) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const datePart = `${y}${m}${d}`;
  const tag = isSOS ? "SOS" : "CMP";
  const prefix = `${tag}-${datePart}-`;

  // Find the latest complaint created today with this prefix
  const latest = await Complaint.findOne({
    complaintId: { $regex: `^${prefix}` },
  }).sort({ complaintId: -1 });

  let nextNum = 1;
  if (latest && latest.complaintId) {
    const parts = latest.complaintId.split("-");
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      nextNum = lastSeq + 1;
    }
  }

  const sequence = String(nextNum).padStart(4, "0");
  return `${prefix}${sequence}`;
}

module.exports = generateComplaintId;


