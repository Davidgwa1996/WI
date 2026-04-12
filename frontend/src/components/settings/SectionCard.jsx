import React from "react";

const SectionCard = ({
  title,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "",
}) => {
  return (
    <div className={`app-panel p-6 md:p-8 ${className}`.trim()}>
      {(title || subtitle || actions) ? (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            {title ? (
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}

      <div className={bodyClassName}>{children}</div>
    </div>
  );
};

export default SectionCard;