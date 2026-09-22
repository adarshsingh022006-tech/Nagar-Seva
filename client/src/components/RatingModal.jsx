// src/components/RatingModal.jsx
import { useState } from "react";
import { rateComplaint } from "../services/api";

export default function RatingModal({ complaintId, isOpen, onClose, onRated }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await rateComplaint(complaintId, { stars, comment });
      onRated && onRated({ stars, comment });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-300 animate-fadeIn">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">⭐</div>
          <h3 className="font-display text-xl font-bold text-ink">Rate Municipal Resolution</h3>
          <p className="text-xs text-gray-500">How satisfied are you with the resolution of #{complaintId}?</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-xl mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setStars(star)}
                className={`text-3xl transition-transform hover:scale-125 ${star <= stars ? "opacity-100" : "opacity-30"}`}
              >
                ⭐
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a feedback or appreciation for the municipal staff (optional)..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-amber-400"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-ink font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Rating (+20 Karma)"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-2.5 rounded-xl text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
