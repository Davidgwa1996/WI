// src/components/ProjectCard.jsx
import React from 'react';
import { FiTrendingUp, FiUsers, FiCalendar, FiArrowRight } from 'react-icons/fi';

const ProjectCard = ({ project }) => {
  if (!project) return null;

  const getStatusColor = (status) => {
    const statuses = {
      'active': '#10b981',
      'completed': '#3b82f6',
      'planning': '#f59e0b',
      'on-hold': '#ef4444'
    };
    return statuses[status?.toLowerCase()] || '#6b7280';
  };

  const getStatusBg = (status) => {
    const statuses = {
      'active': 'rgba(16, 185, 129, 0.1)',
      'completed': 'rgba(59, 130, 246, 0.1)',
      'planning': 'rgba(245, 158, 11, 0.1)',
      'on-hold': 'rgba(239, 68, 68, 0.1)'
    };
    return statuses[status?.toLowerCase()] || 'rgba(107, 114, 128, 0.1)';
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.02)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '8px',
          lineHeight: '1.3'
        }}>
          {project.name || project.title || 'Untitled Project'}
        </h3>
        <div style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          background: getStatusBg(project.status),
          color: getStatusColor(project.status)
        }}>
          {project.status || 'Active'}
        </div>
      </div>
      
      <div style={{ padding: '20px' }}>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '16px',
          lineHeight: '1.5'
        }}>
          {project.description || 'No description provided'}
        </p>
        
        {project.value && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            padding: '12px 0',
            borderTop: '1px solid #f3f4f6',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Project Value</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              ${parseFloat(project.value).toLocaleString()}
            </span>
          </div>
        )}
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Progress</span>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#667eea' }}>
              {project.progress || 65}%
            </span>
          </div>
          <div style={{
            width: '100%',
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
        </div>
        
        <button style={{
          width: '100%',
          padding: '10px',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: '500',
          color: '#667eea',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#667eea';
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.borderColor = '#667eea';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f9fafb';
          e.currentTarget.style.color = '#667eea';
          e.currentTarget.style.borderColor = '#e5e7eb';
        }}>
          View Details <FiArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;