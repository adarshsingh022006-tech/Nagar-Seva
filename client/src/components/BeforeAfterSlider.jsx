// src/components/BeforeAfterSlider.jsx
import { useState } from "react";
import { getImageUrl } from "../services/api";

export default function BeforeAfterSlider({ beforeUrl, afterUrl, title = "Issue Resolution Proof" }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState("slider"); // "slider" | "before" | "after" | "side"

  if (!beforeUrl && !afterUrl) return null;
  if (!beforeUrl) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-gray-50">
        <img src={getImageUrl(afterUrl)} alt="Resolved Proof" className="w-full h-56 object-cover" />
        <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
          ✅ After Fix
        </span>
      </div>
    );
  }
  if (!afterUrl) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
        <img src={getImageUrl(beforeUrl)} alt="Before" className="w-full h-56 object-cover" />
        <span className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
          🔴 Problem Photo
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 text-white shadow-sm">
      {/* Control Switcher */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-950/80 border-b border-gray-800 text-xs">
        <span className="font-bold text-[11px] text-amber-400 flex items-center gap-1">
          <span>✨</span>
          <span>Before vs. After Comparison</span>
        </span>
        <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setViewMode("slider")}
            className={`px-2 py-0.5 rounded ${viewMode === "slider" ? "bg-amber-400 text-ink font-bold" : "text-gray-300 hover:text-white"}`}
          >
            🎛️ Slider
          </button>
          <button
            type="button"
            onClick={() => setViewMode("side")}
            className={`px-2 py-0.5 rounded ${viewMode === "side" ? "bg-amber-400 text-ink font-bold" : "text-gray-300 hover:text-white"}`}
          >
            ↔️ Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode("before")}
            className={`px-2 py-0.5 rounded ${viewMode === "before" ? "bg-red-500 text-white font-bold" : "text-gray-300 hover:text-white"}`}
          >
            Before
          </button>
          <button
            type="button"
            onClick={() => setViewMode("after")}
            className={`px-2 py-0.5 rounded ${viewMode === "after" ? "bg-emerald-500 text-white font-bold" : "text-gray-300 hover:text-white"}`}
          >
            After
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Split Slider */}
      {viewMode === "slider" && (
        <div className="relative w-full h-64 overflow-hidden select-none bg-black">
          {/* After image (Background) */}
          <img
            src={getImageUrl(afterUrl)}
            alt="After Fix"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span className="absolute top-2 right-2 bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow z-10">
            ✅ AFTER (FIXED)
          </span>

          {/* Before image (Clipped Foreground) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={getImageUrl(beforeUrl)}
              alt="Before"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{ width: "100%", minWidth: "100%", height: "100%" }}
            />
            <span className="absolute top-2 left-2 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow z-10">
              🔴 BEFORE (REPORTED)
            </span>
          </div>

          {/* Slider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20 shadow-[0_0_8px_rgba(0,0,0,0.8)]"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-ink text-xs font-bold flex items-center justify-center shadow-lg border border-gray-300">
              ↔
            </div>
          </div>

          {/* Range input overlay for smooth touch and mouse sliding */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 m-0 p-0"
            aria-label="Drag to compare before and after photos"
          />
        </div>
      )}

      {/* Mode 2: Side-by-Side */}
      {viewMode === "side" && (
        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-900">
          <div className="relative rounded-lg overflow-hidden h-52">
            <img src={getImageUrl(beforeUrl)} alt="Before" className="w-full h-full object-cover" />
            <span className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
              🔴 Before
            </span>
          </div>
          <div className="relative rounded-lg overflow-hidden h-52">
            <img src={getImageUrl(afterUrl)} alt="After Fix" className="w-full h-full object-cover" />
            <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
              ✅ After Fix
            </span>
          </div>
        </div>
      )}

      {/* Mode 3: Before Only */}
      {viewMode === "before" && (
        <div className="relative h-64">
          <img src={getImageUrl(beforeUrl)} alt="Before" className="w-full h-full object-cover" />
          <span className="absolute bottom-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow">
            🔴 Original Issue Photo
          </span>
        </div>
      )}

      {/* Mode 4: After Only */}
      {viewMode === "after" && (
        <div className="relative h-64">
          <img src={getImageUrl(afterUrl)} alt="After" className="w-full h-full object-cover" />
          <span className="absolute bottom-3 right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow">
            ✅ Municipal Resolution Proof
          </span>
        </div>
      )}
    </div>
  );
}
