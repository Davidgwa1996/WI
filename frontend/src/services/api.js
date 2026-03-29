// src/services/api.js

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://wi-production-ae1c.up.railway.app';

console.log('[API] Using base URL:', API_BASE_URL);

// Helper to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage =
        errorData.message ||
        errorData.error ||
        `HTTP error ${response.status}`;
    } catch (e) {
      errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

// Fetch wrapper
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API] Fetching: ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);
    return await handleResponse(response);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server unreachable');
    }

    console.error(`[API] Error calling ${endpoint}:`, error);
    throw error;
  }
};

// APIs
export const projectsAPI = {
  getAll: () => fetchAPI('/projects'),
  getById: (id) => fetchAPI(`/projects/${id}`),
  create: (data) =>
    fetchAPI('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    fetchAPI(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    fetchAPI(`/projects/${id}`, { method: 'DELETE' }),
};

export const competitorsAPI = {
  getAll: () => fetchAPI('/competitors'),
  getById: (id) => fetchAPI(`/competitors/${id}`),
  create: (data) =>
    fetchAPI('/competitors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    fetchAPI(`/competitors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    fetchAPI(`/competitors/${id}`, { method: 'DELETE' }),
};

export default {
  projects: projectsAPI,
  competitors: competitorsAPI,
};