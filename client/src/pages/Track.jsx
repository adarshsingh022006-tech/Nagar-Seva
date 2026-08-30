// src/pages/Track.jsx
import { useState } from "react";
import Navbar from "../components/Navbar";
import Timeline from "../components/Timeline";
import StatusBadge from "../components/StatusBadge";
import { trackComplaint } from "../services/api";

export default function Track() {
  const [code, setCode] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e?.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setComplaint(null);
    try {
      const data = await trackComplaint(code.trim());
      setComplaint(data);
    } catch (err) {
      setError("No complaint found with that ID. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-xl mx-auto px-4 mt-10 pb-16">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold mb-4">Track your complaint</h2>
          <form onSubmit={handleSearch} className="flex gap-2 mb-5">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CMP-20260829-0001"
              className="flex-1 border border-line rounded-lg px-3 py-2.5 focus:outline-none focus:border-marigold"
            />
            <button type="submit" className="bg-ink text-white px-5 rounded-lg font-semibold hover:bg-ink-soft">
              {loading ? "..." : "Track"}
            </button>
          </form>

          {error && <div className="bg-red-50 text-clay border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>}

          {complaint && (
            <div>
              <Timeline status={complaint.status} />

              {complaint.status === "Resolved" && complaint.resolutionPhotoUrl && (
                <div className="mb-5 text-center">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Proof of fix</div>
                  <img
                    src={complaint.resolutionPhotoUrl}
                    alt="Proof of fix"
                    className="max-h-56 mx-auto rounded-lg border border-line"
                  />
                </div>
              )}

              <Row label="Complaint ID" value={<span className="font-mono">{complaint.complaintId}</span>} />
              <Row label="Category" value={complaint.category} />
              <Row label="Department" value={complaint.department?.name || "—"} />
              <Row label="Status" value={<StatusBadge status={complaint.status} />} />
              <Row label="Filed on" value={new Date(complaint.createdAt).toLocaleString()} />
              {complaint.resolvedAt && (
                <Row label="Resolved on" value={new Date(complaint.resolvedAt).toLocaleString()} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-line text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
