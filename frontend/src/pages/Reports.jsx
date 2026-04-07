import React, { useEffect, useState } from "react";
import { FiDownload, FiFilePlus } from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import { useDashboardStream } from "../hooks/useWebSocket";
import api from "../services/api";

const Reports = () => {
  const { isConnected } = useDashboardStream();
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    type: "Custom",
    audience: "Internal",
  });

  const loadReports = async () => {
    const data = await api.reports.list();
    setReports(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const createReport = async () => {
    if (!form.title.trim()) return;
    await api.reports.create({
      ...form,
      project_ids: [],
    });
    setForm({
      title: "",
      summary: "",
      type: "Custom",
      audience: "Internal",
    });
    loadReports();
  };

  const downloadPdf = async (reportId) => {
    const blob = await api.exports.downloadReportPdf(reportId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${reportId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Reports"
            subtitle="Live report creation and export flow."
          />

          <div className="mb-8 glass-card p-6">
            <h2 className="mb-4 text-2xl font-black text-slate-900">Create Report</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Report title"
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              />
              <input
                value={form.audience}
                onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}
                placeholder="Audience"
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              />
              <textarea
                value={form.summary}
                onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                placeholder="Summary"
                rows={4}
                className="md:col-span-2 rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="button"
              onClick={createReport}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-gradient px-5 py-3 font-semibold text-white"
            >
              <FiFilePlus className="h-4 w-4" />
              Save Report
            </button>
          </div>

          <div className="grid gap-6">
            {reports.map((report) => (
              <div key={report.id} className="glass-card p-6">
                <div className="mb-2 text-xl font-bold text-slate-900">{report.title}</div>
                <div className="mb-3 text-sm text-slate-500">
                  {report.type} · {report.audience}
                </div>
                <p className="mb-4 text-slate-600">{report.summary || "No summary."}</p>
                <button
                  type="button"
                  onClick={() => downloadPdf(report.id)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-800"
                >
                  <FiDownload className="h-4 w-4" />
                  Export PDF
                </button>
              </div>
            ))}
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Reports;