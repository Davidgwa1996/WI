// ============================================
// API Configuration
// ============================================

const debugEnv = () => {
  console.log("[API] Environment check:", {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_WS_URL: import.meta.env.VITE_WS_URL,
  });
};

const envApiUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
    : "");

if (!envApiUrl) {
  console.error("[API] ERROR: Missing VITE_API_URL or VITE_API_BASE_URL");
  console.error("[API] Available env vars:", import.meta.env);
  debugEnv();
  throw new Error("Missing VITE_API_URL or VITE_API_BASE_URL");
}

const normalizeApiUrl = (url) => {
  const trimmed = (url || "").replace(/\/+$/, "");

  if (trimmed.includes("wi-production-ae1c.up.railway.app")) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  return trimmed;
};

const API_BASE_URL = normalizeApiUrl(envApiUrl);
const TOKEN_KEYS = ["w3i_token", "token", "access_token", "auth_token"];
const PRIMARY_TOKEN_KEY = "w3i_token";

console.log("[API] Using API URL:", API_BASE_URL);

// ============================================
// Cache
// ============================================

const cache = new Map();
const CACHE_TTL = 60000;

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
  setTimeout(() => cache.delete(key), CACHE_TTL);
};

const clearCache = () => {
  cache.clear();
};

// ============================================
// Retry logic
// ============================================

const retryRequest = async (fn, retries = 2, delay = 500) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// ============================================
// Helpers
// ============================================

const getStoredToken = () => {
  for (const key of TOKEN_KEYS) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }
  return "";
};

const setStoredToken = (token) => {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  if (token) {
    localStorage.setItem(PRIMARY_TOKEN_KEY, token);
  }
};

const clearStoredAuth = () => {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("user");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("currentUser");
};

const buildUrl = (endpoint = "") => {
  const cleanEndpoint = `/${String(endpoint).replace(/^\/+/, "")}`.replace(/\/+$/, "");
  return `${API_BASE_URL}${cleanEndpoint}`;
};

const getAuthHeaders = () => {
  const token = getStoredToken();
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
    const errorMsg = await parseErrorResponse(response);
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }

  return response;
};

// ============================================
// Main Fetch Function
// ============================================

const fetchAPI = async (endpoint, options = {}) => {
  const method = options.method || "GET";
  const useCache = options.useCache !== false && method === "GET";
  const cacheKey = `${method}:${endpoint}:${JSON.stringify(options.body || {})}`;

  if (useCache) {
    const cachedData = getCached(cacheKey);
    if (cachedData) return cachedData;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);

  try {
    const url = buildUrl(endpoint);

    const response = await retryRequest(
      async () => {
        const headers = {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...getAuthHeaders(),
          ...(options.headers || {}),
        };

        return await fetch(url, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });
      },
      options.retries ?? 2,
      options.retryDelay ?? 500
    );

    clearTimeout(timeout);
    const result = await handleResponse(response);

    if (useCache && response.ok) {
      setCache(cacheKey, result);
    }

    return result;
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      throw new Error("Request timeout - server took too long to respond");
    }

    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error(
        "Network request failed. Check backend availability, API URL, and CORS configuration."
      );
    }

    throw error;
  }
};

// ============================================
// API Modules
// ============================================

export const authAPI = {
  register: (payload) =>
    fetchAPI("/auth/register", {
      method: "POST",
      body: payload,
      useCache: false,
    }),

  login: async (payload) => {
    const result = await fetchAPI("/auth/login", {
      method: "POST",
      body: payload,
      useCache: false,
    });

    if (result?.access_token) {
      setStoredToken(result.access_token);
    }

    return result;
  },

  me: () => fetchAPI("/users/me", { useCache: false }),

  logout: () => {
    clearStoredAuth();
    clearCache();
  },

  setToken: (token) => {
    setStoredToken(token);
  },

  getToken: () => getStoredToken(),

  isAuthenticated: () => !!getStoredToken(),
};

export const systemAPI = {
  getHealth: () => fetchAPI("/health", { useCache: false }),
  getMetrics: () => fetchAPI("/metrics"),
  getConfig: () => fetchAPI("/config/status"),
};

export const projectsAPI = {
  getAll: (params = {}, options = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set("skip", params.skip);
    if (params.limit !== undefined) query.set("limit", params.limit);
    if (params.stage) query.set("stage", params.stage);
    if (params.sector) query.set("sector", params.sector);

    const qs = query.toString();
    return fetchAPI(`/projects${qs ? `?${qs}` : ""}`, options);
  },

  getSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set("skip", params.skip);
    if (params.limit !== undefined) query.set("limit", params.limit);

    const qs = query.toString();
    return fetchAPI(`/projects/summary${qs ? `?${qs}` : ""}`);
  },

  getById: (id, options = {}) => fetchAPI(`/projects/${id}`, options),

  refresh: () =>
    fetchAPI("/projects/refresh", {
      method: "POST",
      useCache: false,
    }),

  create: (payload) =>
    fetchAPI("/projects", {
      method: "POST",
      body: payload,
      useCache: false,
    }),

  update: (id, payload) =>
    fetchAPI(`/projects/${id}`, {
      method: "PUT",
      body: payload,
      useCache: false,
    }),

  delete: (id) =>
    fetchAPI(`/projects/${id}`, {
      method: "DELETE",
      useCache: false,
    }),

  clearCache: () => {
    for (const key of cache.keys()) {
      if (key.includes("/projects")) cache.delete(key);
    }
  },
};

