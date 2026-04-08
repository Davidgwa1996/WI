const envApiUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
    : "");

if (!envApiUrl) {
  throw new Error("Missing VITE_API_URL or VITE_API_BASE_URL");
}

const normalizeApiUrl = (url) => {
  const trimmed = (url || "").replace(/\/+$/, "");

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  return trimmed;
};

const API_BASE_URL = normalizeApiUrl(envApiUrl);
const TOKEN_KEY = "w3i_token";

const buildUrl = (endpoint = "") => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
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
    throw new Error(await parseErrorResponse(response));
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }

  return response;
};

const fetchAPI = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 15000);

  try {
    const response = await fetch(buildUrl(endpoint), {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return await handleResponse(response);
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }

    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error(
        "Network request failed. Please check your API URL, HTTPS configuration, or backend availability."
      );
    }

    throw error;
  }
};

export const authAPI = {
  register: (payload) => fetchAPI("/auth/register", { method: "POST", body: payload }),
  login: (payload) => fetchAPI("/auth/login", { method: "POST", body: payload }),
  me: () => fetchAPI("/users/me"),
};

export const systemAPI = {
  getHealth: () => fetchAPI("/health"),
  getMetrics: () => fetchAPI("/metrics"),
};

export const projectsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set("skip", params.skip);
    if (params.limit !== undefined) query.set("limit", params.limit);
    if (params.stage) query.set("stage", params.stage);
    if (params.sector) query.set("sector", params.sector);

    const qs = query.toString();
    return fetchAPI(`/projects${qs ? `?${qs}` : ""}`);
  },

  getSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set("skip", params.skip);
    if (params.limit !== undefined) query.set("limit", params.limit);

    const qs = query.toString();
    return fetchAPI(`/projects/summary${qs ? `?${qs}` : ""}`);
  },

  getById: (id) => fetchAPI(`/projects/${id}`),
  refresh: () => fetchAPI("/projects/refresh", { method: "POST" }),
};

export const workspaceAPI = {
  getSettings: () => fetchAPI("/workspace/settings"),
  updateSettings: (payload) =>
    fetchAPI("/workspace/settings", { method: "PUT", body: payload }),
};

export const invitesAPI = {
  list: () => fetchAPI("/invites"),
  create: (payload) => fetchAPI("/invites", { method: "POST", body: payload }),
  accept: (payload) => fetchAPI("/invites/accept", { method: "POST", body: payload }),
};

export const apiKeysAPI = {
  list: () => fetchAPI("/api-keys"),
  create: (payload) => fetchAPI("/api-keys", { method: "POST", body: payload }),
};

export const billingAPI = {
  status: () => fetchAPI("/subscriptions/status"),
  checkout: (payload) => fetchAPI("/billing/checkout", { method: "POST", body: payload }),
  portal: (payload) => fetchAPI("/billing/portal", { method: "POST", body: payload }),
};

export const watchlistsAPI = {
  list: () => fetchAPI("/watchlists"),
  create: (payload) => fetchAPI("/watchlists", { method: "POST", body: payload }),
  addItem: (watchlistId, payload) =>
    fetchAPI(`/watchlists/${watchlistId}/items`, { method: "POST", body: payload }),
  removeItem: (watchlistId, projectId) =>
    fetchAPI(`/watchlists/${watchlistId}/items/${projectId}`, { method: "DELETE" }),
};

export const reportsAPI = {
  list: () => fetchAPI("/reports"),
  create: (payload) => fetchAPI("/reports", { method: "POST", body: payload }),
  getById: (id) => fetchAPI(`/reports/${id}`),
};

export const briefingsAPI = {
  list: () => fetchAPI("/briefings"),
  sendEmail: () => fetchAPI("/briefings/send", { method: "POST" }),
};

export const searchAPI = {
  intel: (q) => fetchAPI(`/search/intel?q=${encodeURIComponent(q)}`),
  google: (q) => fetchAPI(`/search/google?q=${encodeURIComponent(q)}`),
};

export const exportsAPI = {
  downloadProjectsCsv: async () => {
    const response = await fetch(buildUrl("/exports/projects.csv"), {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Could not download CSV.");
    }

    return response.blob();
  },

  downloadReportPdf: async (reportId) => {
    const response = await fetch(buildUrl(`/exports/report.pdf?report_id=${reportId}`), {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Could not download PDF.");
    }

    return response.blob();
  },
};

export const usersAPI = {
  list: () => fetchAPI("/users"),
  me: () => fetchAPI("/users/me"),
  updateRole: (id, role) =>
    fetchAPI(`/users/${id}/role`, {
      method: "PATCH",
      body: { role },
    }),
};

export const auditAPI = {
  list: () => fetchAPI("/audit-logs"),
};

export const orgAPI = {
  me: () => fetchAPI("/organizations/me"),
};

export const agentAPI = {
  chat: (payload) => fetchAPI("/agent/chat", { method: "POST", body: payload }),
  summary: () => fetchAPI("/agent/workspace-summary"),
};

/* Permanent compatibility export for competitors page */
export const competitorsAPI = {
  getAll: async () => {
    return [];
  },
};

export const fetchCompetitors = async () => {
  return await competitorsAPI.getAll();
};

const api = {
  auth: authAPI,
  system: systemAPI,
  projects: projectsAPI,
  workspace: workspaceAPI,
  invites: invitesAPI,
  apiKeys: apiKeysAPI,
  billing: billingAPI,
  watchlists: watchlistsAPI,
  reports: reportsAPI,
  briefings: briefingsAPI,
  search: searchAPI,
  exports: exportsAPI,
  users: usersAPI,
  audit: auditAPI,
  org: orgAPI,
  agent: agentAPI,
  competitors: competitorsAPI,
};

export default api;