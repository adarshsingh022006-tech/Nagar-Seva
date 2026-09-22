// src/components/LeaderboardModal.jsx
import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../services/api";

export default function LeaderboardModal({ isOpen, onClose }) {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchLeaderboard()
        .then((data) => setCitizens(data || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-300 relative animate-fadeIn max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-1">🏆</div>
          <h3 className="font-display text-2xl font-bold text-ink">Civic Champions Leaderboard</h3>
          <p className="text-xs text-gray-500">Top citizens helping make the city cleaner, safer, and better!</p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-gray-400">Loading champions...</div>
        ) : (
          <div className="space-y-2">
            {citizens.map((c, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl flex items-center justify-between text-xs sm:text-sm ${
                  i === 0
                    ? "bg-amber-100/70 border-2 border-amber-300 font-bold"
                    : i === 1
                    ? "bg-gray-100 border border-gray-300"
                    : i === 2
                    ? "bg-orange-50 border border-orange-200"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold w-6 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div>
                    <div className="font-bold text-ink">{c.name}</div>
                    <div className="text-[10px] text-gray-500">{c.reportsFiled} reports • {c.resolvedIssues} resolved</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-extrabold text-amber-900">{c.karmaScore} pts</div>
                  <div className="text-[10px] text-gray-400">Karma</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
