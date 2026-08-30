// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const userJson = localStorage.getItem("nagarseva_user");
  const user = userJson ? JSON.parse(userJson) : null;

  function logout() {
    localStorage.removeItem("nagarseva_token");
    localStorage.removeItem("nagarseva_user");
    navigate("/login");
  }

  return (
    <header className="bg-ink text-white px-4 md:px-8 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-display font-semibold text-lg">
        <span className="w-8 h-8 rounded-full bg-marigold text-ink flex items-center justify-center text-base">
          🏛️
        </span>
        Nagar Seva
      </Link>
      <nav className="flex items-center gap-3 md:gap-5 text-sm">
        {!user && (
          <>
            <Link to="/track" className="opacity-85 hover:opacity-100">Track a complaint</Link>
            <Link to="/login" className="border border-white/30 px-3 py-1.5 rounded-lg hover:bg-white/10">
              Staff login
            </Link>
          </>
        )}
        {user && (
          <>
            <span className="opacity-85 hidden sm:inline">
              👤 {user.username} {user.role === "admin" ? "(Admin)" : user.department ? `(${user.department.name})` : ""}
            </span>
            <button
              onClick={logout}
              className="border border-white/30 px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
