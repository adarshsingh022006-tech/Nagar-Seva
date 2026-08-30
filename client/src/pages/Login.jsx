// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginRequest } from "../services/api";

const DEMO_ACCOUNTS = [
  { username: "water_dept", password: "dept123", label: "🏢 Water Department" },
  { username: "electricity_dept", password: "dept123", label: "🏢 Electricity Department" },
  { username: "roads_dept", password: "dept123", label: "🏢 Roads & Infrastructure Department" },
  { username: "sanitation_dept", password: "dept123", label: "🏢 Sanitation Department" },
  { username: "general_dept", password: "dept123", label: "🏢 General/Municipal Department" },
  { username: "admin", password: "admin123", label: "🏛️ Admin (all departments)" },
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await loginRequest(username, password);
      localStorage.setItem("nagarseva_token", data.token);
      localStorage.setItem("nagarseva_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-ink"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(242,169,59,.18), transparent 40%), radial-gradient(circle at 80% 80%, rgba(31,138,112,.18), transparent 40%)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="w-11 h-11 rounded-full bg-marigold flex items-center justify-center text-lg mb-4">🏛️</div>
        <h1 className="font-display text-xl font-semibold">Staff Login</h1>
        <p className="text-gray-500 text-sm mb-6">Nagar Seva Complaint Portal</p>

        {error && <div className="bg-red-50 text-clay border border-red-200 rounded-lg px-3 py-2 text-sm mb-3">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-ink-soft mt-2 mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 focus:outline-none focus:border-marigold"
            autoFocus
          />
          <label className="block text-sm font-semibold text-ink-soft mt-3 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 focus:outline-none focus:border-marigold"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-5 bg-ink text-white py-2.5 rounded-lg font-semibold hover:bg-ink-soft disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => setShowDemo((s) => !s)}
          className="w-full mt-4 text-teal text-sm font-semibold"
        >
          {showDemo ? "Hide demo accounts ▴" : "Show all demo accounts ▾"}
        </button>

        {showDemo && (
          <div className="mt-2 border-t border-dashed border-line pt-3 max-h-52 overflow-y-auto">
            {DEMO_ACCOUNTS.map((a) => (
              <div key={a.username} className="flex justify-between text-xs py-1.5 border-b border-gray-100">
                <span>{a.label}</span>
                <code className="bg-gray-100 px-1.5 py-0.5 rounded">{a.username} / {a.password}</code>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-5">
          <Link to="/">← Back to complaint portal</Link>
        </p>
      </div>
    </div>
  );
}
