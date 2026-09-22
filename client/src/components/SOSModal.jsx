// src/components/SOSModal.jsx
import { useState, useEffect } from "react";
import { submitComplaint } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const SOS_TYPES = [
  { value: "⚡ Live Electric Wire / Sparking", labelKey: "sosLiveWire", icon: "⚡" },
  { value: "🔥 Fire / Gas Leak Hazard", labelKey: "sosFireGas", icon: "🔥" },
  { value: "🕳️ Open Manhole / Sewage Overflow", labelKey: "sosManhole", icon: "🕳️" },
  { value: "🚧 Road / Wall Collapse Hazard", labelKey: "sosCollapse", icon: "🚧" },
  { value: "⚠️ Public Safety Emergency", labelKey: "sosMedicalHazard", icon: "⚠️" },
];

export default function SOSModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState(SOS_TYPES[0].value);
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess(null);
      // Auto-fetch high accuracy GPS coordinates for emergency
      if (navigator.geolocation) {
        setLocating(true);
        setLocationStatus("Fetching exact emergency GPS...");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocationStatus(`📍 GPS Locked (±${Math.round(pos.coords.accuracy)}m)`);
            setLocating(false);
          },
          (err) => {
            setLocationStatus("⚠️ GPS unavailable — please enter location/phone");
            setLocating(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSendSOS(e) {
    e.preventDefault();
    setError("");

    if (!phone.trim()) {
      setError("Please provide a contact phone number so emergency teams can reach you.");
      return;
    }

    const fd = new FormData();
    fd.append("citizenName", "EMERGENCY CITIZEN");
    fd.append("phone", phone.trim());
    fd.append("category", "Emergency SOS");
    fd.append("description", `[EMERGENCY SOS: ${selectedType}] ${details.trim() || "Immediate civic emergency assistance required."}`);
    fd.append("isSOS", "true");
    fd.append("priority", "EMERGENCY");
    if (coords) {
      fd.append("lat", coords.lat);
      fd.append("lng", coords.lng);
      fd.append("address", `GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    }

    setSubmitting(true);
    try {
      const res = await submitComplaint(fd);
      setSuccess(res);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to trigger SOS. Please dial emergency helplines directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-red-600 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-lg"
        >
          ✕
        </button>

        {!success ? (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl animate-pulse">🚨</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-red-600">
                  {t("sosTitle", "Emergency Civic SOS")}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {t("sosSubtitle", "Immediate high-priority report for hazardous or life-threatening civic emergencies.")}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-300 rounded-xl px-4 py-2.5 text-sm my-3 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSendSOS} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  {t("sosEmergencyType", "Select Emergency Type")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SOS_TYPES.map((type) => (
                    <button
                      type="button"
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`p-2.5 rounded-xl border-2 text-left text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                        selectedType === type.value
                          ? "border-red-600 bg-red-50 text-red-700 shadow-sm"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="line-clamp-1">{t(type.labelKey, type.value)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-red-50/70 border border-red-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-800">
                  {locating ? "📍 Getting GPS..." : locationStatus || "📍 GPS ready"}
                </span>
                {coords && <span className="text-emerald-700 font-bold">✓ Location Active</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  {t("phoneLabel", "Emergency Phone / WhatsApp Number")} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border-2 border-red-300 focus:border-red-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Brief description of danger (optional)
                </label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t("sosDescPlaceholder", "e.g. Sparking wire fallen on water-logged road")}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-red-600"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-red-600/30 text-base tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? (
                  <span>{t("sosSendingBtn", "Triggering Emergency SOS...")}</span>
                ) : (
                  <>
                    <span className="text-xl">🚨</span>
                    <span>{t("sosSubmitBtn", "TRIGGER EMERGENCY SOS NOW")}</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-200">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                {t("sosHelplines", "Direct Emergency Helplines (Tap to Call)")}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <a href="tel:112" className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg font-bold text-red-600 block">
                  🚨 112 (National)
                </a>
                <a href="tel:101" className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg font-bold text-orange-600 block">
                  🔥 101 (Fire)
                </a>
                <a href="tel:108" className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg font-bold text-blue-600 block">
                  🚑 108 (Ambulance)
                </a>
                <a href="tel:1912" className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg font-bold text-amber-700 block">
                  ⚡ 1912 (Power)
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 border-4 border-red-500 animate-bounce">
              🚨
            </div>
            <h3 className="text-2xl font-display font-bold text-red-600 mb-1">
              Emergency SOS Dispatched!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Municipal Disaster Response & Quick Action Team have been notified with your GPS coordinates.
            </p>
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 mb-6">
              <div className="text-xs text-red-600 font-bold uppercase tracking-widest">Emergency Tracking ID</div>
              <div className="font-mono text-xl font-bold text-red-700 mt-1">{success.complaintId}</div>
            </div>
            <div className="flex gap-3">
              <a
                href={`/track?id=${encodeURIComponent(success.complaintId)}`}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm"
              >
                Track Emergency Status →
              </a>
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
