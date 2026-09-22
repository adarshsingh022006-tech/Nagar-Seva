// src/components/Navbar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import SOSModal from "./SOSModal";
import MyComplaintsModal from "./MyComplaintsModal";
import LeaderboardModal from "./LeaderboardModal";

export default function Navbar() {
  const navigate = useNavigate();
  const { language, setLanguage, languages, t } = useLanguage();
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isMyComplaintsOpen, setIsMyComplaintsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  let user = null;
  try {
    const userJson = localStorage.getItem("nagarseva_user");
    if (userJson) user = JSON.parse(userJson);
  } catch (e) {
    user = null;
  }

  function logout() {
    try {
      localStorage.removeItem("nagarseva_token");
      localStorage.removeItem("nagarseva_user");
    } catch (e) {
      // ignore
    }
    navigate("/login");
  }

  return (
    <>
      <header className="bg-ink text-white px-3 sm:px-6 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <Link to="/" className="flex items-center gap-2 font-display font-semibold text-lg shrink-0">
          <span className="w-8 h-8 rounded-full bg-marigold text-ink flex items-center justify-center text-base">
            🏛️
          </span>
          <span className="hidden xs:inline sm:inline">{t("portalTitle", "Nagar Seva")}</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3.5 text-xs sm:text-sm">
          {/* Emergency SOS Button */}
          <button
            onClick={() => setIsSosOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 sm:px-3 py-1.5 rounded-lg text-xs shadow-md shadow-red-600/30 flex items-center gap-1.5 animate-pulse active:scale-95 transition-all"
            title="Emergency Civic SOS"
          >
            <span>🚨</span>
            <span className="font-extrabold tracking-wide uppercase">{t("sosButton", "SOS")}</span>
          </button>

          {/* Nagar Feed Button */}
          <Link
            to="/feed"
            className="inline-flex items-center gap-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
            title="Community Civic Feed"
          >
            <span>📰</span>
            <span>Nagar Feed</span>
          </Link>

          {/* Leaderboard Button */}
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="hidden sm:inline-flex items-center gap-1 bg-white/10 hover:bg-white/15 border border-white/20 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            title="Civic Champions"
          >
            <span>🏆</span>
            <span>Champions</span>
          </button>

          {/* My Complaints (Phone Lookup) */}
          <button
            onClick={() => setIsMyComplaintsOpen(true)}
            className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/15 border border-white/20 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            title="My Complaints & Karma"
          >
            <span>📱</span>
            <span>My Complaints</span>
          </button>

          {/* Regional Language Switcher */}
          <div className="relative inline-flex items-center bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg px-2 py-1 transition-colors">
            <span className="text-xs mr-1 opacity-80">🌐</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} className="bg-ink text-white">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {!user ? (
            <>
              <Link to="/track" className="opacity-85 hover:opacity-100 hidden md:inline">
                {t("trackComplaint", "Track")}
              </Link>
              <Link
                to="/login"
                className="border border-white/30 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs sm:text-sm"
              >
                {t("staffLogin", "Staff login")}
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="opacity-85 hover:opacity-100 font-medium">
                {t("dashboard", "Dashboard")}
              </Link>
              <span className="opacity-85 hidden lg:inline text-xs">
                👤 {user.username} {user.role === "admin" ? "(Admin)" : user.department?.name ? `(${user.department.name})` : ""}
              </span>
              <button
                onClick={logout}
                className="border border-white/30 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs"
              >
                {t("logout", "Logout")}
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Modals */}
      <SOSModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />
      <MyComplaintsModal isOpen={isMyComplaintsOpen} onClose={() => setIsMyComplaintsOpen(false)} />
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
    </>
  );
}



