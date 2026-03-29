// src/pages/Competitors.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchCompetitors, competitorsAPI } from '../services/api';
import { useCompetitorUpdates } from '../hooks/useWebSocket';
import { FiUsers, FiTrendingUp, FiActivity, FiRefreshCw, FiBarChart2 } from 'react-icons/fi';

const Competitors = () => {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { competitors: realtimeCompetitors, isConnected } = useCompetitorUpdates();

  const loadCompetitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompetitors();
      setCompetitors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load competitors:', err);
      setError(err.message || 'Failed to load competitors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  useEffect(() => {
    // Update competitors with realtime data
    if (realtimeCompetitors.length > 0) {
      setCompetitors(prev => {
        const updated = [...prev];
        realtimeCompetitors.forEach(newComp => {
          const index = updated.findIndex(c => c.id === newComp.id);
          if (index !== -1) {
            updated[index] = { ...updated[index], ...newComp };
          } else {
            updated.push(newComp);
          }
        });
        return updated;
      });
    }
  }, [realtimeCompetitors]);

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      border: '1px solid rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
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
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '12px',
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#10b981'
          }}>
            +{trend}%
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
          <p style={{ color: 'white', fontSize: '18px' }}>Loading competitors...</p>
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
          <button onClick={loadCompetitors} style={{
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
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: '32px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '32px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
              Competitor Analysis
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Track and analyze your competition in real-time
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.2)',
            padding: '8px 16px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#10b981' : '#ef4444',
              animation: isConnected ? 'pulse 2s infinite' : 'none'
            }} />
            <span style={{ fontSize: '12px', fontWeight: '500' }}>
              {isConnected ? 'Live Updates Active' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <StatCard
          title="Total Competitors"
          value={competitors.length}
          icon={FiUsers}
          color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          trend={12}
        />
        <StatCard
          title="Market Share"
          value="34%"
          icon={FiBarChart2}
          color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
          trend={5}
        />
        <StatCard
          title="Active Alerts"
          value="8"
          icon={FiTrendingUp}
          color="linear-gradient(135deg, #10b981 0%, #059669 100%)"
        />
      </div>

      {/* Competitors Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        {competitors.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px',
            background: 'white',
            borderRadius: '20px',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <FiUsers size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              No competitors found. Add some competitors to start tracking.
            </p>
          </div>
        ) : (
          competitors.map((competitor, idx) => (
            <div key={competitor.id || idx} style={{
              background: 'white',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  {competitor.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>
                    {competitor.name || 'Unknown Competitor'}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6b7280' }}>
                    Market Share: {competitor.marketShare || 'N/A'}%
                  </p>
                </div>
              </div>
              
              {competitor.description && (
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                  {competitor.description}
                </p>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid #f3f4f6'
              }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Strength Score</span>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#667eea' }}>
                    {competitor.strengthScore || 75}/100
                  </div>
                </div>
                <button style={{
                  padding: '8px 16px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#667eea',
                  cursor: 'pointer'
                }}>
                  View Analysis
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Competitors;