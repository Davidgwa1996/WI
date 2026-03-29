// src/pages/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { useProjectUpdates } from '../hooks/useWebSocket';
import { FiArrowLeft, FiActivity, FiRefreshCw } from 'react-icons/fi';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { updates, isConnected } = useProjectUpdates(id);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const data = await projectsAPI.getById(id);
        setProject(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div style={{ padding: '32px' }}>
      <button onClick={() => window.history.back()} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '24px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#667eea'
      }}>
        <FiArrowLeft /> Back to Projects
      </button>
      
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      
      {isConnected && (
        <div style={{ marginTop: '24px', padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Live Updates</h3>
          {updates.map((update, idx) => (
            <div key={idx}>{JSON.stringify(update)}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;