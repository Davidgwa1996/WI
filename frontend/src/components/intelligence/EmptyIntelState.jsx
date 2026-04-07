import React from "react";
import { FiInbox } from "react-icons/fi";

const EmptyIntelState = ({ title, message }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
        <FiInbox className="h-10 w-10 text-cyan-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-slate-500">{message}</p>
    </div>
  );
};

export default EmptyIntelState;