// src/components/MyComplaintsModal.jsx
import { useState } from "react";
import { fetchComplaintsByPhone, getImageUrl } from "../services/api";
import StatusBadge from "./StatusBadge";

export default function MyComplaintsModal({ isOpen, onClose }) {
  const [phone, setPhone] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleLookup(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetchComplaintsByPhone(phone.trim());
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || "No complaints found for this phone number.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="text-3xl mb-1">📱</div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">My Complaints & Civic Karma</h3>
          <p className="text-xs text-gray-500">Enter your registered mobile number to see all your complaints.</p>
        </div>

        <form onSubmit={handleLookup} className="flex gap-2 mb-6">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            className="flex-1 border border-line rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-marigold"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-ink text-white font-bold px-5 rounded-xl text-xs hover:bg-ink-soft disabled:opacity-60 transition-colors"
          >
            {loading ? "Searching..." : "Lookup"}
          </button>
        </form>

        {error && <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl mb-4 font-medium">{error}</div>}

        {data && (
          <div>
            {/* Civic Karma Scorecard */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Citizen Karma Points</div>
                <div className="text-2xl font-extrabold text-amber-900 mt-0.5">{data.stats.karmaScore} Points</div>
                <div className="text-xs font-bold text-amber-800 mt-1">{data.stats.badge}</div>
              </div>
              <div className="text-right text-xs text-gray-600 space-y-0.5">
                <div>Filed: <strong>{data.stats.totalFiled}</strong></div>
                <div>Resolved: <strong>{data.stats.totalResolved}</strong></div>
                <div>Rated: <strong>{data.stats.totalRated}</strong></div>
              </div>
            </div>

            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Your Filed Complaints ({data.complaints.length})
            </h4>

            <div className="space-y-3">
              {data.complaints.map((c) => (
                <div key={c._id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-mono font-bold text-ink text-sm">{c.complaintId}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="font-semibold text-gray-700 mb-1">{c.category} • {c.department?.name || "Department"}</div>
                  <p className="text-gray-600 mb-2">{c.description}</p>
                  <div className="flex justify-between items-center text-[11px] text-gray-400">
                    <span>Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                    <a
                      href={`/track?id=${encodeURIComponent(c.complaintId)}`}
                      className="text-teal font-bold hover:underline text-xs"
                    >
                      Track & Rate →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
