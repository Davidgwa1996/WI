import React from "react";

const SectionCard = ({ title, subtitle, actions, children }) => {
  return (
    <div className="glass-card p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
};

export default SectionCard;