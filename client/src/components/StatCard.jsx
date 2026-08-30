// src/components/StatCard.jsx
export default function StatCard({ label, value, accent }) {
  const borderColor = {
    default: "border-line",
    pending: "border-marigold",
    progress: "border-teal",
    resolved: "border-green-500",
  }[accent || "default"];

  return (
    <div className={`bg-white rounded-xl shadow-sm px-6 py-4 flex-1 min-w-[140px] border-t-4 ${borderColor}`}>
      <div className="font-display text-3xl font-bold text-ink">{value}</div>
      <div className="text-xs uppercase tracking-wide text-gray-500 mt-1">{label}</div>
    </div>
  );
}
