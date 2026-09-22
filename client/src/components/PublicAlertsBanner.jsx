// src/components/PublicAlertsBanner.jsx
import { useEffect, useState } from "react";
import { fetchAnnouncements } from "../services/api";

export default function PublicAlertsBanner() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetchAnnouncements()
      .then((data) => setAnnouncements(data || []))
      .catch((err) => console.error("Could not load alerts:", err));
  }, []);

  if (!announcements.length) return null;

  const current = announcements[0]; // Active top broadcast alert

  return (
    <div className="bg-amber-500 text-ink px-4 py-2 text-xs sm:text-sm font-semibold border-b border-amber-600 flex items-center justify-between animate-fadeIn">
      <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-hidden w-full">
        <span className="bg-ink text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full shrink-0">
          📢 Municipal Notice
        </span>
        <div className="truncate flex-1">
          <strong>{current.title}:</strong> {current.content}
        </div>
        <span className="text-[11px] text-ink/70 hidden md:inline shrink-0">
          🏛️ {current.ward}
        </span>
      </div>
    </div>
  );
}
