// src/services/api.js

// Use environment variable for the base URL, fallback to localhost:3000/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Helper to handle fetch responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP error ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

// Generic fetch wrapper with error logging
const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    throw error;
  }
};

// Projects API
export const projectsAPI = {
  getAll: () => fetchAPI('/projects'),
  getById: (id) => fetchAPI(`/projects/${id}`),
  create: (data) => fetchAPI('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/projects/${id}`, { method: 'DELETE' }),
};

// Competitors API (add more as needed)
export const competitorsAPI = {
  getAll: () => fetchAPI('/competitors'),
  // ... other methods
};

// Default export for convenience
export default {
  projects: projectsAPI,
  competitors: competitorsAPI,
};