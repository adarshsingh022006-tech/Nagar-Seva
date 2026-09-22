// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Track from "./pages/Track";
import Login from "./pages/Login";
import DepartmentDashboard from "./pages/DepartmentDashboard";
import NagarFeed from "./pages/NagarFeed";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/feed" element={<NagarFeed />} />
      <Route path="/track" element={<Track />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<DepartmentDashboard />} />
    </Routes>
  );
}
