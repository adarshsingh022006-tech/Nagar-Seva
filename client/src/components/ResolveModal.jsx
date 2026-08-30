// src/components/ResolveModal.jsx
import { useState } from "react";

export default function ResolveModal({ onCancel, onConfirm }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleConfirm() {
    if (!file) {
      setError("Please attach a proof-of-fix photo to resolve this complaint.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onConfirm(file);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/55 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-display text-lg font-semibold mb-1">Verify & resolve</h3>
        <p className="text-sm text-gray-500 mb-4">
          Attach a photo showing the issue has been fixed. This becomes the audit record for this complaint.
        </p>

        <label className="block border-2 border-dashed border-line rounded-xl p-6 text-center cursor-pointer text-sm text-gray-500 hover:border-teal">
          <input type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
          {preview ? (
            <img src={preview} alt="Proof" className="max-h-48 mx-auto rounded-lg" />
          ) : (
            <>📷 Tap to take proof photo</>
          )}
        </label>

        {error && <div className="mt-3 bg-red-50 text-clay text-sm border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 border border-line rounded-lg py-2 text-sm font-semibold hover:border-ink"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 bg-marigold-deep text-ink rounded-lg py-2 text-sm font-bold hover:bg-marigold disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Mark Resolved"}
          </button>
        </div>
      </div>
    </div>
  );
}
