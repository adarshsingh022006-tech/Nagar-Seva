// src/services/api.js
// Central axios instance with dynamic environment configuration.
// Automatically attaches the staff/admin login token to every request.

import axios from "axios";

// Normalize API base URL from Vite environment variable or default to proxy path
const rawBaseUrl = import.meta.env.VITE_API_URL || "";
export const getBaseURL = () => {
  if (!rawBaseUrl) return "/api";
  const trimmed = rawBaseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

// Helper to resolve uploaded image URLs across local & deployed environments
export function getImageUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  if (!rawBaseUrl) {
    return cleanPath;
  }
  const host = rawBaseUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  return `${host}${cleanPath}`;
}

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("nagarseva_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    console.error("Error reading token:", e);
  }
  return config;
});

// If the token is invalid/expired, boot the user back to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      try {
        localStorage.removeItem("nagarseva_token");
        localStorage.removeItem("nagarseva_user");
      } catch (e) {
        // ignore
      }
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

