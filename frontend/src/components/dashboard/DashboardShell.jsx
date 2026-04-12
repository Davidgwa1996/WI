import React from "react";

const DashboardShell = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen bg-slate-50 ${className}`.trim()}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
};

export default DashboardShell;