import { useEffect, useState } from 'react';
import { fetchProjects } from '../services/api';
import { useProjectUpdates } from '../hooks/useWebSocket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ProjectCard from '../components/ProjectCard';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const { lastMessage } = useProjectUpdates();

  useEffect(() => {
    fetchProjects().then(res => {
      setProjects(res.data);
      // Sample trend data – replace with real data later
      const dummy = Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i+1}`,
        value: 500000000 + Math.random() * 1500000000,
      }));
      setTrendData(dummy);
    });
  }, []);

  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'full_update') {
        setProjects(prev =>
          prev.map(p => p.id === data.project_id ? { ...p, ...data } : p)
        );
      }
    }
  }, [lastMessage]);

  const topProjects = [...projects].sort((a,b) => b.overall_score - a.overall_score).slice(0, 3);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Deal Sourcing Dashboard
        </h1>
        <p className="text-gray-400 mt-2 text-lg">AI‑powered insights on early‑stage Web3 startups</p>
      </motion.div>

      {topProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          {topProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">No projects yet. Add some via the API.</div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 mt-8"
      >
        <h2 className="text-xl font-semibold mb-4">Market Cap Trend (30 days)</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${(value/1e9).toFixed(1)}B`} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default Dashboard;
