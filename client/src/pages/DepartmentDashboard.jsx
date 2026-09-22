// src/pages/DepartmentDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ResolveModal from "../components/ResolveModal";
import { fetchComplaints, fetchStats, updateComplaintStatus, resolveComplaint, getImageUrl } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function DepartmentDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [sosFilter, setSosFilter] = useState(false);
  const [piledFilter, setPiledFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [resolveTarget, setResolveTarget] = useState(null);
  const [viewClusterTarget, setViewClusterTarget] = useState(null); // complaint with merged reports

  useEffect(() => {
    const token = localStorage.getItem("nagarseva_token");
    const userJson = localStorage.getItem("nagarseva_user");
    if (!token || !userJson) {
      navigate("/login");
      return;
    }
    try {
      setUser(JSON.parse(userJson));
    } catch (e) {
      localStorage.removeItem("nagarseva_token");
      localStorage.removeItem("nagarseva_user");
      navigate("/login");
    }
  }, [navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (sosFilter) params.isSOS = "true";
      if (piledFilter) params.piledOnly = "true";

      const [statsData, complaintsData] = await Promise.all([
        fetchStats(),
        fetchComplaints(params),
      ]);
      setStats(statsData);
      setComplaints(complaintsData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      showToast(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sosFilter, piledFilter]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleStatusChange(id, newStatus) {
    if (newStatus === "Resolved") {
      setResolveTarget(id);
      return;
    }
    try {
      await updateComplaintStatus(id, newStatus);
      showToast(`Status updated to "${newStatus}"`);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status.");
    }
  }

  async function handleResolveConfirm(file) {
    const fd = new FormData();
    fd.append("photo", file);
    await resolveComplaint(resolveTarget, fd);
    showToast("Complaint cluster resolved with proof photo ✅");
    setResolveTarget(null);
    loadData();
  }

  if (!user) return null;

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Urgent Emergency Alert Banner */}
        {stats?.emergencyCount > 0 && (
          <div className="bg-red-600 text-white p-4 rounded-2xl mb-6 shadow-lg shadow-red-600/30 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <div className="font-extrabold text-sm sm:text-base uppercase tracking-wider">
                  {stats.emergencyCount} Unresolved Emergency SOS {stats.emergencyCount > 1 ? "Alerts" : "Alert"}
                </div>
                <div className="text-xs text-red-100">
                  High-priority public safety hazards requiring immediate departmental action.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSosFilter(true);
                setPiledFilter(false);
                setStatusFilter("");
              }}
              className="bg-white text-red-700 font-extrabold px-3.5 py-1.5 rounded-xl text-xs hover:bg-red-50 transition-colors shadow"
            >
              View SOS Only
            </button>
          </div>
        )}

        {/* Piled Up / Duplicate Complaints Urgent Banner */}
        {stats?.piledCount > 0 && !piledFilter && (
          <div className="bg-amber-500 text-ink p-4 rounded-2xl mb-6 shadow-md border border-amber-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="font-extrabold text-sm sm:text-base uppercase tracking-wider">
                  {stats.piledCount} High-Urgency Piled Complaints (Multiple Reports)
                </div>
                <div className="text-xs text-ink/80">
                  Multiple citizens reported the exact same civic problem in the same neighborhood.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setPiledFilter(true);
                setSosFilter(false);
                setStatusFilter("");
              }}
              className="bg-ink text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs hover:bg-ink-soft transition-colors shadow"
            >
              View Piled Only 🔥
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="font-display text-xl sm:text-2xl font-bold">
            {user.role === "admin"
              ? "🏛️ Admin Portal — All Departments"
              : `📋 ${user.department?.name || "Department"} Dashboard`}
          </h1>
          {user.role === "admin" && (
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full w-fit">
              Master Admin Mode
            </span>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} accent="pending" />
            <StatCard label="In Progress" value={stats.inProgress} accent="progress" />
            <StatCard label="Resolved" value={stats.resolved} accent="resolved" />
          </div>
        )}

        {user.role === "admin" && stats?.byDepartment?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
            <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider mb-3">Complaints By Department</h3>
            <div className="space-y-2">
              {stats.byDepartment.map((d) => {
                const maxCount = Math.max(...stats.byDepartment.map((x) => x.count), 1);
                const pct = Math.round((d.count / maxCount) * 100);
                return (
                  <div key={d.department} className="flex items-center gap-3 text-xs sm:text-sm">
                    <div className="w-44 sm:w-56 shrink-0 text-gray-700 font-medium truncate">{d.department}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-teal h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-8 text-right font-bold text-ink">{d.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-3 rounded-2xl border border-gray-100">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setSosFilter(!sosFilter);
                if (!sosFilter) setPiledFilter(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                sosFilter
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
              }`}
            >
              <span>🚨</span>
              <span>{sosFilter ? "Showing SOS Only" : "Filter SOS"}</span>
            </button>

            <button
              onClick={() => {
                setPiledFilter(!piledFilter);
                if (!piledFilter) setSosFilter(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                piledFilter
                  ? "bg-amber-500 text-ink shadow-md shadow-amber-500/30"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300"
              }`}
            >
              <span>🔥</span>
              <span>{piledFilter ? "Showing Piled Up Only" : "Filter Piled Up Duplicates"}</span>
            </button>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-line rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-marigold"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="bg-ink text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-ink-soft disabled:opacity-60 transition-colors shadow-sm"
          >
            {loading ? "Loading..." : "🔄 Refresh"}
          </button>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
                <th className="px-3 py-3.5">ID & Duplicates</th>
                <th className="px-3 py-3.5">Photo & Audio</th>
                {user.role === "admin" && <th className="px-3 py-3.5">Department</th>}
                <th className="px-3 py-3.5">Description</th>
                <th className="px-3 py-3.5">Location</th>
                <th className="px-3 py-3.5">Citizens</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="px-3 py-3.5">Proof of fix</th>
                <th className="px-3 py-3.5">Filed</th>
                {user.role !== "admin" && <th className="px-3 py-3.5">Action</th>}
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr
                  key={c._id}
                  className={`border-t border-gray-100 hover:bg-gray-50/80 transition-colors ${
                    c.isSOS ? "bg-red-50/40" : c.duplicateCount > 1 ? "bg-amber-50/40" : ""
                  }`}
                >
                  <td className="px-3 py-3 font-mono">
                    <div className="font-bold text-ink">{c.complaintId}</div>
                    {c.isSOS && (
                      <span className="inline-block bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 animate-pulse">
                        🚨 SOS
                      </span>
                    )}
                    {c.duplicateCount > 1 && (
                      <button
                        onClick={() => setViewClusterTarget(c)}
                        className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-ink text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 shadow-sm transition-transform active:scale-95"
                        title="Click to view all merged citizen reports"
                      >
                        <span>🔥</span>
                        <span>{c.duplicateCount} Piled Up</span>
                      </button>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1.5 items-start">
                      {c.photoUrl ? (
                        <a href={getImageUrl(c.photoUrl)} target="_blank" rel="noreferrer">
                          <img
                            src={getImageUrl(c.photoUrl)}
                            alt="Photo"
                            onError={(e) => { e.target.style.display = "none"; }}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform"
                          />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                      {c.audioUrl && (
                        <audio
                          src={getImageUrl(c.audioUrl)}
                          controls
                          className="h-6 w-28 max-w-full"
                          title="Citizen Voice Note"
                        />
                      )}
                    </div>
                  </td>

                  {user.role === "admin" && (
                    <td className="px-3 py-3 font-semibold text-gray-700">
                      {c.department?.name || "—"}
                    </td>
                  )}

                  <td className="px-3 py-3 max-w-[200px] text-gray-800">
                    <p className="line-clamp-3">{c.description}</p>
                    {c.additionalReports?.length > 0 && (
                      <button
                        onClick={() => setViewClusterTarget(c)}
                        className="text-[11px] text-amber-800 font-bold underline mt-1 block"
                      >
                        + {c.additionalReports.length} more citizen reports
                      </button>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {c.location?.lat ? (
                      <a
                        href={`https://www.google.com/maps?q=${c.location.lat},${c.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-teal font-bold hover:underline"
                      >
                        📍 Map
                      </a>
                    ) : (
                      <span className="text-gray-600">{c.location?.address || "—"}</span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-semibold text-gray-800">{c.citizenName || "Anonymous"}</div>
                    <div className="text-gray-400 text-xs font-mono">{c.phone}</div>
                    {c.duplicateCount > 1 && (
                      <span className="text-[10px] text-amber-900 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                        +{c.duplicateCount - 1} neighbors
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <StatusBadge status={c.status} />
                  </td>

                  <td className="px-3 py-3">
                    {c.status === "Resolved" ? (
                      c.resolutionPhotoUrl ? (
                        <div className="text-center">
                          <a href={getImageUrl(c.resolutionPhotoUrl)} target="_blank" rel="noreferrer">
                            <img
                              src={getImageUrl(c.resolutionPhotoUrl)}
                              alt="Proof"
                              onError={(e) => { e.target.style.display = "none"; }}
                              className="w-11 h-11 object-cover rounded-lg mx-auto border-2 border-emerald-400"
                            />
                          </a>
                          <span className="text-[10px] text-gray-400 block mt-0.5">by {c.resolvedBy || "staff"}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No proof</span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>

                  {user.role !== "admin" && (
                    <td className="px-3 py-3">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c._id, e.target.value)}
                        className="border border-line rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-marigold"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved (needs photo)</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && complaints.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <div className="font-semibold">No complaints found.</div>
            </div>
          )}
        </div>
      </main>

      {/* Cluster / Duplicate Complaints Modal Viewer */}
      {viewClusterTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-amber-300 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewClusterTarget(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🔥</span>
              <div>
                <h3 className="text-xl font-display font-bold text-ink">
                  Piled Up Civic Issue (#{viewClusterTarget.complaintId})
                </h3>
                <p className="text-xs text-gray-500">
                  {viewClusterTarget.duplicateCount} citizens reported this same problem in this locality.
                </p>
              </div>
            </div>

            {/* Primary Report */}
            <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  👑 Primary Citizen Report
                </span>
                <span className="text-xs text-gray-400">{new Date(viewClusterTarget.createdAt).toLocaleString()}</span>
              </div>
              <div className="font-semibold text-sm text-ink mb-1">
                {viewClusterTarget.citizenName} ({viewClusterTarget.phone})
              </div>
              <p className="text-xs text-gray-700 mb-2">{viewClusterTarget.description}</p>
              <div className="flex gap-2 items-center">
                {viewClusterTarget.photoUrl && (
                  <a href={getImageUrl(viewClusterTarget.photoUrl)} target="_blank" rel="noreferrer">
                    <img
                      src={getImageUrl(viewClusterTarget.photoUrl)}
                      alt="Primary Photo"
                      className="w-14 h-14 object-cover rounded-lg border border-amber-300"
                    />
                  </a>
                )}
                {viewClusterTarget.audioUrl && (
                  <audio src={getImageUrl(viewClusterTarget.audioUrl)} controls className="h-7 w-40" />
                )}
              </div>
            </div>

            {/* Merged Duplicate Reports */}
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Additional Merged Neighbor Reports ({viewClusterTarget.additionalReports?.length || 0})
            </h4>

            <div className="space-y-3">
              {viewClusterTarget.additionalReports?.map((rep, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
                  <div className="flex justify-between items-center mb-1 font-semibold text-gray-800">
                    <span>Citizen #{idx + 2}: {rep.citizenName} ({rep.phone})</span>
                    <span className="text-gray-400 text-[10px]">{new Date(rep.reportedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-600 mb-2">{rep.description}</p>
                  <div className="flex gap-2 items-center">
                    {rep.photoUrl && (
                      <a href={getImageUrl(rep.photoUrl)} target="_blank" rel="noreferrer">
                        <img
                          src={getImageUrl(rep.photoUrl)}
                          alt="Report Photo"
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        />
                      </a>
                    )}
                    {rep.audioUrl && (
                      <audio src={getImageUrl(rep.audioUrl)} controls className="h-6 w-36" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewClusterTarget(null)}
                className="bg-ink text-white font-bold px-5 py-2 rounded-xl text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {resolveTarget && (
        <ResolveModal onCancel={() => setResolveTarget(null)} onConfirm={handleResolveConfirm} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-ink text-white px-5 py-3 rounded-2xl shadow-2xl text-sm z-50 animate-bounce font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}



