// src/components/NagarFeedCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import BeforeAfterSlider from "./BeforeAfterSlider";
import { getSlaInfo } from "../utils/slaHelper";
import { getImageUrl, upvoteComplaint } from "../services/api";

export default function NagarFeedCard({ complaint, onUpvoted }) {
  const voterKey = localStorage.getItem("nagarseva_voter_id") || "anon_" + Math.random().toString(36).slice(2, 9);
  if (!localStorage.getItem("nagarseva_voter_id")) {
    localStorage.setItem("nagarseva_voter_id", voterKey);
  }

  const [upvotes, setUpvotes] = useState(complaint.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(complaint.upvoters?.includes(voterKey) || false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [copied, setCopied] = useState(false);

  const sla = complaint.slaDeadline ? getSlaInfo(complaint.slaDeadline, complaint.status) : null;
  const isResolved = complaint.status === "Resolved";
  const hasBothPhotos = Boolean(complaint.photoUrl && complaint.resolutionPhotoUrl);

  async function handleUpvote(e) {
    e.preventDefault();
    if (isUpvoting) return;

    // Optimistic UI update
    const nextState = !hasUpvoted;
    setHasUpvoted(nextState);
    setUpvotes((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    setIsUpvoting(true);

    try {
      const res = await upvoteComplaint(complaint._id || complaint.complaintId, voterKey);
      setUpvotes(res.upvotes);
      setHasUpvoted(res.hasUpvoted);
      onUpvoted && onUpvoted(complaint._id, res.upvotes);
    } catch (err) {
      // Revert on error
      setHasUpvoted(!nextState);
      setUpvotes((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setIsUpvoting(false);
    }
  }

  function handleCopyShare(e) {
    e.preventDefault();
    const url = `${window.location.origin}/track?id=${complaint.complaintId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareText = encodeURIComponent(
    `🚨 Civic Issue Reported in Nagar Seva: "${complaint.description}" (${complaint.category}). Track & Support: ${window.location.origin}/track?id=${complaint.complaintId}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      {/* Card Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-ink bg-gray-100 px-2 py-1 rounded-lg">
              {complaint.complaintId}
            </span>
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
              {complaint.category}
            </span>
            {complaint.isSOS && (
              <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <span>🚨</span>
                <span>SOS URGENT</span>
              </span>
            )}
            {complaint.duplicateCount > 1 && (
              <span className="bg-amber-500 text-ink text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <span>🔥</span>
                <span>{complaint.duplicateCount} Piled Reports</span>
              </span>
            )}
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        {/* Description */}
        <p className="text-gray-800 text-sm font-medium leading-relaxed mb-3 line-clamp-3">
          {complaint.description}
        </p>

        {/* Location & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 mb-3">
          {complaint.location?.lat ? (
            <a
              href={`https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}`}
              target="_blank"
              rel="noreferrer"
              className="text-teal font-bold hover:underline flex items-center gap-1"
            >
              <span>📍</span>
              <span>{complaint.location.address || "Map Coordinates Tagged"}</span>
            </a>
          ) : (
            <span className="flex items-center gap-1">
              <span>📍</span>
              <span>{complaint.location?.address || "Location Attached"}</span>
            </span>
          )}
          <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
        </div>

        {/* SLA Countdown pill */}
        {sla && (
          <div className="mb-3">
            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${sla.badgeClass}`}>
              {sla.text}
            </span>
          </div>
        )}

        {/* Voice Note Player if attached */}
        {complaint.audioUrl && (
          <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-2 flex items-center gap-2">
            <span className="text-xs">🎙️ Voice Note:</span>
            <audio src={getImageUrl(complaint.audioUrl)} controls className="h-6 flex-1" />
          </div>
        )}
      </div>

      {/* Visual Media Showcase */}
      <div className="px-5 mb-4">
        {hasBothPhotos ? (
          <BeforeAfterSlider
            beforeUrl={complaint.photoUrl}
            afterUrl={complaint.resolutionPhotoUrl}
          />
        ) : complaint.photoUrl ? (
          <div className="relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 h-52 group">
            <img
              src={getImageUrl(complaint.photoUrl)}
              alt="Complaint Photo"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
              📷 Citizen Problem Photo
            </span>
          </div>
        ) : complaint.resolutionPhotoUrl ? (
          <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-gray-50 h-52">
            <img
              src={getImageUrl(complaint.resolutionPhotoUrl)}
              alt="Resolution Proof"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
              ✅ Proof of Fix
            </span>
          </div>
        ) : null}
      </div>

      {/* Star Rating Review if resolved */}
      {isResolved && complaint.rating?.stars && (
        <div className="px-5 py-2.5 mx-5 mb-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <span>{"⭐".repeat(complaint.rating.stars)}</span>
            <span>({complaint.rating.stars}/5 Citizen Satisfaction)</span>
          </div>
          {complaint.rating.comment && (
            <p className="text-gray-600 italic text-[11px] mt-1">"{complaint.rating.comment}"</p>
          )}
        </div>
      )}

      {/* Card Footer Actions */}
      <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
        {/* Community Upvote Button */}
        <button
          onClick={handleUpvote}
          disabled={isUpvoting}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm ${
            hasUpvoted
              ? "bg-amber-500 text-ink shadow-amber-500/20 scale-105"
              : "bg-white border border-gray-200 text-gray-700 hover:border-amber-400 hover:text-amber-700"
          }`}
          title="Click to express that you are also facing this problem"
        >
          <span>{hasUpvoted ? "👍" : "🤝"}</span>
          <span>{hasUpvoted ? "Affected (+1)" : "Affected Too (+1)"}</span>
          <span className="bg-ink/10 text-ink px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ml-0.5">
            {upvotes}
          </span>
        </button>

        {/* Share & Track Actions */}
        <div className="flex items-center gap-1.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold transition-colors"
            title="Share on WhatsApp Neighborhood Group"
          >
            💬
          </a>

          <button
            onClick={handleCopyShare}
            className="w-8 h-8 rounded-xl bg-gray-200/70 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors"
            title={copied ? "Link Copied!" : "Copy Track Link"}
          >
            {copied ? "✓" : "🔗"}
          </button>

          <Link
            to={`/track?id=${complaint.complaintId}`}
            className="bg-ink hover:bg-ink-soft text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors shadow-sm ml-1"
          >
            Track →
          </Link>
        </div>
      </div>
    </div>
  );
}
