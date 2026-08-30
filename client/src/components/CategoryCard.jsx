// src/components/CategoryCard.jsx
export default function CategoryCard({ icon, label, value, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(value)}
      className={`border-2 rounded-xl p-4 text-center cursor-pointer text-sm font-medium transition-colors
        ${selected ? "border-marigold-deep bg-amber-50 shadow-[0_0_0_3px_rgba(242,169,59,0.25)]" : "border-line bg-white hover:border-marigold"}`}
    >
      <span className="text-2xl block mb-1">{icon}</span>
      {label}
    </div>
  );
}
