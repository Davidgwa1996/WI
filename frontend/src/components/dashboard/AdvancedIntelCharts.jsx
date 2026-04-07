import React from "react";
import ReactECharts from "echarts-for-react";

const AdvancedIntelCharts = ({ projects = [] }) => {
  const topProjects = [...projects]
    .sort((a, b) => Number(b.overall_score || 0) - Number(a.overall_score || 0))
    .slice(0, 8);

  const option = {
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    xAxis: {
      type: "category",
      data: topProjects.map((p) => p.name || "Untitled"),
      axisLabel: { rotate: 20 },
    },
    yAxis: { type: "value", max: 100 },
    series: [
      {
        name: "Overall Score",
        type: "bar",
        data: topProjects.map((p) => Number(p.overall_score || 0)),
        smooth: true,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
        },
      },
      {
        name: "Momentum",
        type: "line",
        data: topProjects.map((p) => Number(p.momentum_score || 0)),
        smooth: true,
      },
    ],
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Advanced Intelligence Charts</h2>
        <p className="mt-1 text-sm text-slate-500">
          Executive-grade visual comparison of project score and momentum.
        </p>
      </div>

      <ReactECharts option={option} style={{ height: 360 }} />
    </div>
  );
};

export default AdvancedIntelCharts;