import React from "react";
import { Link } from "react-router-dom";
import { FiAlertCircle, FiArrowLeft } from "react-icons/fi";

const BillingCancel = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="glass-card max-w-2xl p-10 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <FiAlertCircle className="h-10 w-10 text-amber-600" />
        </div>

        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Billing flow cancelled
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          No changes were applied to your subscription. You can return to billing
          at any time and choose a plan when you are ready.
        </p>

        <div className="mt-8">
          <Link
            to="/billing"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-800"
          >
            <FiArrowLeft className="h-5 w-5" />
            Back to Billing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BillingCancel;