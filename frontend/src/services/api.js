// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Helper to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || `HTTP error ${response.status}`;
    } catch (e) {
      errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

// Generic fetch wrapper
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API] Fetching: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`[API] Error calling ${endpoint}:`, error);
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

// Competitors API
export const competitorsAPI = {
  getAll: () => fetchAPI('/competitors'),
};