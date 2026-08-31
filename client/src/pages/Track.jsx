// src/pages/Track.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Timeline from "../components/Timeline";
import StatusBadge from "../components/StatusBadge";
import { trackComplaint, getImageUrl } from "../services/api";

export default function Track() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("id") || "");
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const idFromQuery = searchParams.get("id");
    if (idFromQuery) {
      setCode(idFromQuery);
      fetchTracking(idFromQuery);
    }
  }, [searchParams]);

  async function fetchTracking(idToSearch) {
    if (!idToSearch?.trim()) return;
    setLoading(true);
    setError("");
    setComplaint(null);
    try {
      const data = await trackComplaint(idToSearch.trim());
      setComplaint(data);
    } catch (err) {
      setError(err.response?.data?.message || "No complaint found with that ID. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e?.preventDefault();
    fetchTracking(code);
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
              className="flex-1 border border-line rounded-lg px-3 py-2.5 focus:outline-none focus:border-marigold uppercase"
            />
            <button type="submit" disabled={loading} className="bg-ink text-white px-5 rounded-lg font-semibold hover:bg-ink-soft disabled:opacity-60">
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
                    src={getImageUrl(complaint.resolutionPhotoUrl)}
                    alt="Proof of fix"
                    onError={(e) => { e.target.style.display = "none"; }}
                    className="max-h-56 mx-auto rounded-lg border border-line"
                  />
                </div>
              )}

              <Row label="Complaint ID" value={<span className="font-mono font-semibold">{complaint.complaintId}</span>} />
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

