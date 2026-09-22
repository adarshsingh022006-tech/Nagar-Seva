// src/pages/Track.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Timeline from "../components/Timeline";
import StatusBadge from "../components/StatusBadge";
import { trackComplaint, getImageUrl } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function Track() {
  const { t } = useLanguage();
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
      <div className="max-w-xl mx-auto px-4 mt-8 pb-16">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-4">
            {t("trackTitle", "Track your complaint")}
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("trackPlaceholder", "e.g. CMP-20260829-0001 or SOS-...")}
              className="flex-1 border border-line rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-marigold uppercase"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-ink text-white px-5 rounded-xl font-bold text-sm hover:bg-ink-soft disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? "..." : t("trackBtn", "Track")}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 text-clay border border-red-200 rounded-xl px-4 py-3 text-sm font-medium mb-4">
              {error}
            </div>
          )}

          {complaint && (
            <div>
              {/* Emergency SOS Banner if applicable */}
              {complaint.isSOS && (
                <div className="bg-red-500 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs sm:text-sm text-center mb-6 flex items-center justify-center gap-2 animate-pulse shadow-md">
                  <span>🚨</span>
                  <span>{t("emergencySOSBadge", "EMERGENCY SOS COMPLAINT (HIGH PRIORITY)")}</span>
                </div>
              )}

              <Timeline status={complaint.status} />

              {/* Citizen Voice Note Audio Player */}
              {complaint.audioUrl && (
                <div className="my-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
                    <span>🎙️</span>
                    <span>{t("voiceNoteAttached", "Citizen Voice Note Attached")}</span>
                  </div>
                  <audio
                    src={getImageUrl(complaint.audioUrl)}
                    controls
                    className="w-full max-w-sm mx-auto h-9"
                  />
                </div>
              )}

              {/* Citizen Uploaded Photo */}
              {complaint.photoUrl && (
                <div className="mb-5 text-center">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Complaint Photo</div>
                  <img
                    src={getImageUrl(complaint.photoUrl)}
                    alt="Complaint"
                    onError={(e) => { e.target.style.display = "none"; }}
                    className="max-h-56 mx-auto rounded-xl border border-line shadow-sm"
                  />
                </div>
              )}

              {/* Proof of fix photo */}
              {complaint.status === "Resolved" && complaint.resolutionPhotoUrl && (
                <div className="mb-5 text-center">
                  <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center justify-center gap-1">
                    <span>✅</span>
                    <span>{t("proofOfFix", "Proof of fix")}</span>
                  </div>
                  <img
                    src={getImageUrl(complaint.resolutionPhotoUrl)}
                    alt="Proof of fix"
                    onError={(e) => { e.target.style.display = "none"; }}
                    className="max-h-56 mx-auto rounded-xl border-2 border-emerald-300 shadow-sm"
                  />
                </div>
              )}

              <Row label="Complaint ID" value={<span className="font-mono font-bold text-ink">{complaint.complaintId}</span>} />
              <Row label="Category" value={complaint.category} />
              <Row label="Department" value={complaint.department?.name || "—"} />
              <Row label="Description" value={complaint.description} />
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
    <div className="flex justify-between py-2.5 border-b border-line text-xs sm:text-sm gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}


