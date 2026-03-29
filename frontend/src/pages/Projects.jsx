// src/pages/Projects.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { projectsAPI } from '../services/api';
import ProjectCard from '../components/ProjectCard';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Projects] Fetching projects...');
      const data = await projectsAPI.getAll();
      console.log('[Projects] Received data:', data);
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Projects] Error fetching projects:', err);
      setError(err.message || 'Failed to load projects');
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'red', marginBottom: '10px' }}>
          Failed to load projects: {error}
        </p>
        <button 
          onClick={handleRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Projects</h1>
      {projects.length === 0 ? (
        <p>No projects yet. Add some via the API.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {projects.map(project => (
            <ProjectCard key={project.id || project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;