import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProject, refreshProject } from '../services/api';
import { useProjectUpdates } from '../hooks/useWebSocket';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { lastMessage } = useProjectUpdates();

  useEffect(() => {
    loadProject();
  }, [id]);

  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'full_update' && data.project_id === parseInt(id)) {
        setProject(prev => ({ ...prev, ...data }));
      }
    }
  }, [lastMessage, id]);

  const loadProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProject(id);
      setProject(res.data);
    } catch (err) {
      console.error('Failed to load project', err);
      setError('Failed to load project. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProject(id);
      setTimeout(loadProject, 2000);
    } catch (err) {
      console.error('Refresh failed', err);
      setError('Refresh failed. Check backend logs.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading project details...</div>;
  if (error) return (
    <div className="text-center py-20 text-red-400">
      <p>{error}</p>
      <button onClick={loadProject} className="mt-4 bg-blue-600 px-4 py-2 rounded">Retry</button>
    </div>
  );
  if (!project) return <div className="text-center py-20">Project not found.</div>;

  const scores = [
    { name: 'LLM Score', value: project.llm_score ?? 0 },
    { name: 'Sentiment', value: project.sentiment_score ?? 0 },
    { name: 'Funding Prob.', value: project.funding_prediction ?? 0 },
    { name: 'Momentum', value: project.momentum_score ?? 0 },
    { name: 'Overall', value: project.overall_score ?? 0 },
  ];

  // Generate dummy sentiment history (replace with real data later)
  const sentimentHistory = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i+1}`,
    sentiment: 40 + Math.random() * 60,
    volume: Math.random() * 1000,
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
      <div className="glass-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">{project.name || 'Untitled'}</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl transition disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
        <p className="text-gray-300 mt-4 text-lg">{project.description || 'No description provided.'}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {project.website && <a href={project.website} target="_blank" className="text-cyan-400 hover:underline">Website</a>}
          {project.twitter_handle && <a href={`https://twitter.com/${project.twitter_handle}`} target="_blank" className="text-cyan-400 hover:underline">Twitter</a>}
          {project.github_repo && <a href={`https://github.com/${project.github_repo}`} target="_blank" className="text-cyan-400 hover:underline">GitHub</a>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          <MetricCard label="Twitter" value={project.twitter_followers?.toLocaleString()} growth={project.twitter_follower_growth_30d} icon="🐦" />
          <MetricCard label="Discord" value={project.discord_members?.toLocaleString()} growth={project.discord_growth_30d} icon="💬" />
          <MetricCard label="GitHub Stars" value={project.github_stars?.toLocaleString()} growth={project.github_star_growth_30d} icon="⭐" />
          <MetricCard label="Market Cap" value={project.market_cap ? `$${(project.market_cap/1e6).toFixed(0)}M` : 'N/A'} icon="📊" />
        </div>

        <div className="glass-card p-6 my-8">
          <h2 className="text-xl font-semibold mb-4">AI Scores</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis domain={[0, 100]} stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6 my-8">
          <h2 className="text-xl font-semibold mb-4">Sentiment & Engagement Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={sentimentHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Area type="monotone" dataKey="sentiment" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-2">Investment Summary</h2>
          <p className="text-gray-300 leading-relaxed">
            {project.overall_score > 75 ? 'This project shows exceptional potential.' :
             project.overall_score > 50 ? 'This project shows moderate potential.' :
             'This project faces significant challenges.'}
            {' '}The LLM evaluation gave a score of {(project.llm_score ?? 0).toFixed(0)}/100, indicating
            {(project.llm_score ?? 0) > 70 ? ' strong fundamentals and team.' : ' areas needing improvement.'}
            {' '}Community sentiment is {(project.sentiment_score ?? 0) > 60 ? 'positive' : 'mixed'}, and
            momentum is {(project.momentum_score ?? 0) > 50 ? 'accelerating' : 'stabilizing'}.
            {' '}Our XGBoost model predicts a {(project.funding_prediction ?? 0).toFixed(0)}% chance of raising the next round within 6 months.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const MetricCard = ({ label, value, growth, icon }) => (
  <div className="glass-card p-4 text-center">
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-2xl font-bold">{value || '0'}</div>
    <div className="text-sm text-gray-400">{label}</div>
    {growth !== undefined && (
      <div className={`text-xs mt-1 ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`} 30d
      </div>
    )}
  </div>
);

export default ProjectDetail;
