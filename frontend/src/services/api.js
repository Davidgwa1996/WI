// src/services/api.js

// ✅ Use Railway backend (fallback ensures production works even without env)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://wi-production-ae1c.up.railway.app";

console.log("[API] Base URL:", API_BASE_URL);

// ------------------------------------------------------------
// Response handler
// ------------------------------------------------------------
const handleResponse = async (response) => {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch {}

    throw new Error(message);
  }

  return response.json();
};

// ------------------------------------------------------------
// Fetch wrapper (with timeout)
// ------------------------------------------------------------
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log("[API] Request:", url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeout);
    return await handleResponse(res);
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      throw new Error("Request timeout");
    }

    console.error("[API ERROR]", endpoint, err);
    throw err;
  }
};

// ------------------------------------------------------------
// PROJECTS API
// ------------------------------------------------------------
export const projectsAPI = {
  getAll: () => fetchAPI("/projects"),
  getById: (id) => fetchAPI(`/projects/${id}`),

  create: (data) =>
    fetchAPI("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    fetchAPI(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    fetchAPI(`/projects/${id}`, {
      method: "DELETE",
    }),
};

// ------------------------------------------------------------
// COMPETITORS API
// ------------------------------------------------------------
export const competitorsAPI = {
  getAll: () => fetchAPI("/competitors"),
  getById: (id) => fetchAPI(`/competitors/${id}`),

  create: (data) =>
    fetchAPI("/competitors", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    fetchAPI(`/competitors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    fetchAPI(`/competitors/${id}`, {
      method: "DELETE",
    }),
};

// ------------------------------------------------------------
// BACKWARD COMPATIBILITY (IMPORTANT)
// ------------------------------------------------------------
export const fetchProjects = async () => {
  return await projectsAPI.getAll();
};

export const fetchCompetitors = async () => {
  return await competitorsAPI.getAll();
};

// ------------------------------------------------------------
// EXPORT DEFAULT
// ------------------------------------------------------------
export default {
  projects: projectsAPI,
  competitors: competitorsAPI,
  fetchProjects,
  fetchCompetitors,
};