import React from "react";

const IntelStatCard = ({ label, value, subtitle }) => {
  return (
    <div className="glass-card p-6">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">
        {value}
      </div>
      {subtitle ? (
        <div className="mt-2 text-sm text-slate-500">{subtitle}</div>
      ) : null}
    </div>
  );
};

export default IntelStatCard;