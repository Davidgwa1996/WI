import React, { useEffect, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { billingAPI } from "../services/api";
import { useDashboardStream } from "../hooks/useWebSocket";

const Billing = () => {
  const { isConnected } = useDashboardStream();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    document.title = "Billing | Web3 Intel Platform";
    billingAPI.status().then(setStatus).catch(() => setStatus(null));
  }, []);

  const startCheckout = async (priceId) => {
    const result = await billingAPI.checkout({
      price_id: priceId,
      success_url: `${window.location.origin}/billing/success`,
      cancel_url: `${window.location.origin}/billing/cancel`,
    });
    if (result?.checkout_url) {
      window.location.href = result.checkout_url;
    }
  };

  const openPortal = async () => {
    const result = await billingAPI.portal({
      return_url: `${window.location.origin}/billing`,
    });
    if (result?.portal_url) {
      window.location.href = result.portal_url;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Billing"
            subtitle="Manage subscriptions, upgrades, and workspace plans."
          />

          <SettingsHeader
            title="Billing & Plans"
            subtitle="Scale from single users to enterprise teams with flexible subscription options."
          />

          <div className="grid gap-6 xl:grid-cols-3">
            {[
              { name: "Starter", price: "£49/mo", desc: "Small teams and solo analysts", priceId: "price_starter" },
              { name: "Pro", price: "£149/mo", desc: "Growing teams with advanced monitoring", priceId: "price_pro" },
              { name: "Enterprise", price: "Custom", desc: "Large organizations with premium support", priceId: "price_enterprise" },
            ].map((plan) => (
              <div key={plan.name} className="glass-card p-6">
                <div className="mb-3 text-sm font-semibold text-cyan-700">{plan.name}</div>
                <div className="text-4xl font-black text-slate-900">{plan.price}</div>
                <p className="mt-3 text-slate-500">{plan.desc}</p>
                <button
                  onClick={() => startCheckout(plan.priceId)}
                  className="mt-6 w-full rounded-2xl bg-brand-gradient px-5 py-3 font-semibold text-white"
                >
                  Choose Plan
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <SectionCard title="Current Subscription" subtitle="Review your current billing state and customer details.">
              {!status ? (
                <div className="text-slate-500">No billing data available.</div>
              ) : (
                <div className="space-y-3">
                  <div className="text-slate-700">
                    Current Plan: <span className="font-bold">{status.plan}</span>
                  </div>
                  <div className="text-slate-700">
                    Active: <span className="font-bold">{status.is_active ? "Yes" : "No"}</span>
                  </div>
                  <button
                    onClick={openPortal}
                    className="mt-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800"
                  >
                    Open Billing Portal
                  </button>
                </div>
              )}
            </SectionCard>
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Billing;