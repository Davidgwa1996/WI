import React from "react";
import { FiDownload, FiFileText } from "react-icons/fi";

const ReportCard = ({ report }) => {
  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-cyan-700">
            <FiFileText className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Saved report
            </span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900">
            {report.title}
          </h3>
          <p className="mt-2 text-sm text-slate-600">{report.summary}</p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {report.type}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Projects</div>
          <div className="mt-2 text-xl font-bold text-slate-900">{report.projects}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Created</div>
          <div className="mt-2 text-xl font-bold text-slate-900">{report.createdAt}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Audience</div>
          <div className="mt-2 text-xl font-bold text-slate-900">{report.audience}</div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          <FiDownload className="h-4 w-4" />
          Export
        </button>
      </div>
    </div>
  );
};

export default ReportCard;