// src/components/StatusBadge.jsx
const STYLES = {
  Pending: "bg-amber-100 text-amber-800",
  "In Progress": "bg-teal-100 text-teal-800",
  Resolved: "bg-green-100 text-green-800",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${STYLES[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
