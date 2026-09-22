// src/components/ReopenModal.jsx
import { useState } from "react";
import { reopenComplaint } from "../services/api";

export default function ReopenModal({ complaintId, isOpen, onClose, onReopened }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please explain why the issue was not resolved properly.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await reopenComplaint(complaintId, { reason });
      onReopened && onReopened();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to re-open complaint.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-red-400 animate-fadeIn">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">🔄</div>
          <h3 className="font-display text-xl font-bold text-red-600">Re-Open Unresolved Complaint</h3>
          <p className="text-xs text-gray-500">
            If the work done was unsatisfactory or the issue re-occurred, department officers will be re-assigned.
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-xl mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this problem still persists..."
            rows={3}
            className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:outline-none focus:border-red-500"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
            >
              {submitting ? "Re-opening..." : "Re-Open as High Priority"}
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
