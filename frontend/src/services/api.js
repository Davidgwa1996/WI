// src/services/api.js

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/+$/, "");

console.log("[API] Base URL:", API_BASE_URL);

const buildUrl = (endpoint = "") => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

const parseErrorResponse = async (response) => {
  let message = `HTTP ${response.status}`;

  try {
    const data = await response.json();
    message = data?.detail || data?.message || data?.error || message;
  } catch {
    // ignore parse failure
  }

  return message;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new Error(message);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;

  return response.json();
};

const fetchAPI = async (endpoint, options = {}) => {
  const url = buildUrl(endpoint);
  console.log("[API] Request:", url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      body: options.body,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return await handleResponse(response);
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }

    console.error("[API ERROR]", endpoint, error);
    throw error;
  }
};

export const systemAPI = {
  getHealth: () => fetchAPI("/health"),
  getMetrics: () => fetchAPI("/metrics"),
};

export const projectsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();

    if (params.skip !== undefined) query.set("skip", String(params.skip));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.stage) query.set("stage", params.stage);
    if (params.sector) query.set("sector", params.sector);

    const qs = query.toString();
    return fetchAPI(`/projects${qs ? `?${qs}` : ""}`);
  },

  getSummary: (params = {}) => {
    const query = new URLSearchParams();

    if (params.skip !== undefined) query.set("skip", String(params.skip));
    if (params.limit !== undefined) query.set("limit", String(params.limit));

    const qs = query.toString();
    return fetchAPI(`/projects/summary${qs ? `?${qs}` : ""}`);
  },

  getById: (id) => fetchAPI(`/projects/${id}`),

  refresh: () =>
    fetchAPI("/projects/refresh", {
      method: "POST",
    }),
};

export const competitorsAPI = {
  getAll: async () => [],
  getById: async () => null,
};

export const fetchProjects = async () => projectsAPI.getAll();
export const fetchProjectById = async (id) => projectsAPI.getById(id);
export const fetchProjectSummary = async () => projectsAPI.getSummary();
export const refreshProjects = async () => projectsAPI.refresh();
export const fetchHealth = async () => systemAPI.getHealth();
export const fetchMetrics = async () => systemAPI.getMetrics();
export const fetchCompetitors = async () => competitorsAPI.getAll();

export default {
  system: systemAPI,
  projects: projectsAPI,
  competitors: competitorsAPI,
  fetchProjects,
  fetchProjectById,
  fetchProjectSummary,
  refreshProjects,
  fetchHealth,
  fetchMetrics,
  fetchCompetitors,
};