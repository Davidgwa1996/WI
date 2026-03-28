// src/pages/Dashboard.jsx

import { useEffect, useState, useRef } from 'react';
import { projectsAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ProjectCard from '../components/ProjectCard';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { useSpring, animated } from 'react-spring';
import Background3D from '../components/Background3D';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastMessage, readyState } = useWebSocket();
  const titleRef = useRef();
  const { scrollYProgress } = useScroll();

  // GSAP animation on title
  useEffect(() => {
    gsap.fromTo(titleRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    );
  }, []);

  // Fetch projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await projectsAPI.getAll();
        setProjects(data);
        // Generate realistic trend data (you can replace with real API data)
        const dummy = Array.from({ length: 30 }, (_, i) => ({
          date: `Day ${i + 1}`,
          value: 500000000 + Math.random() * 1500000000,
        }));
        setTrendData(dummy);
        setError(null);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError('Failed to load projects. Please check backend connection.');
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  // WebSocket updates
  useEffect(() => {
    if (lastMessage !== null) {
      const data = lastMessage;
      if (data.type === 'full_update') {
        setProjects(prev =>
          prev.map(p => p.id === data.project_id ? { ...p, ...data } : p)
        );
      }
    }
  }, [lastMessage]);

  const topProjects = [...projects].sort((a, b) => b.overall_score - a.overall_score).slice(0, 3);

  // Spring animation for chart container
  const chartSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(50px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    delay: 500,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-cyan-400 text-xl animate-pulse">Loading the future...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
        <div className="bg-red-900/30 border border-red-500 rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-400 text-lg">{error}</p>
          <p className="text-gray-400 mt-2">
            WebSocket: {readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full hover:scale-105 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 3D Background */}
      <Background3D />

      {/* Main Content */}
      <div className="relative z-10 px-6 md:px-12 py-8 text-white">
        <motion.div
          ref={titleRef}
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent drop-shadow-lg">
            Deal Sourcing Dashboard
          </h1>
          <p className="text-gray-300 mt-4 text-xl font-light">
            AI‑powered insights on early‑stage Web3 startups
          </p>
          <div className="mt-2 text-xs text-cyan-400">
            {readyState === 1 ? '🔌 Real-time feed active' : '⚡ Connecting to live feed...'}
          </div>
        </motion.div>

        {topProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {topProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 shadow-2xl hover:border-cyan-500/50 transition-all"
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400 backdrop-blur-sm rounded-2xl bg-white/5">
            No projects yet. Add some via the API.
          </div>
        )}

        <animated.div style={chartSpring} className="backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
            Market Cap Trend (30 days)
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${(value / 1e9).toFixed(1)}B`} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={false}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </animated.div>
      </div>
    </div>
  );
};

export default Dashboard;