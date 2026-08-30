// src/services/api.js
// Central axios instance. Automatically attaches the staff/admin login
// token (if present) to every request's Authorization header.

import axios from "axios";

const api = axios.create({ baseURL: "https://nagar-seva-099u.onrender.com/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nagarseva_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is invalid/expired, boot the user back to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("nagarseva_token");
      localStorage.removeItem("nagarseva_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ---- Auth ----
export const loginRequest = (username, password) =>
  api.post("/auth/login", { username, password }).then((r) => r.data);

// ---- Citizen-facing ----
export const submitComplaint = (formData) =>
  api.post("/complaints", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);

export const trackComplaint = (complaintId) =>
  api.get(`/complaints/track/${encodeURIComponent(complaintId)}`).then((r) => r.data);

// ---- Staff/admin ----
export const fetchComplaints = (params = {}) =>
  api.get("/complaints", { params }).then((r) => r.data);

export const fetchStats = () => api.get("/complaints/stats").then((r) => r.data);

export const updateComplaintStatus = (id, status) =>
  api.patch(`/complaints/${id}/status`, { status }).then((r) => r.data);

export const resolveComplaint = (id, formData) =>
  api.patch(`/complaints/${id}/resolve`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
