// src/pages/ProjectDetail.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { motion } from 'framer-motion';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { lastMessage, readyState, sendMessage } = useWebSocket();

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const data = await projectsAPI.getById(id);
        setProject(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load project:', err);
        setError('Failed to load project details. Please check backend connection.');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  useEffect(() => {
    if (lastMessage !== null) {
      const data = lastMessage;
      if (data.type === 'full_update' && data.project_id === parseInt(id)) {
        setProject(prev => ({ ...prev, ...data }));
      }
    }
  }, [lastMessage, id]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      // Request a refresh via WebSocket if available
      if (readyState === 1) {
        sendMessage({ type: 'refresh_project', project_id: parseInt(id) });
      } else {
        // Fallback to HTTP
        const data = await projectsAPI.getById(id);
        setProject(data);
      }
    } catch (err) {
      console.error('Failed to refresh project:', err);
      setError('Failed to refresh project data.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-cyan-400 text-xl">Loading project details...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400 text-lg">{error || 'Project not found'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <button
          onClick={() => navigate('/projects')}
          className="mb-6 text-cyan-400 hover:text-cyan-300 transition"
        >
          ← Back to Projects
        </button>
        
        <div className="flex justify-between items-start">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {project.name}
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
        <p className="text-gray-400 mt-2 text-lg">{project.description}</p>
        <p className="text-xs text-gray-500 mt-1">
          WebSocket: {readyState === 1 ? '🟢 Live updates active' : '🔴 Reconnecting...'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Project Details</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-400">ID:</span>
              <span className="ml-2 text-white">{project.id}</span>
            </div>
            <div>
              <span className="text-gray-400">Overall Score:</span>
              <span className="ml-2 text-cyan-400 font-bold">{project.overall_score}</span>
            </div>
            <div>
              <span className="text-gray-400">Category:</span>
              <span className="ml-2 text-white">{project.category || 'Web3'}</span>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <span className="ml-2 text-green-400">{project.status || 'Active'}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Metrics</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-400">Market Cap:</span>
              <span className="ml-2 text-white">
                ${project.market_cap ? (project.market_cap / 1e9).toFixed(2) : 'N/A'}B
              </span>
            </div>
            <div>
              <span className="text-gray-400">Volume (24h):</span>
              <span className="ml-2 text-white">
                ${project.volume_24h ? (project.volume_24h / 1e6).toFixed(2) : 'N/A'}M
              </span>
            </div>
            <div>
              <span className="text-gray-400">Active Users:</span>
              <span className="ml-2 text-white">{project.active_users?.toLocaleString() || 'N/A'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {project.competitors && project.competitors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Competitors</h2>
          <div className="space-y-2">
            {project.competitors.map((competitor, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-white">{competitor.name}</span>
                <span className="text-gray-400">Score: {competitor.score}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProjectDetail;