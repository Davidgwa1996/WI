import { useEffect, useState } from 'react';
import { fetchProjects } from '../services/api';
import { useProjectUpdates } from '../hooks/useWebSocket';
import ProjectCard from '../components/ProjectCard';
import { motion } from 'framer-motion';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const { lastMessage } = useProjectUpdates();

  useEffect(() => {
    loadProjects();
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

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProjects();
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects', err);
      setError('Failed to load projects. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter(p => filter === 'all' || p.stage === filter);

  if (loading) return <div className="text-center py-20">Loading projects...</div>;
  if (error) return (
    <div className="text-center py-20 text-red-400">
      <p>{error}</p>
      <button onClick={loadProjects} className="mt-4 bg-blue-600 px-4 py-2 rounded">Retry</button>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold">All Projects</h1>
      <div className="mt-6 mb-8 flex flex-wrap gap-2">
        {['all', 'pre_seed', 'seed', 'series_a'].map(stage => (
          <button
            key={stage}
            onClick={() => setFilter(stage)}
            className={`px-5 py-2 rounded-full transition ${
              filter === stage
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {stage === 'all' ? 'All' : stage.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">No projects found.</div>
        ) : (
          filtered.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Projects;
