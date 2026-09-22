// src/components/Navbar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import SOSModal from "./SOSModal";

export default function Navbar() {
  const navigate = useNavigate();
  const { language, setLanguage, languages, t } = useLanguage();
  const [isSosOpen, setIsSosOpen] = useState(false);

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

        <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          {/* Emergency SOS Button */}
          <button
            onClick={() => setIsSosOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs shadow-md shadow-red-600/30 flex items-center gap-1.5 animate-pulse active:scale-95 transition-all"
            title="Emergency Civic SOS"
          >
            <span>🚨</span>
            <span className="font-extrabold tracking-wide uppercase">{t("sosButton", "SOS")}</span>
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
              <Link to="/track" className="opacity-85 hover:opacity-100 hidden sm:inline">
                {t("trackComplaint", "Track a complaint")}
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
              <span className="opacity-85 hidden md:inline text-xs">
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

      {/* SOS Modal Component */}
      <SOSModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />
    </>
  );
}


