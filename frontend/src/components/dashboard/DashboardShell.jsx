import React from "react";

const DashboardShell = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="section-container py-8">
        {children}
      </div>
    </div>
  );
};

export default DashboardShell;