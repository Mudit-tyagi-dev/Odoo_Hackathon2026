import React from "react";

const badgeVariants = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  "Under Negotiation": "bg-amber-50 text-amber-800 border-amber-200/60",
  Sent: "bg-blue-50 text-blue-700 border-blue-200/60",
  Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  "Awaiting Approval": "bg-orange-50 text-orange-800 border-orange-200/60",
  "Pending Approval": "bg-amber-50 text-amber-800 border-amber-200/60",
  Cancelled: "bg-red-50 text-red-700 border-red-200/60",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  Unpaid: "bg-rose-50 text-rose-700 border-rose-200/60",
};

const dotColors = {
  "Under Negotiation": "bg-amber-500",
  Sent: "bg-blue-500",
  Confirmed: "bg-emerald-500",
  "Awaiting Approval": "bg-orange-500",
  "Pending Approval": "bg-amber-500",
  Cancelled: "bg-red-500",
  Paid: "bg-emerald-500",
  Unpaid: "bg-rose-500",
  default: "bg-slate-400",
};

export const Badge = ({
  children,
  variant,
  showDot = true,
  className = "",
  size = "md",
}) => {
  const statusKey = variant || children;
  const badgeStyle = badgeVariants[statusKey] || badgeVariants.default;
  const dotColor = dotColors[statusKey] || dotColors.default;

  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${badgeStyle} ${sizeClass} ${className}`}
    >
      {showDot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