export const workspaceAPI = {
  getSettings: () => fetchAPI("/workspace/settings"),
  updateSettings: (payload) =>
    fetchAPI("/workspace/settings", {
      method: "PUT",
      body: payload,
      useCache: false,
    }),
};

export const invitesAPI = {
  list: () => fetchAPI("/invites", { useCache: false }),
  create: (payload) =>
    fetchAPI("/invites", {
      method: "POST",
      body: payload,
      useCache: false,
    }),
  accept: (payload) =>
    fetchAPI("/invites/accept", {
      method: "POST",
      body: payload,
      useCache: false,
    }),
  resend: (inviteId) =>
    fetchAPI(`/invites/${inviteId}/resend`, {
      method: "POST",
      useCache: false,
    }),
  cancel: (inviteId) =>
    fetchAPI(`/invites/${inviteId}`, {
      method: "DELETE",
      useCache: false,
    }),
  check: (token) => fetchAPI(`/invites/check/${token}`, { useCache: false }),
  getStats: () => fetchAPI("/invites/stats", { useCache: false }),
  getConfigStatus: () => fetchAPI("/invites/config/status", { useCache: false }),
};

export const apiKeysAPI = {
  list: () => fetchAPI("/api-keys"),
  create: (payload) =>
    fetchAPI("/api-keys", {
      method: "POST",
      body: payload,
      useCache: false,
    }),
  revoke: (id) =>
    fetchAPI(`/api-keys/${id}`, {
      method: "DELETE",
      useCache: false,
    }),
};

export const billingAPI = {
  status: () => fetchAPI("/subscriptions/status"),
  checkout: (payload) =>
    fetchAPI("/billing/checkout", {
      method: "POST",
      body: payload,
      useCache: false,
    }),
  portal: (payload) =>
    fetchAPI("/billing/portal", {
      method: "POST",
      body: payload,
      useCache: false,
    }),
};

export const watchlistsAPI = {
  list: () => fetchAPI("/watchlists"),
  getById: (id) => fetchAPI(`/watchlists/${id}`),
  create: (payload) =>
    fetchAPI("/watchlists", {
      method: "POST",
      body: payload,
      useCache: false,
    }),
  update: (id, payload) =>
    fetchAPI(`/watchlists/${id}`, {
      method: "PUT",
      body: payload,
      useCache: false,
    }),
  delete: (id) =>
    fetchAPI(`/watchlists/${id}`, {
      method: "DELETE",
      useCache: false,
    }),
  addItem: (watchlistId, payload) =>
    fetchAPI(`/watchlists/${watchlistId}/items`, {
      method: "POST",
      body: payload,
      useCache: false,
    }),
  removeItem: (watchlistId, projectId) =>
    fetchAPI(`/watchlists/${watchlistId}/items/${projectId}`, {
      method: "DELETE",
      useCache: false,
    }),
  getItems: (watchlistId) => fetchAPI(`/watchlists/${watchlistId}/items`),
  getLiveMetrics: (watchlistId) =>
    fetchAPI(`/watchlists/${watchlistId}/live`, { useCache: false }),
  getChanges: (watchlistId, hours = 24) =>
    fetchAPI(`/watchlists/${watchlistId}/changes?hours=${hours}`),
  getAlerts: (watchlistId) => fetchAPI(`/watchlists/${watchlistId}/alerts`),
  getSummary: () => fetchAPI("/watchlists/summary/all"),
};

export const reportsAPI = {
  list: () => fetchAPI("/reports"),
  create: (payload) =>
    fetchAPI("/reports", {
      method: "POST",
      body: payload,
      useCache: false,
    }),
  getById: (id) => fetchAPI(`/reports/${id}`),
  delete: (id) =>
    fetchAPI(`/reports/${id}`, {
      method: "DELETE",
      useCache: false,
    }),
};

export const briefingsAPI = {
  list: () => fetchAPI("/briefings"),
  getById: (id) => fetchAPI(`/briefings/${id}`),
  create: (payload) =>
    fetchAPI("/briefings", {
      method: "POST",
      body: payload,
      useCache: false,
    }),
  sendEmail: () =>
    fetchAPI("/briefings/send", {
      method: "POST",
      useCache: false,
    }),
  generate: () =>
    fetchAPI("/briefings/generate", {
      method: "POST",
      useCache: false,
    }),
};

