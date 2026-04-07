import React from "react";

const AuthCard = ({ title, subtitle, children }) => {
  return (
    <div className="w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          Web3 Intel Platform
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-slate-500">{subtitle}</p>
      </div>

      {children}
    </div>
  );
};

export default AuthCard;