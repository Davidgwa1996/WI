import React from "react";

const convictionStyles = {
  High: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-slate-200 bg-slate-100 text-slate-700",
};

const ConvictionBadge = ({ conviction = "Low" }) => {
  const safeConviction =
    conviction === "High" || conviction === "Medium" || conviction === "Low"
      ? conviction
      : "Low";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${convictionStyles[safeConviction]}`}
    >
      {safeConviction} Conviction
    </span>
  );
};

export default ConvictionBadge;