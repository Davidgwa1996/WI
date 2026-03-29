// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { projectsAPI } from '../services/api';
import { 
  FiTrendingUp, 
  FiUsers, 
  FiDollarSign, 
  FiActivity, 
  FiRefreshCw, 
  FiPlusCircle, 
  FiBarChart2, 
  FiTarget, 
  FiZap,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import GlassCard from '../components/GlassCard';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Dashboard] Fetching projects...');
      const data = await projectsAPI.getAll();
      console.log('[Dashboard] Received data:', data);
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Dashboard] Error:', err);
      setError(err.message || 'Failed to load projects. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Calculate metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in-progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const totalValue = projects.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0);
  
  // Get recent projects (last 3)
  const recentProjects = [...projects].slice(0, 3);

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }) => (
    <GlassCard className="p-6 animate-fade-in-up">
      <div className="flex justify-between items-start mb-5">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold ${
            trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trendValue)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </GlassCard>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" color="primary" />
          <p className="mt-4 text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-primary pt-12 pb-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="animate-slide-in-left">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Dashboard
              </h1>
              <p className="text-cyan-100 text-lg">
                Welcome back! Here's your project overview
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white font-semibold hover:bg-white/30 transition-all animate-slide-in-right">
              <FiPlusCircle className="w-5 h-5" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Projects"
            value={totalProjects}
            icon={FiBarChart2}
            color="from-cyan-500 to-cyan-600"
            trend={true}
            trendValue={12}
            subtitle="Total in system"
          />
          <StatCard
            title="Active Projects"
            value={activeProjects}
            icon={FiActivity}
            color="from-blue-500 to-blue-600"
            trend={true}
            trendValue={8}
            subtitle="In progress"
          />
          <StatCard
            title="Completed"
            value={completedProjects}
            icon={FiCheckCircle}
            color="from-emerald-500 to-emerald-600"
            trend={true}
            trendValue={15}
            subtitle="Delivered"
          />
          <StatCard
            title="Total Value"
            value={`$${totalValue.toLocaleString()}`}
            icon={FiDollarSign}
            color="from-amber-500 to-amber-600"
            subtitle="Portfolio value"
          />
        </div>

        {/* Recent Projects Section */}
        <GlassCard className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Recent Projects
              </h2>
              <p className="text-slate-500 text-sm">
                Your latest project updates and activities
              </p>
            </div>
            <button className="inline-flex items-center gap-2 text-cyan-600 font-semibold hover:text-cyan-700 transition-colors">
              View All Projects <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-cyan-500/10 rounded-full flex items-center justify-center">
                <FiZap className="w-10 h-10 text-cyan-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Projects Yet
              </h3>
              <p className="text-slate-500 mb-6">
                Get started by creating your first project
              </p>
              <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
                <FiPlusCircle className="w-4 h-4" />
                Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project, idx) => (
                <div
                  key={project.id || idx}
                  className="group p-5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white hover:border-cyan-200 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900">
                          {project.name || project.title || 'Untitled Project'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          project.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-600' 
                            : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {project.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {project.description || 'No description provided'}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        {project.value && (
                          <div className="flex items-center gap-1">
                            <FiDollarSign className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-700">
                              ${parseFloat(project.value).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-500">Updated recently</span>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-[120px]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-500">Progress</span>
                        <span className="text-sm font-bold text-cyan-600">
                          {project.progress || 65}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 65}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default Dashboard;