export const searchAPI = {
  intel: (q) => fetchAPI(`/search/intel?q=${encodeURIComponent(q)}`),
  google: (q) => fetchAPI(`/search/google?q=${encodeURIComponent(q)}`),
  projects: (q) => fetchAPI(`/search/projects?q=${encodeURIComponent(q)}`),
};

export const exportsAPI = {
  downloadProjectsCsv: async () => {
    const token = getStoredToken();
    const response = await fetch(buildUrl("/exports/projects.csv"), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) throw new Error("Could not download CSV.");
    return response.blob();
  },

  downloadReportPdf: async (reportId) => {
    const token = getStoredToken();
    const response = await fetch(buildUrl(`/exports/report.pdf?report_id=${reportId}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) throw new Error("Could not download PDF.");
    return response.blob();
  },

  downloadProjectsJson: async () => {
    const token = getStoredToken();
    const response = await fetch(buildUrl("/exports/projects.json"), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) throw new Error("Could not download JSON.");
    return response.json();
  },
};

export const usersAPI = {
  list: () => fetchAPI("/users"),
  me: () => fetchAPI("/users/me", { useCache: false }),

  updateRole: (id, role) =>
    fetchAPI(`/users/${id}/role`, {
      method: "PATCH",
      body: { role },
      useCache: false,
    }),

  updateProfile: (payload) =>
    fetchAPI("/users/me", {
      method: "PUT",
      body: payload,
      useCache: false,
    }),

  changePassword: (payload) =>
    fetchAPI("/users/change-password", {
      method: "POST",
      body: payload,
      useCache: false,
    }),

  deleteMe: (payload = { confirm: "DELETE" }) =>
    fetchAPI("/users/me", {
      method: "DELETE",
      body: payload,
      useCache: false,
    }),

  deleteUser: (userId) =>
    fetchAPI(`/admin/users/${userId}`, {
      method: "DELETE",
      useCache: false,
    }),
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
  update: (payload) =>
    fetchAPI("/organizations/me", {
      method: "PUT",
      body: payload,
      useCache: false,
    }),
  getSettings: () => fetchAPI("/organizations/settings"),
  updateSettings: (payload) =>
    fetchAPI("/organizations/settings", {
      method: "PUT",
      body: payload,
      useCache: false,
    }),
  delete: (orgId) =>
    fetchAPI(`/organizations/${orgId}`, {
      method: "DELETE",
      useCache: false,
    }),
  bulkDelete: (payload) =>
    fetchAPI("/organizations/bulk-delete", {
      method: "DELETE",
      body: payload,
      useCache: false,
    }),
  listAll: () => fetchAPI("/organizations/all", { useCache: false }),
};

export const agentAPI = {
  chat: (payload) =>
    fetchAPI("/agent/chat", {
      method: "POST",
      body: payload,
      useCache: false,
    }),
  summary: () => fetchAPI("/agent/workspace-summary", { useCache: false }),
  analyze: (projectId) => fetchAPI(`/agent/analyze/${projectId}`),
  recommend: () => fetchAPI("/agent/recommendations"),
};

export const adminAPI = {
  listUsers: () => fetchAPI("/admin/users", { useCache: false }),

  deleteUser: (userId) =>
    fetchAPI(`/admin/users/${userId}`, {
      method: "DELETE",
      useCache: false,
    }),

  deleteInvite: (inviteId) =>
    fetchAPI(`/admin/invites/${inviteId}`, {
      method: "DELETE",
      useCache: false,
    }),

  deleteMyAccount: async (payload = { confirm: "DELETE" }) => {
    try {
      return await fetchAPI("/users/me", {
        method: "DELETE",
        body: payload,
        useCache: false,
      });
    } catch (err) {
      return await fetchAPI("/admin/my-account", {
        method: "DELETE",
        body: payload,
        useCache: false,
      });
    }
  },
};

export const competitorsAPI = {
  getAll: async () => {
    try {
      const projects = await projectsAPI.getAll({ limit: 100 });
      return projects.filter(
        (p) => p.sector === "Competitor" || p.tags?.includes("competitor")
      );
    } catch (error) {
      console.warn("[API] Could not fetch competitors, returning empty array:", error);
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
  admin: adminAPI,
  competitors: competitorsAPI,

  setAuthToken: authAPI.setToken,
  getAuthToken: authAPI.getToken,
  isAuthenticated: authAPI.isAuthenticated,
  logout: authAPI.logout,
  clearCache,

  debug: () => {
    const token = getStoredToken();
    console.log("[API] Debug Info:", {
      API_BASE_URL,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + "..." : null,
      env: import.meta.env.MODE,
      cacheSize: cache.size,
    });
  },
};

console.log("[API] Service initialized with base URL:", API_BASE_URL);
console.log("[API] Token present:", !!getStoredToken());

export default api;