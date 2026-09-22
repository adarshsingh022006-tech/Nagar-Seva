import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Timeline from "../components/Timeline";
import StatusBadge from "../components/StatusBadge";
import RatingModal from "../components/RatingModal";
import ReopenModal from "../components/ReopenModal";
import { trackComplaint, getImageUrl } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { getSlaInfo } from "../utils/slaHelper";

export default function Track() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("id") || "");
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);

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

              {/* Piled Up Issue Banner */}
              {complaint.duplicateCount > 1 && (
                <div className="bg-amber-100 border-2 border-amber-300 text-amber-900 font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm mb-6 flex items-center gap-2 shadow-sm">
                  <span className="text-xl">🔥</span>
                  <div>
                    <div className="font-extrabold">
                      Piled Up Issue: {complaint.duplicateCount} Citizens Reported This!
                    </div>
                    <div className="text-[11px] font-normal text-amber-800 mt-0.5">
                      Multiple reports merged together from this neighborhood. Priority elevated!
                    </div>
                  </div>
                </div>
              )}

              {/* SLA Countdown Timer Badge */}
              {complaint.slaDeadline && (
                <div className="mb-4 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-600">Resolution SLA:</span>
                    {(() => {
                      const sla = getSlaInfo(complaint.slaDeadline, complaint.status);
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sla.badgeClass}`}>
                          {sla.text}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Deadline: {new Date(complaint.slaDeadline).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Reopened Banner */}
              {complaint.isReopened && (
                <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-3.5 mb-5 text-xs text-red-900">
                  <div className="font-extrabold flex items-center gap-1.5 text-red-700 uppercase tracking-wider mb-1">
                    <span>🔄</span>
                    <span>Issue Re-Opened by Citizen</span>
                  </div>
                  <div className="text-gray-700 italic">"{complaint.reopenReason}"</div>
                  {complaint.reopenedAt && (
                    <div className="text-[10px] text-gray-400 mt-1">
                      Re-opened on: {new Date(complaint.reopenedAt).toLocaleString()}
                    </div>
                  )}
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

              {/* Star Rating Section */}
              {complaint.status === "Resolved" && (
                <div className="mt-6 pt-5 border-t border-gray-100 bg-amber-50/50 rounded-2xl p-4 border border-amber-200">
                  {complaint.rating?.stars ? (
                    <div>
                      <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span>⭐</span>
                        <span>Citizen Satisfaction Rating</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {"⭐".repeat(complaint.rating.stars)}
                        </span>
                        <span className="text-xs font-bold text-gray-700">({complaint.rating.stars}/5)</span>
                      </div>
                      {complaint.rating.comment && (
                        <p className="text-xs text-gray-600 italic">"{complaint.rating.comment}"</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-xs text-amber-900">How was the resolution?</div>
                        <div className="text-[11px] text-gray-500">Rate the municipal team's work to earn Civic Karma!</div>
                      </div>
                      <button
                        onClick={() => setIsRatingOpen(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-ink font-extrabold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm"
                      >
                        ⭐ Rate Work (+20 Karma)
                      </button>
                    </div>
                  )}

                  {/* Reopen Action for Resolved issues */}
                  <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">Problem not resolved or re-occurred?</span>
                    <button
                      onClick={() => setIsReopenOpen(true)}
                      className="text-xs font-bold text-red-600 hover:text-red-700 underline flex items-center gap-1"
                    >
                      <span>🔄</span>
                      <span>Re-Open Issue</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Modals */}
              <RatingModal
                complaintId={complaint.complaintId}
                isOpen={isRatingOpen}
                onClose={() => setIsRatingOpen(false)}
                onRated={() => fetchTracking(complaint.complaintId)}
              />
              <ReopenModal
                complaintId={complaint.complaintId}
                isOpen={isReopenOpen}
                onClose={() => setIsReopenOpen(false)}
                onReopened={() => fetchTracking(complaint.complaintId)}
              />
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


