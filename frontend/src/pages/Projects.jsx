// src/pages/Projects.jsx

import { useEffect, useState } from 'react';
import { projectsAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import ProjectCard from '../components/ProjectCard';
import { motion } from 'framer-motion';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastMessage, readyState } = useWebSocket();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await projectsAPI.getAll();
        setProjects(data);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-cyan-400 text-xl">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400 text-lg">{error}</p>
        <p className="text-gray-400 mt-2">
          WebSocket status: {readyState === 1 ? 'Connected' : 'Disconnected'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition"
        >
          Retry
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
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          All Projects
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Browse all AI-scouted Web3 projects
        </p>
        <p className="text-xs text-gray-500 mt-1">
          WebSocket: {readyState === 1 ? '🟢 Live updates active' : '🔴 Reconnecting...'}
        </p>
      </motion.div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-12">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          No projects found. Add some via the API.
        </div>
      )}
    </div>
  );
};

export default Projects;