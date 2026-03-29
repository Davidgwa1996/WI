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
  FiZap
} from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsAPI.getAll();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Calculate metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in-progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const totalValue = projects.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0);
  
  // Mock data for charts (replace with real data from API)
  const trendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Project Activity',
        data: [12, 19, 15, 17, 14, 18, 22],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Competitor Activity',
        data: [8, 11, 10, 14, 12, 15, 18],
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(139, 92, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const distributionData = {
    labels: ['Active', 'Completed', 'Planning', 'On Hold'],
    datasets: [
      {
        data: [activeProjects, completedProjects, 5, 2],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12, family: "'Inter', sans-serif" }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: { font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12, family: "'Inter', sans-serif" },
          padding: 15,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        cornerRadius: 6,
      }
    },
    cutout: '60%',
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="stat-card" style={{
      background: 'white',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(0,0,0,0.05)',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.02)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)';
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{
          background: color,
          borderRadius: '12px',
          padding: '10px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={24} />
        </div>
        {trend && (
          <div style={{
            background: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: '12px',
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: '600',
            color: trend > 0 ? '#10b981' : '#ef4444'
          }}>
            {trend > 0 ? '+' : ''}{trendValue}%
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', marginBottom: '8px' }}>
          {title}
        </div>
        <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {trend && (
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            vs last period
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <p style={{ color: 'white', fontSize: '18px' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <FiActivity size={48} color="#ef4444" style={{ marginBottom: '20px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px', color: '#111827' }}>
            Failed to Load Data
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>{error}</p>
          <button onClick={fetchProjects} style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FiRefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#f8fafc',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '40px 32px 80px 32px',
        marginBottom: '-40px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: '700',
                marginBottom: '8px',
                background: 'linear-gradient(135deg, #fff 0%, #e0e7ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Welcome back, User
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                Here's what's happening with your projects today
              </p>
            </div>
            <button style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '10px 20px',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
              <FiPlusCircle size={18} /> New Project
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <StatCard
            title="Total Projects"
            value={totalProjects}
            icon={FiBarChart2}
            color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            trend={true}
            trendValue={12}
          />
          <StatCard
            title="Active Projects"
            value={activeProjects}
            icon={FiActivity}
            color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            trend={true}
            trendValue={8}
          />
          <StatCard
            title="Completed Projects"
            value={completedProjects}
            icon={FiTarget}
            color="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            trend={true}
            trendValue={15}
          />
          <StatCard
            title="Total Value"
            value={`$${totalValue.toLocaleString()}`}
            icon={FiDollarSign}
            color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            trend={false}
          />
        </div>

        {/* Charts Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Trend Chart */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                  Activity Trends
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  Project and competitor activity over time
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['week', 'month', 'year'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: selectedTimeframe === tf ? '1px solid #667eea' : '1px solid #e5e7eb',
                      background: selectedTimeframe === tf ? '#667eea' : 'white',
                      color: selectedTimeframe === tf ? 'white' : '#6b7280',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tf.charAt(0).toUpperCase() + tf.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: '300px' }}>
              <Line data={trendData} options={chartOptions} />
            </div>
          </div>

          {/* Distribution Chart */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
              Project Distribution
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
              Status breakdown of all projects
            </p>
            <div style={{ height: '280px' }}>
              <Doughnut data={distributionData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Recent Projects Section */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.05)',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                Recent Projects
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                Your latest project updates and activities
              </p>
            </div>
            <button style={{
              color: '#667eea',
              fontSize: '14px',
              fontWeight: '500',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              View All <FiTrendingUp size={14} />
            </button>
          </div>
          
          {projects.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '16px'
            }}>
              <FiZap size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
              <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '16px' }}>
                No projects yet. Start by creating your first project!
              </p>
              <button style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                Create Project
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Project Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Value</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.slice(0, 5).map((project, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                      <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                        {project.name || project.title || 'Untitled'}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: project.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: project.status === 'active' ? '#10b981' : '#3b82f6'
                        }}>
                          {project.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                        ${(parseFloat(project.value) || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            flex: 1,
                            height: '6px',
                            background: '#e5e7eb',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${project.progress || 65}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: '3px'
                            }} />
                          </div>
                          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                            {project.progress || 65}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;