// src/pages/DepartmentDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ResolveModal from "../components/ResolveModal";
import { fetchComplaints, fetchStats, updateComplaintStatus, resolveComplaint } from "../services/api";

export default function DepartmentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [resolveTarget, setResolveTarget] = useState(null); // complaint id being resolved

  useEffect(() => {
    const token = localStorage.getItem("nagarseva_token");
    const userJson = localStorage.getItem("nagarseva_user");
    if (!token || !userJson) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userJson));
  }, [navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, complaintsData] = await Promise.all([
        fetchStats(),
        fetchComplaints(statusFilter ? { status: statusFilter } : {}),
      ]);
      setStats(statsData);
      setComplaints(complaintsData);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
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
    showToast("Complaint resolved with proof photo ✅");
    setResolveTarget(null);
    loadData();
  }

  if (!user) return null;

  return (
    <div>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="font-display text-xl font-semibold mb-4">
          {user.role === "admin" ? "🏛️ Admin Dashboard — All Departments" : `📋 ${user.department?.name} Dashboard`}
        </h1>

        {stats && (
          <div className="flex flex-wrap gap-4 mb-6">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} accent="pending" />
            <StatCard label="In Progress" value={stats.inProgress} accent="progress" />
            <StatCard label="Resolved" value={stats.resolved} accent="resolved" />
          </div>
        )}

        {user.role === "admin" && stats?.byDepartment?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
            <h3 className="font-semibold text-sm mb-3">By department</h3>
            {stats.byDepartment.map((d) => {
              const max = Math.max(...stats.byDepartment.map((x) => x.count));
              return (
                <div key={d.department} className="flex items-center gap-3 mb-2 text-sm">
                  <div className="w-48 shrink-0 text-gray-600">{d.department}</div>
                  <div className="flex-1 bg-gray-100 rounded h-3.5 overflow-hidden">
                    <div className="bg-teal h-full rounded" style={{ width: `${(d.count / max) * 100}%` }} />
                  </div>
                  <div className="w-8 text-right font-bold">{d.count}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm">
            Status:{" "}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-line rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </label>
          <button onClick={loadData} className="bg-ink text-white px-4 py-1.5 rounded-lg text-sm font-semibold">
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Photo</th>
                {user.role === "admin" && <th className="px-3 py-3">Department</th>}
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Reported by</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Proof of fix</th>
                <th className="px-3 py-3">Filed on</th>
                {user.role !== "admin" && <th className="px-3 py-3">Update</th>}
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3 font-mono">{c.complaintId}</td>
                  <td className="px-3 py-3">
                    {c.photoUrl ? (
                      <a href={c.photoUrl} target="_blank" rel="noreferrer">
                        <img src={c.photoUrl} className="w-11 h-11 object-cover rounded-md" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  {user.role === "admin" && <td className="px-3 py-3">{c.department?.name}</td>}
                  <td className="px-3 py-3 max-w-[220px]">{c.description}</td>
                  <td className="px-3 py-3">
                    {c.location?.lat ? (
                      <a
                        href={`https://www.google.com/maps?q=${c.location.lat},${c.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal font-semibold"
                      >
                        📍 Map
                      </a>
                    ) : (
                      c.location?.address || "—"
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {c.citizenName || "Anonymous"}
                    <br />
                    <span className="text-gray-400 text-xs">{c.phone}</span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-3">
                    {c.status === "Resolved" ? (
                      c.resolutionPhotoUrl ? (
                        <div className="text-center">
                          <a href={c.resolutionPhotoUrl} target="_blank" rel="noreferrer">
                            <img src={c.resolutionPhotoUrl} className="w-11 h-11 object-cover rounded-md mx-auto" />
                          </a>
                          <span className="text-[10px] text-gray-400">by {c.resolvedBy}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No proof on file</span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{new Date(c.createdAt).toLocaleString()}</td>
                  {user.role !== "admin" && (
                    <td className="px-3 py-3">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c._id, e.target.value)}
                        className="border border-line rounded-lg px-2 py-1 text-xs"
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
            <div className="text-center py-14 text-gray-400">
              <div className="text-3xl mb-2">📭</div>
              No complaints match this filter yet.
            </div>
          )}
        </div>
      </main>

      {resolveTarget && (
        <ResolveModal onCancel={() => setResolveTarget(null)} onConfirm={handleResolveConfirm} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-ink text-white px-4 py-3 rounded-xl shadow-xl text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
