import React from "react";

const AuthCard = ({
  title,
  subtitle,
  badge = "Web3 Intel Platform",
  children,
  className = "",
}) => {
  return (
    <div
      className={`w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/95 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-10 ${className}`.trim()}
    >
      <div className="mb-8">
        {badge ? (
          <div className="mb-3 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            {badge}
          </div>
        ) : null}

        {title ? (
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            {title}
          </h1>
        ) : null}

        {subtitle ? (
          <p className="mt-2 text-slate-500">{subtitle}</p>
        ) : null}
      </div>

      <div>{children}</div>
    </div>
  );
};

export default AuthCard;