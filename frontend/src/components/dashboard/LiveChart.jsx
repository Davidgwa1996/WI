import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

const LiveChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="glass-card p-6">
        <h2 className="mb-3 text-xl font-bold text-slate-900">Live Project Score</h2>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-500">
          No chart data available yet.
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.name || "Unnamed",
    overall_score: Number(item.overall_score || 0)
  }));

  return (
    <div className="glass-card p-6">
      <h2 className="mb-2 text-xl font-bold text-slate-900">Live Project Score</h2>
      <p className="mb-6 text-sm text-slate-500">
        Real-time score trends across tracked Web3 projects
      </p>

      <div className="h-[320px] w-full">
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="overall_score"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LiveChart;