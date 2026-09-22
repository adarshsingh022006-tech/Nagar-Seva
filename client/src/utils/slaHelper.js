// src/utils/slaHelper.js
export function getSlaInfo(slaDeadline, status) {
  if (status === "Resolved") {
    return { text: "SLA Completed", isOverdue: false, badgeClass: "bg-emerald-100 text-emerald-800" };
  }
  if (!slaDeadline) {
    return { text: "48h Standard SLA", isOverdue: false, badgeClass: "bg-gray-100 text-gray-700" };
  }

  const deadline = new Date(slaDeadline).getTime();
  const now = Date.now();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
    return {
      text: `⚠️ Overdue by ${overdueHours}h (Escalated)`,
      isOverdue: true,
      badgeClass: "bg-red-600 text-white animate-pulse font-bold",
    };
  }

  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hoursLeft < 6) {
    return {
      text: `⏳ ${hoursLeft}h ${minsLeft}m left`,
      isOverdue: false,
      badgeClass: "bg-orange-100 text-orange-800 font-bold border border-orange-300",
    };
  }

  return {
    text: `⏱️ ${hoursLeft}h left`,
    isOverdue: false,
    badgeClass: "bg-blue-50 text-blue-800 border border-blue-200",
  };
}
