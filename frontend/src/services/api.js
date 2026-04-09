// ============================================
// API Configuration
// ============================================

// Debug helper to log environment variables
const debugEnv = () => {
  console.log('[API] Environment check:', {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_WS_URL: import.meta.env.VITE_WS_URL,
  });
};

// Get API URL from environment variables
const envApiUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
    : "");

// Debug output
if (!envApiUrl) {
  console.error('[API] ERROR: Missing VITE_API_URL or VITE_API_BASE_URL');
  console.error('[API] Available env vars:', import.meta.env);
  debugEnv();
  throw new Error("Missing VITE_API_URL or VITE_API_BASE_URL");
}

console.log('[API] Using API URL:', envApiUrl);

// Normalize URL (remove trailing slashes, handle HTTPS)
const normalizeApiUrl = (url) => {
  const trimmed = (url || "").replace(/\/+$/, "");
  
  // In production (HTTPS), force HTTPS for API calls
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    const httpsUrl = trimmed.replace(/^http:\/\//i, "https://");
    if (httpsUrl !== trimmed) {
      console.log('[API] Upgraded HTTP to HTTPS:', httpsUrl);
    }
    return httpsUrl;
  }
  
  return trimmed;
};

const API_BASE_URL = normalizeApiUrl(envApiUrl);
const TOKEN_KEY = "w3i_token";

console.log('[API] Normalized API Base URL:', API_BASE_URL);

// ============================================
// Helper Functions
// ============================================

