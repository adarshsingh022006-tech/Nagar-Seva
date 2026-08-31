// src/pages/Home.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import CategoryCard from "../components/CategoryCard";
import { submitComplaint } from "../services/api";

const CATEGORIES = [
  { value: "Water Supply", icon: "💧", label: "Water Supply" },
  { value: "Electricity", icon: "💡", label: "Electricity" },
  { value: "Roads", icon: "🛣️", label: "Roads" },
  { value: "Sanitation", icon: "🗑️", label: "Sanitation" },
  { value: "Street Lights", icon: "🔦", label: "Street Lights" },
  { value: "Other", icon: "📋", label: "Other" },
];

export default function Home() {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationMsg, setLocationMsg] = useState("We'll ask your browser for permission.");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { complaintId, department }
  const [copied, setCopied] = useState(false);

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
    if (!description.trim()) return setError("Please describe the issue.");
    if (!phone.trim()) return setError("Please enter your WhatsApp/phone number.");
    if (!coords && !address.trim()) return setError("Please share your location or type an address.");

    const fd = new FormData();
    fd.append("citizenName", name);
    fd.append("phone", phone);
    fd.append("category", category);
    fd.append("description", description);
    fd.append("address", address);
    if (coords) {
      fd.append("lat", coords.lat);
      fd.append("lng", coords.lng);
    }
    if (photo) fd.append("photo", photo);

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

      <section className="bg-ink text-white text-center px-6 pt-16 pb-14">
        <div className="text-marigold text-xs font-bold tracking-widest uppercase mb-3">
          Municipal Complaint Portal
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-semibold max-w-3xl mx-auto mb-3">
          Spotted a civic issue? Report it in under a minute.
        </h1>
        <p className="text-gray-300 max-w-lg mx-auto">
          Add a photo and your location, and we'll route it straight to the right department.
        </p>
      </section>

      <div className="max-w-2xl mx-auto px-4 -mt-10 pb-16">
        {!result ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            {error && (
              <div className="bg-red-50 text-clay border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-semibold text-ink-soft mb-2">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((c) => (
                  <CategoryCard
                    key={c.value}
                    icon={c.icon}
                    label={c.label}
                    value={c.value}
                    selected={category === c.value}
                    onSelect={setCategory}
                  />
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-ink-soft mb-2">
                What's the issue? <span className="text-gray-400 font-normal">— be specific</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you saw..."
                rows={3}
                className="w-full border border-line rounded-lg px-3 py-2.5 focus:outline-none focus:border-marigold"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-ink-soft mb-2">
                Photo <span className="text-gray-400 font-normal">(optional but helps a lot)</span>
              </label>
              <label className="block border-2 border-dashed border-line rounded-xl p-6 text-center cursor-pointer text-sm text-gray-500 hover:border-marigold">
                <input type="file" accept="image/*" capture="environment" hidden onChange={handlePhoto} />
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" className="max-h-52 mx-auto rounded-lg" />
                ) : (
                  <>📷 Tap to take or choose a photo<br /><span className="text-xs">JPG, PNG up to 8MB</span></>
                )}
              </label>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-ink-soft mb-2">Location</label>
              <div className="border border-line rounded-lg p-4 bg-gray-50">
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-2 bg-teal text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-60"
                >
                  📍 {locating ? "Locating..." : "Use my current location"}
                </button>
                <div className={`text-sm mt-2 ${coords ? "text-teal font-semibold" : "text-gray-500"}`}>
                  {locationMsg}
                </div>
                <div className="text-center text-xs text-gray-400 my-2">— or type your address —</div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near City Park, MG Road"
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-marigold"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-ink-soft mb-2">
                Your name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="So we know who to thank"
                className="w-full border border-line rounded-lg px-3 py-2.5 focus:outline-none focus:border-marigold"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-ink-soft mb-2">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-line rounded-lg px-3 py-2.5 focus:outline-none focus:border-marigold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-marigold-deep text-ink font-bold py-3 rounded-lg hover:bg-marigold disabled:opacity-60 transition-colors"
            >
              {submitting ? "Submitting..." : "Submit complaint"}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-36 h-36 mx-auto mb-6 rounded-full border-4 border-teal flex flex-col items-center justify-center -rotate-6 relative">
              <div className="text-3xl">✅</div>
              <div className="text-[10px] tracking-widest uppercase text-teal font-bold mt-1">Filed</div>
            </div>
            <h2 className="font-display text-2xl font-semibold mb-1">Complaint received!</h2>
            <p className="text-gray-500 mb-5">
              We've forwarded this to <strong>{result.department}</strong>.
            </p>
            <div className="inline-flex items-center gap-3 bg-teal-50 border border-teal rounded-xl px-5 py-3 mb-6">
              <span className="font-mono font-semibold text-lg">{result.complaintId}</span>
              <button
                onClick={handleCopy}
                className="bg-teal text-white text-xs px-2.5 py-1 rounded-md font-semibold hover:bg-teal-700"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={`/track?id=${encodeURIComponent(result.complaintId)}`} className="inline-block bg-ink text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-ink-soft">
                Track this complaint →
              </Link>
              <button
                onClick={resetForm}
                className="inline-block border border-line px-5 py-2.5 rounded-lg font-semibold text-sm hover:border-ink"
              >
                File another complaint
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

