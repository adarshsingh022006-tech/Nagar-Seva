// src/components/Timeline.jsx
// Visual 4-step tracker: Filed -> Assigned -> In Progress -> Resolved.
// A complaint is auto-assigned to its department the moment it's filed,
// so "Pending" status maps to step index 1 (Filed done, Assigned current).

const STEPS = ["Filed", "Assigned", "In Progress", "Resolved"];

function stepIndex(status) {
  if (status === "Pending") return 1;
  if (status === "In Progress") return 2;
  if (status === "Resolved") return 3;
  return 0;
}

export default function Timeline({ status }) {
  const idx = stepIndex(status);

  return (
    <div className="flex justify-between relative my-8">
      <div className="absolute top-[17px] left-[8%] right-[8%] h-0.5 bg-line" />
      {STEPS.map((label, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <div key={label} className="relative z-10 flex-1 text-center">
            <div
              className={`w-9 h-9 mx-auto mb-2 rounded-full border-2 flex items-center justify-center text-sm font-semibold
                ${done ? "bg-teal border-teal text-white" : ""}
                ${current ? "bg-marigold border-marigold-deep text-ink" : ""}
                ${!done && !current ? "bg-white border-line text-gray-400" : ""}`}
            >
              {done ? "✓" : i + 1}
            </div>
            <div className={`text-xs font-medium ${done || current ? "text-ink font-semibold" : "text-gray-400"}`}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
