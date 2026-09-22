// src/pages/Home.jsx
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import CategoryCard from "../components/CategoryCard";
import { submitComplaint } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const CATEGORIES = [
  { value: "Water Supply", icon: "💧", labelKey: "catWater", defaultLabel: "Water Supply" },
  { value: "Electricity", icon: "💡", labelKey: "catElectricity", defaultLabel: "Electricity" },
  { value: "Roads", icon: "🛣️", labelKey: "catRoads", defaultLabel: "Roads" },
  { value: "Sanitation", icon: "🗑️", labelKey: "catSanitation", defaultLabel: "Sanitation" },
  { value: "Street Lights", icon: "🔦", labelKey: "catStreetLights", defaultLabel: "Street Lights" },
  { value: "Other", icon: "📋", labelKey: "catOther", defaultLabel: "Other" },
];

export default function Home() {
  const { t, speechLocale } = useLanguage();

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Audio Voice Note Recording State
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Speech-to-Text Dictation State
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef(null);

  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationMsg, setLocationMsg] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLocale || "en-IN";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setDescription((prev) => {
          // If previous exists and we start fresh, append or replace
          return transcript;
        });
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
    }
  }, [speechLocale]);

  function toggleVoiceDictation() {
    if (!recognitionRef.current) {
      alert("Voice speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isDictating) {
      recognitionRef.current.stop();
      setIsDictating(false);
    } else {
      try {
        recognitionRef.current.lang = speechLocale || "en-IN";
        recognitionRef.current.start();
        setIsDictating(true);
      } catch (err) {
        console.error(err);
      }
    }
  }

  // Handle Audio Note Recording via MediaRecorder
  async function startAudioRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 120) {
            // max 2 minutes
            stopAudioRecording();
            return 120;
          }
          return t + 1;
        });
      }, 1000);
    } catch (err) {
      setError("Microphone permission denied or audio recording not supported.");
    }
  }

  function stopAudioRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  function deleteAudioRecording() {
    setAudioBlob(null);
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioPreview(null);
    setRecordingTime(0);
  }

  function handlePhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setError("Photo file is too large. Maximum size is 8MB.");
      return;
    }
    setError("");
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationMsg("Geolocation isn't supported on this browser — please type your address.");
      return;
    }
    setLocating(true);
    setLocationMsg("Waiting for permission / GPS fix...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationMsg(`✅ Location captured (±${Math.round(pos.coords.accuracy)}m accuracy)`);
        setLocating(false);
      },
      (err) => {
        setLocationMsg(`Couldn't get your location (${err.message}). Please type your address below.`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!category) return setError("Please pick a category.");
    if (!description.trim() && !audioBlob) {
      return setError("Please describe the issue or record a voice note.");
    }
    if (!phone.trim()) return setError("Please enter your WhatsApp/phone number.");
    if (!coords && !address.trim()) return setError("Please share your location or type an address.");

    const fd = new FormData();
    fd.append("citizenName", name);
    fd.append("phone", phone);
    fd.append("category", category);
    fd.append("description", description.trim() || "(Voice note complaint attached)");
    fd.append("address", address);
    if (coords) {
      fd.append("lat", coords.lat);
      fd.append("lng", coords.lng);
    }
    if (photo) fd.append("photo", photo);
    if (audioBlob) fd.append("audio", audioBlob, "voicenote.webm");

    setSubmitting(true);
    try {
      const data = await submitComplaint(fd);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setResult(null);
    setCategory("");
    setDescription("");
    setName("");
    setPhone("");
    setPhoto(null);
    setPhotoPreview(null);
    deleteAudioRecording();
    setAddress("");
    setCoords(null);
    setError("");
    setCopied(false);
  }

  function handleCopy() {
    if (!result?.complaintId) return;
    navigator.clipboard.writeText(result.complaintId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <Navbar />

      <section className="bg-ink text-white text-center px-4 sm:px-6 pt-12 pb-14">
        <div className="inline-block bg-white/10 text-marigold text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
          {t("portalBadge", "Municipal Complaint Portal")}
        </div>
        <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-semibold max-w-3xl mx-auto mb-3 leading-tight">
          {t("heroTitle", "Spotted a civic issue? Report it in under a minute.")}
        </h1>
        <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto">
          {t("heroSubtitle", "Add a photo or voice note and your location, and we'll route it straight to the right department.")}
        </p>
      </section>

      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-16">
        {!result ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
            {error && (
              <div className="bg-red-50 text-clay border border-red-200 rounded-xl px-4 py-3 text-sm mb-4 font-medium">
                {error}
              </div>
            )}

            {/* Category Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-ink-soft mb-2">
                {t("categoryLabel", "Category")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {CATEGORIES.map((c) => (
                  <CategoryCard
                    key={c.value}
                    icon={c.icon}
                    label={t(c.labelKey, c.defaultLabel)}
                    value={c.value}
                    selected={category === c.value}
                    onSelect={setCategory}
                  />
                ))}
              </div>
            </div>

            {/* Description & Speech-to-Text */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-ink-soft">
                  {t("issueLabel", "What's the issue?")}{" "}
                  <span className="text-gray-400 font-normal text-xs">{t("issueHelper", "— be specific")}</span>
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceDictation}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                    isDictating
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-amber-100 hover:bg-amber-200 text-amber-900"
                  }`}
                  title="Speech to text dictation"
                >
                  <span>🎙️</span>
                  <span>{isDictating ? t("stopVoiceTyping", "Listening...") : t("startVoiceTyping", "Voice Typing")}</span>
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("issuePlaceholder", "Describe what you saw or use voice typing...")}
                rows={3}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-marigold ${
                  isDictating ? "border-red-400 bg-red-50/20" : "border-line"
                }`}
              />
            </div>

            {/* Audio Voice Note Recording Option */}
            <div className="mb-6 bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-ink-soft uppercase tracking-wider">
                  {t("voiceNoteLabel", "Voice Note")} <span className="text-gray-400 lowercase font-normal">{t("voiceNoteHelper", "(optional)")}</span>
                </div>
                {isRecording && (
                  <span className="text-xs font-bold text-red-600 animate-pulse">
                    🔴 {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                  </span>
                )}
              </div>

              {!audioPreview ? (
                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startAudioRecording}
                      className="inline-flex items-center gap-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
                    >
                      <span>🎙️</span>
                      <span>{t("recordVoice", "Record voice note")}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopAudioRecording}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md animate-pulse"
                    >
                      <span>⏹️</span>
                      <span>{t("stopRecording", "Stop Recording")}</span>
                    </button>
                  )}
                  <span className="text-xs text-gray-500">
                    {isRecording ? t("recording", "Recording audio note...") : "Record your complaint in your own voice"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-amber-200">
                  <audio src={audioPreview} controls className="h-8 flex-1 max-w-full" />
                  <button
                    type="button"
                    onClick={deleteAudioRecording}
                    className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 rounded-lg shrink-0"
                  >
                    {t("deleteVoice", "Delete")}
                  </button>
                </div>
              )}
            </div>

            {/* Photo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-ink-soft mb-2">
                {t("photoLabel", "Photo")}{" "}
                <span className="text-gray-400 font-normal text-xs">{t("photoHelper", "(optional)")}</span>
              </label>
              <label className="block border-2 border-dashed border-line rounded-2xl p-5 text-center cursor-pointer text-sm text-gray-500 hover:border-marigold hover:bg-amber-50/20 transition-all">
                <input type="file" accept="image/*" capture="environment" hidden onChange={handlePhoto} />
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" className="max-h-52 mx-auto rounded-xl shadow-sm" />
                ) : (
                  <>
                    <span className="text-base font-semibold text-gray-700">{t("photoTap", "📷 Tap to take or choose a photo")}</span>
                    <br />
                    <span className="text-xs text-gray-400">{t("photoSizeNote", "JPG, PNG up to 8MB")}</span>
                  </>
                )}
              </label>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-ink-soft mb-2">
                {t("locationLabel", "Location")}
              </label>
              <div className="border border-line rounded-2xl p-4 bg-gray-50/70">
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-2 bg-teal text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-sm"
                >
                  📍 {locating ? t("locatingBtn", "Locating...") : t("useLocationBtn", "Use my current location")}
                </button>
                {locationMsg && (
                  <div className={`text-xs sm:text-sm mt-2 font-medium ${coords ? "text-teal font-semibold" : "text-gray-500"}`}>
                    {locationMsg}
                  </div>
                )}
                <div className="text-center text-xs text-gray-400 my-2.5 font-medium">
                  {t("orTypeAddress", "— or type your address —")}
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("addressPlaceholder", "e.g. Near City Park, MG Road")}
                  className="w-full border border-line rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:border-marigold bg-white"
                />
              </div>
            </div>

            {/* Citizen Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">
                  {t("nameLabel", "Your name")}{" "}
                  <span className="text-gray-400 font-normal text-xs">{t("nameOptional", "(optional)")}</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder", "So we know who to thank")}
                  className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-marigold"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1.5">
                  {t("phoneLabel", "Phone / WhatsApp number")} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phonePlaceholder", "+91 98765 43210")}
                  className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-marigold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-marigold-deep text-ink font-bold py-3.5 rounded-xl hover:bg-marigold disabled:opacity-60 transition-all text-base shadow-md shadow-amber-500/20 active:scale-[0.99]"
            >
              {submitting ? t("submittingBtn", "Submitting...") : t("submitBtn", "Submit complaint")}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100 animate-fadeIn">
            <div className="w-28 h-28 mx-auto mb-5 rounded-full border-4 border-teal bg-teal-50 flex flex-col items-center justify-center -rotate-6 relative shadow-inner">
              <div className="text-4xl">✅</div>
              <div className="text-[10px] tracking-widest uppercase text-teal font-bold mt-1">Filed</div>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-1">
              {t("complaintReceived", "Complaint received!")}
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              {t("forwardedTo", "We've forwarded this to")} <strong className="text-ink font-semibold">{result.department}</strong>.
            </p>
            <div className="inline-flex items-center gap-3 bg-teal-50 border-2 border-teal-300 rounded-2xl px-5 py-3 mb-6 shadow-sm">
              <span className="font-mono font-bold text-lg sm:text-xl text-teal-900">{result.complaintId}</span>
              <button
                onClick={handleCopy}
                className="bg-teal text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-teal-700 transition-colors"
              >
                {copied ? t("copiedBtn", "Copied!") : t("copyBtn", "Copy")}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={`/track?id=${encodeURIComponent(result.complaintId)}`}
                className="inline-block bg-ink text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-ink-soft transition-colors shadow-md"
              >
                {t("trackThisBtn", "Track this complaint →")}
              </Link>
              <button
                onClick={resetForm}
                className="inline-block border-2 border-line hover:border-ink px-6 py-3 rounded-xl font-bold text-sm transition-colors"
              >
                {t("fileAnotherBtn", "File another complaint")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


