// src/pages/NagarFeed.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import NagarFeedCard from "../components/NagarFeedCard";
import PublicAlertsBanner from "../components/PublicAlertsBanner";
import { fetchPublicFeed } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const CATEGORIES = [
  "All",
  "Water Supply",
  "Electricity",
  "Roads",
  "Sanitation",
  "Street Lights",
  "Other",
];

export default function NagarFeed() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("trending"); // "trending" | "resolved" | "all" | "emergency"
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadFeed = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        tab: activeTab,
        page: targetPage,
        limit: 12,
      };
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await fetchPublicFeed(params);
      setComplaints(data.complaints || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
      setPage(targetPage);
    } catch (err) {
      console.error("Failed to load Nagar Feed:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, searchQuery]);

  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadFeed(1);
  }

  return (
    <div className="min-h-screen bg-sand/30 pb-20">
      <Navbar />
      <PublicAlertsBanner />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-ink via-slate-900 to-ink text-white rounded-3xl p-6 sm:p-10 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-marigold/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-300 mb-3">
              <span>📰</span>
              <span>COMMUNITY CIVIC STREAM</span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-bold mb-3 tracking-tight">
              Nagar Feed — City Pulse & Resolutions
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6">
              Explore civic issues reported in your neighborhoods, upvote problems affecting you
              (<span className="font-bold text-amber-300">"Affected Too +1"</span>) to accelerate municipal priority, and inspect verified Before vs. After resolution proofs.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-xl">
              <input
                type="text"
                placeholder="Search by neighborhood, keyword (e.g. pothole, leak), or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-white/10 border border-white/25 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:bg-white/20 focus:border-amber-300 transition-all backdrop-blur-md"
              />
              <button
                type="submit"
                className="bg-marigold hover:bg-yellow-400 text-ink font-bold px-5 rounded-2xl text-xs sm:text-sm transition-all shadow-md active:scale-95 shrink-0"
              >
                🔍 Search
              </button>
            </form>
          </div>
        </div>

        {/* Tab Switcher & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Main Feed Tabs */}
          <div className="bg-white p-1 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("trending")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "trending"
                  ? "bg-amber-500 text-ink shadow-md shadow-amber-500/20"
                  : "text-gray-600 hover:text-ink hover:bg-gray-50"
              }`}
            >
              <span>🔥</span>
              <span>Trending (+1 Upvoted)</span>
            </button>

            <button
              onClick={() => setActiveTab("resolved")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "resolved"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-gray-600 hover:text-ink hover:bg-gray-50"
              }`}
            >
              <span>✨</span>
              <span>Resolved Showcase</span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-ink text-white shadow"
                  : "text-gray-600 hover:text-ink hover:bg-gray-50"
              }`}
            >
              <span>⏱️</span>
              <span>Recent Stream</span>
            </button>

            <button
              onClick={() => setActiveTab("emergency")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "emergency"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "text-gray-600 hover:text-ink hover:bg-gray-50"
              }`}
            >
              <span>🚨</span>
              <span>Emergency SOS</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-semibold flex items-center gap-2">
            <span>Showing <strong className="text-ink">{complaints.length}</strong> of <strong className="text-ink">{totalCount}</strong> reports</span>
            <button
              onClick={() => loadFeed(page)}
              disabled={loading}
              className="text-teal hover:underline font-bold"
            >
              {loading ? "..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-ink text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feed Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-6 h-80 animate-pulse border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-6"></div>
                <div className="h-44 bg-gray-100 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : complaints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complaints.map((c) => (
              <NagarFeedCard
                key={c._id || c.complaintId}
                complaint={c}
                onUpvoted={(id, newVotes) => {
                  setComplaints((prev) =>
                    prev.map((item) => (item._id === id ? { ...item, upvotes: newVotes } : item))
                  );
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
            <div className="text-5xl mb-3">🌱</div>
            <h3 className="font-display text-lg font-bold text-ink mb-1">No complaints found</h3>
            <p className="text-xs text-gray-500 mb-6">
              There are no matching complaints in this stream right now. Have an issue to report?
            </p>
            <Link
              to="/"
              className="bg-marigold hover:bg-yellow-400 text-ink font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm inline-block"
            >
              ✍️ File a Civic Complaint
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              disabled={page <= 1 || loading}
              onClick={() => loadFeed(page - 1)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 disabled:opacity-40 hover:bg-gray-50"
            >
              ← Previous
            </button>
            <span className="text-xs font-bold text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => loadFeed(page + 1)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 disabled:opacity-40 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
