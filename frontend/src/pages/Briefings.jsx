import React from "react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SettingsHeader from "../components/settings/SettingsHeader";
import BriefingCard from "../components/intelligence/BriefingCard";
import { useDashboardStream } from "../hooks/useWebSocket";

const briefings = [
  {
    title: "Morning Briefing",
    summary:
      "Tracked projects are showing a healthier quality mix, with strongest momentum concentrated in infrastructure and selected DeFi names.",
    points: [
      "High-conviction projects remain limited but stable.",
      "Developer traction is improving faster than sentiment in several categories.",
      "Risk signals remain elevated for weaker low-data projects.",
    ],
  },
  {
    title: "Risk Briefing",
    summary:
      "Projects with low code activity and weak community consistency continue to show lower conviction durability.",
    points: [
      "Sparse market signals remain a leading indicator of caution.",
      "Discord and GitHub imbalance still appears in lower-quality clusters.",
      "Executive attention should stay on strong, multi-signal projects.",
    ],
  },
];

const Briefings = () => {
  const { isConnected } = useDashboardStream();

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Briefings"
            subtitle="Consume decision-ready intelligence in executive and analyst-friendly formats."
          />

          <SettingsHeader
            title="Briefing Center"
            subtitle="Operational summaries designed for recurring insight consumption and strategic alignment."
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {briefings.map((briefing) => (
              <BriefingCard key={briefing.title} briefing={briefing} />
            ))}
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Briefings;