import React from "react";

const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "from-cyan-500 to-teal-500",
}) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50 opacity-90" />
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-cyan-100/40 blur-3xl transition-all duration-300 group-hover:bg-cyan-200/50" />

      <div className="relative z-10">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg`}
          >
            {Icon ? <Icon className="h-7 w-7 text-white" /> : null}
          </div>

          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            KPI
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-500">{title}</p>
          <p className="mb-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            {value}
          </p>
          {subtitle ? (
            <p className="text-sm leading-6 text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default KpiCard;