import React from "react";

const badgeVariants = {
  default: "bg-muted text-muted-foreground border-border",
  "Under Negotiation": "bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
  Sent: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
  Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  "Awaiting Approval": "bg-orange-50 text-orange-800 border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60",
  "Pending Approval": "bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
  pending_approval: "bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  rejected: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
  negotiating: "bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
  Negotiating: "bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
  Cancelled: "bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  Unpaid: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  Draft: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  draft: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  secondary: "bg-secondary text-secondary-foreground border-border",
  outline: "border-border text-foreground bg-transparent",
};

const dotColors = {
  "Under Negotiation": "bg-amber-500",
  negotiating: "bg-indigo-500",
  Negotiating: "bg-indigo-500",
  Sent: "bg-blue-500",
  Confirmed: "bg-emerald-500",
  confirmed: "bg-emerald-500",
  approved: "bg-emerald-500",
  Approved: "bg-emerald-500",
  rejected: "bg-rose-500",
  Rejected: "bg-rose-500",
  "Awaiting Approval": "bg-orange-500",
  "Pending Approval": "bg-amber-500",
  pending_approval: "bg-amber-500",
  Cancelled: "bg-red-500",
  Paid: "bg-emerald-500",
  Unpaid: "bg-rose-500",
  Active: "bg-emerald-500",
  Draft: "bg-slate-400",
  draft: "bg-slate-400",
  default: "bg-muted-foreground",
};

export const Badge = ({
  children,
  variant,
  showDot = false,
  className = "",
  size = "md",
}) => {
  const statusKey = variant || children;
  const badgeStyle = badgeVariants[statusKey] || badgeVariants.default;
  const dotColor = dotColors[statusKey] || dotColors.default;

  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : "px-2.5 py-0.5 text-xs font-medium";

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