const buildUrl = (endpoint = "") => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE_URL}${cleanEndpoint}`;
  console.log(`[API] Request URL: ${fullUrl}`);
  return fullUrl;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    console.log('[API] Using auth token:', token.substring(0, 20) + '...');
  }
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
  console.log(`[API] Response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    console.error(`[API] Error response: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    console.log(`[API] Response data:`, data);
    return data;
  }

  return response;
};

// ============================================
// Main Fetch Function
// ============================================

const fetchAPI = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);

  try {
    const url = buildUrl(endpoint);
    const method = options.method || "GET";
    
    console.log(`[API] ${method} ${url}`);
    
    const response = await fetch(url, {
      method: method,
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
      console.error('[API] Request timeout:', endpoint);
      throw new Error("Request timeout - server took too long to respond");
    }

    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      console.error('[API] Network error:', error);
      throw new Error(
        "Network request failed. Please check:\n" +
        "1. Backend server is running\n" +
        "2. API URL is correct: " + API_BASE_URL + "\n" +
        "3. CORS is properly configured\n" +
        "4. Backend is accessible from this network"
      );
    }

    throw error;
  }
};

// ============================================
// API Modules
// ============================================

export const authAPI = {
  register: (payload) => fetchAPI("/auth/register", { method: "POST", body: payload }),
  login: (payload) => fetchAPI("/auth/login", { method: "POST", body: payload }),
  me: () => fetchAPI("/users/me"),
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    console.log('[API] User logged out');
  },
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('[API] Token saved');
  },
  getToken: () => localStorage.getItem(TOKEN_KEY),
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

export const systemAPI = {
  getHealth: () => fetchAPI("/health"),
  getMetrics: () => fetchAPI("/metrics"),
  getConfig: () => fetchAPI("/config/status"),
};

export const projectsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set("skip", params.skip);
    if (params.limit !== undefined) query.set("limit", params.limit);
    if (params.stage) query.set("stage", params.stage);
    if (params.sector) query.set("sector", params.sector);

    const qs = query.toString();
    console.log('[API] Fetching projects with params:', params);
    return fetchAPI(`/projects${qs ? `?${qs}` : ""}`);
  },

  getSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set("skip", params.skip);
    if (params.limit !== undefined) query.set("limit", params.limit);

    const qs = query.toString();
    return fetchAPI(`/projects/summary${qs ? `?${qs}` : ""}`);
  },

  getById: (id) => {
    console.log(`[API] Fetching project ${id}`);
    return fetchAPI(`/projects/${id}`);
  },
  
  refresh: () => fetchAPI("/projects/refresh", { method: "POST" }),
  
  create: (payload) => fetchAPI("/projects", { method: "POST", body: payload }),
  
  update: (id, payload) => fetchAPI(`/projects/${id}`, { method: "PUT", body: payload }),
  
  delete: (id) => fetchAPI(`/projects/${id}`, { method: "DELETE" }),
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
  resend: (inviteId) => fetchAPI(`/invites/${inviteId}/resend`, { method: "POST" }),
  cancel: (inviteId) => fetchAPI(`/invites/${inviteId}`, { method: "DELETE" }),
  check: (token) => fetchAPI(`/invites/check/${token}`),
  getStats: () => fetchAPI("/invites/stats"),
  getConfigStatus: () => fetchAPI("/invites/config/status"),
};

export const apiKeysAPI = {
  list: () => fetchAPI("/api-keys"),
  create: (payload) => fetchAPI("/api-keys", { method: "POST", body: payload }),
  revoke: (id) => fetchAPI(`/api-keys/${id}`, { method: "DELETE" }),
};

export const billingAPI = {
  status: () => fetchAPI("/subscriptions/status"),
  checkout: (payload) => fetchAPI("/billing/checkout", { method: "POST", body: payload }),
  portal: (payload) => fetchAPI("/billing/portal", { method: "POST", body: payload }),
};

export const watchlistsAPI = {
  list: () => fetchAPI("/watchlists"),
  getById: (id) => fetchAPI(`/watchlists/${id}`),
  create: (payload) => fetchAPI("/watchlists", { method: "POST", body: payload }),
  update: (id, payload) => fetchAPI(`/watchlists/${id}`, { method: "PUT", body: payload }),
  delete: (id) => fetchAPI(`/watchlists/${id}`, { method: "DELETE" }),
  addItem: (watchlistId, payload) =>
    fetchAPI(`/watchlists/${watchlistId}/items`, { method: "POST", body: payload }),
  removeItem: (watchlistId, projectId) =>
    fetchAPI(`/watchlists/${watchlistId}/items/${projectId}`, { method: "DELETE" }),
  getItems: (watchlistId) => fetchAPI(`/watchlists/${watchlistId}/items`),
  getLiveMetrics: (watchlistId) => fetchAPI(`/watchlists/${watchlistId}/live`),
  getChanges: (watchlistId, hours = 24) => fetchAPI(`/watchlists/${watchlistId}/changes?hours=${hours}`),
  getAlerts: (watchlistId) => fetchAPI(`/watchlists/${watchlistId}/alerts`),
  getSummary: () => fetchAPI("/watchlists/summary/all"),
};

export const reportsAPI = {
  list: () => fetchAPI("/reports"),
  create: (payload) => fetchAPI("/reports", { method: "POST", body: payload }),
  getById: (id) => fetchAPI(`/reports/${id}`),
  delete: (id) => fetchAPI(`/reports/${id}`, { method: "DELETE" }),
};

export const briefingsAPI = {
  list: () => fetchAPI("/briefings"),
  getById: (id) => fetchAPI(`/briefings/${id}`),
  create: (payload) => fetchAPI("/briefings", { method: "POST", body: payload }),
  sendEmail: () => fetchAPI("/briefings/send", { method: "POST" }),
  generate: () => fetchAPI("/briefings/generate", { method: "POST" }),
};

export const searchAPI = {
  intel: (q) => fetchAPI(`/search/intel?q=${encodeURIComponent(q)}`),
  google: (q) => fetchAPI(`/search/google?q=${encodeURIComponent(q)}`),
  projects: (q) => fetchAPI(`/search/projects?q=${encodeURIComponent(q)}`),
};

export const exportsAPI = {
  downloadProjectsCsv: async () => {
    console.log('[API] Downloading projects CSV');
    const response = await fetch(buildUrl("/exports/projects.csv"), {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Could not download CSV.");
    }

    return response.blob();
  },

  downloadReportPdf: async (reportId) => {
    console.log(`[API] Downloading report PDF: ${reportId}`);
    const response = await fetch(buildUrl(`/exports/report.pdf?report_id=${reportId}`), {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Could not download PDF.");
    }

    return response.blob();
  },
  
  downloadProjectsJson: async () => {
    console.log('[API] Downloading projects JSON');
    const response = await fetch(buildUrl("/exports/projects.json"), {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Could not download JSON.");
    }

    return response.json();
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
  updateProfile: (payload) =>
    fetchAPI("/users/me", { method: "PUT", body: payload }),
  changePassword: (payload) =>
    fetchAPI("/users/change-password", { method: "POST", body: payload }),
};

export const auditAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", params.limit);
    if (params.offset) query.set("offset", params.offset);
    const qs = query.toString();
    return fetchAPI(`/audit-logs${qs ? `?${qs}` : ""}`);
  },
};

export const orgAPI = {
  me: () => fetchAPI("/organizations/me"),
  update: (payload) => fetchAPI("/organizations/me", { method: "PUT", body: payload }),
  getSettings: () => fetchAPI("/organizations/settings"),
  updateSettings: (payload) => fetchAPI("/organizations/settings", { method: "PUT", body: payload }),
};

export const agentAPI = {
  chat: (payload) => fetchAPI("/agent/chat", { method: "POST", body: payload }),
  summary: () => fetchAPI("/agent/workspace-summary"),
  analyze: (projectId) => fetchAPI(`/agent/analyze/${projectId}`),
  recommend: () => fetchAPI("/agent/recommendations"),
};

// ============================================
// Competitors API (for backward compatibility)
// ============================================

export const competitorsAPI = {
  getAll: async () => {
    console.log('[API] Fetching competitors');
    try {
      // Try to get from projects endpoint first
      const projects = await projectsAPI.getAll({ limit: 100 });
      // Filter for competitor projects (you can adjust this logic)
      const competitors = projects.filter(p => p.sector === "Competitor" || p.tags?.includes("competitor"));
      return competitors;
    } catch (error) {
      console.warn('[API] Could not fetch competitors, returning empty array:', error);
      return [];
    }
  },
};

export const fetchCompetitors = async () => {
  return await competitorsAPI.getAll();
};

// ============================================
// Main API Object
// ============================================

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
  
  // Utility methods
  setAuthToken: authAPI.setToken,
  getAuthToken: authAPI.getToken,
  isAuthenticated: authAPI.isAuthenticated,
  logout: authAPI.logout,
  
  // Debug method
  debug: () => {
    console.log('[API] Debug Info:', {
      API_BASE_URL,
      TOKEN_KEY,
      hasToken: !!localStorage.getItem(TOKEN_KEY),
      env: import.meta.env.MODE,
    });
  },
};

// Log initialization
console.log('[API] Service initialized with base URL:', API_BASE_URL);

export default api;