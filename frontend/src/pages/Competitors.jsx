import { useEffect, useState } from 'react';
import { fetchProjects } from '../services/api';
import { useProjectUpdates } from '../hooks/useWebSocket';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Competitors = () => {
  const [competitors, setCompetitors] = useState([]);
  const { lastMessage } = useProjectUpdates();

  useEffect(() => {
    fetchProjects().then(res => {
      const sorted = [...res.data].sort((a, b) => b.overall_score - a.overall_score);
      setCompetitors(sorted.slice(0, 20));
    });
  }, []);

  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'full_update') {
        setCompetitors(prev =>
          prev.map(p => p.id === data.project_id ? { ...p, ...data } : p)
        );
      }
    }
  }, [lastMessage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Top Competitors by Overall Score</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Project</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left">Sector</th>
              <th className="px-4 py-3 text-left">Stage</th>
              <th className="px-4 py-3 text-left">Twitter</th>
              <th className="px-4 py-3 text-left">GitHub</th>
             </tr>
          </thead>
          <tbody>
            {competitors.map((proj, idx) => (
              <tr key={proj.id} className="border-b border-gray-700 hover:bg-white/5 transition">
                <td className="px-4 py-3 font-bold">#{idx+1}</td>
                <td className="px-4 py-3">
                  <Link to={`/project/${proj.id}`} className="text-cyan-400 hover:underline">
                    {proj.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{proj.overall_score?.toFixed(0) || 'N/A'}</td>
                <td className="px-4 py-3">{proj.sector || '-'}</td>
                <td className="px-4 py-3">{proj.stage || '-'}</td>
                <td className="px-4 py-3">{proj.twitter_followers?.toLocaleString() || 0}</td>
                <td className="px-4 py-3">{proj.github_stars?.toLocaleString() || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default Competitors;
