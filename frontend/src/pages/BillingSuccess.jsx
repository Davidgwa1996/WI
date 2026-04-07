import React from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiArrowRight } from "react-icons/fi";

const BillingSuccess = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="glass-card max-w-2xl p-10 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <FiCheckCircle className="h-10 w-10 text-emerald-600" />
        </div>

        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Billing successful
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          Your subscription flow completed successfully. Your workspace billing
          status should now reflect the latest plan shortly.
        </p>

        <div className="mt-8">
          <Link
            to="/billing"
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-gradient px-6 py-4 font-semibold text-white"
          >
            Return to Billing
            <FiArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BillingSuccess;