import React from "react";

const SettingsHeader = ({ title, subtitle }) => {
  return (
    <div className="mb-8">
      <div className="mb-2 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
        Enterprise Workspace
      </div>
      <h1 className="text-4xl font-black tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 max-w-3xl text-slate-500">{subtitle}</p>
    </div>
  );
};

export default SettingsHeader;