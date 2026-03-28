import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project }) => {
  const score = project.overall_score?.toFixed(0) || 'N/A';
  const scoreColor = score > 75 ? 'text-green-400' : score > 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -8 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="glass-card p-6 hover:shadow-2xl transition-shadow"
    >
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-white">{project.name}</h3>
        <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
      </div>
      <p className="text-gray-300 mt-2 line-clamp-2 text-sm">{project.description || 'No description'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.sector && <span className="bg-cyan-900/50 text-cyan-300 text-xs px-2 py-1 rounded-full">{project.sector}</span>}
        {project.stage && <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded-full">{project.stage}</span>}
      </div>
      <div className="mt-4 flex justify-between text-sm text-gray-400">
        <span>💰 {project.funding_raised ? `$${(project.funding_raised/1e6).toFixed(1)}M` : 'N/A'}</span>
        <span>🐦 {project.twitter_followers?.toLocaleString() || 0}</span>
        <span>⭐ {project.github_stars?.toLocaleString() || 0}</span>
      </div>
      <Link to={`/project/${project.id}`}>
        <button className="mt-4 w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-2 rounded-xl transition">
          View Details
        </button>
      </Link>
    </motion.div>
  );
};

export default ProjectCard;
