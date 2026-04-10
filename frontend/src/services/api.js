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
  
  // Force HTTPS for Railway production URLs
  if (trimmed.includes("wi-production-ae1c.up.railway.app")) {
    const httpsUrl = trimmed.replace(/^http:\/\//i, "https://");
    if (httpsUrl !== trimmed) {
      console.log('[API] Forced HTTPS for Railway URL:', httpsUrl);
    }
    return httpsUrl;
  }
  
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
// Simple Cache for GET requests
// ============================================
const cache = new Map();
const CACHE_TTL = 60000; // 60 seconds

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[API] Cache hit for:', key);
    return cached.data;
  }
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
  // Clean up old cache entries
  setTimeout(() => cache.delete(key), CACHE_TTL);
};

const clearCache = () => {
  cache.clear();
  console.log('[API] Cache cleared');
};

// ============================================
// Retry logic for failed requests
// ============================================
const retryRequest = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`[API] Retry ${i + 1}/${retries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// ============================================
// Helper Functions
// ============================================

const buildUrl = (endpoint = "") => {
  // Ensure endpoint starts with /
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  // Remove trailing slash
  cleanEndpoint = cleanEndpoint.replace(/\/+$/, "");
  const fullUrl = `${API_BASE_URL}${cleanEndpoint}`;
  console.log(`[API] Request URL: ${fullUrl}`);
  return fullUrl;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    console.log('[API] Using auth token:', token.substring(0, 20) + '...');
    return { Authorization: `Bearer ${token}` };
  }
  console.warn('[API] No auth token found');
  return {};
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
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
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
// Main Fetch Function with Cache & Retry
// ============================================

const fetchAPI = async (endpoint, options = {}) => {
  const method = options.method || "GET";
  const useCache = options.useCache !== false && method === "GET";
  const cacheKey = `${method}:${endpoint}:${JSON.stringify(options.body || {})}`;
  
  // Check cache for GET requests
  if (useCache) {
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);

  try {
    const url = buildUrl(endpoint);
    
    console.log(`[API] ${method} ${url}`);
    
    const response = await retryRequest(async () => {
      const headers = {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...getAuthHeaders(),
        ...(options.headers || {}),
      };
      
      console.log(`[API] Request headers:`, Object.keys(headers));
      
      return await fetch(url, {
        method: method,
        headers: headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    }, options.retries || 2, options.retryDelay || 500);

    clearTimeout(timeout);
    const result = await handleResponse(response);
    
    // Cache successful GET responses
    if (useCache && response.ok) {
      setCache(cacheKey, result);
    }
    
    return result;
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
  register: (payload) => fetchAPI("/auth/register", { method: "POST", body: payload, useCache: false }),
  login: async (payload) => {
    const result = await fetchAPI("/auth/login", { method: "POST", body: payload, useCache: false });
    if (result && result.access_token) {
      localStorage.setItem(TOKEN_KEY, result.access_token);
      console.log('[API] Token saved after login');
    }
    return result;
  },
  me: () => fetchAPI("/users/me", { useCache: false }),
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    clearCache();
    console.log('[API] User logged out');
  },
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('[API] Token saved');
  },
  getToken: () => localStorage.getItem(TOKEN_KEY),
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token && token.length > 0;
  },
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
    console.log('[API] Fetching projects with params:', params);
    return fetchAPI(`/projects${qs ? `?${qs}` : ""}`, options);
  },

  getSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set("skip", params.skip);
    if (params.limit !== undefined) query.set("limit", params.limit);

    const qs = query.toString();
    return fetchAPI(`/projects/summary${qs ? `?${qs}` : ""}`);
  },

  getById: (id, options = {}) => {
    console.log(`[API] Fetching project ${id}`);
    return fetchAPI(`/projects/${id}`, options);
  },
  
  refresh: () => fetchAPI("/projects/refresh", { method: "POST", useCache: false }),
  
  create: (payload) => fetchAPI("/projects", { method: "POST", body: payload, useCache: false }),
  
  update: (id, payload) => fetchAPI(`/projects/${id}`, { method: "PUT", body: payload, useCache: false }),
  
  delete: (id) => fetchAPI(`/projects/${id}`, { method: "DELETE", useCache: false }),
  
  // Clear projects cache
  clearCache: () => {
    for (const key of cache.keys()) {
      if (key.includes("/projects")) {
        cache.delete(key);
      }
    }
    console.log('[API] Projects cache cleared');
  },
};

export const workspaceAPI = {
  getSettings: () => fetchAPI("/workspace/settings"),
  updateSettings: (payload) =>
    fetchAPI("/workspace/settings", { method: "PUT", body: payload, useCache: false }),
};

export const invitesAPI = {
  list: () => fetchAPI("/invites", { useCache: false }),
  create: async (payload) => {
    console.log('[API] Creating invite with payload:', payload);
    try {
      const result = await fetchAPI("/invites", { 
        method: "POST", 
        body: payload, 
        useCache: false 
      });
      console.log('[API] Invite created successfully:', result);
      return result;
    } catch (error) {
      console.error('[API] Failed to create invite:', error);
      throw error;
    }
  },
  accept: (payload) => fetchAPI("/invites/accept", { method: "POST", body: payload, useCache: false }),
  resend: (inviteId) => fetchAPI(`/invites/${inviteId}/resend`, { method: "POST", useCache: false }),
  cancel: (inviteId) => fetchAPI(`/invites/${inviteId}`, { method: "DELETE", useCache: false }),
  check: (token) => fetchAPI(`/invites/check/${token}`, { useCache: false }),
  getStats: () => fetchAPI("/invites/stats", { useCache: false }),
  getConfigStatus: () => fetchAPI("/invites/config/status", { useCache: false }),
};

export const apiKeysAPI = {
  list: () => fetchAPI("/api-keys"),
  create: (payload) => fetchAPI("/api-keys", { method: "POST", body: payload, useCache: false }),
  revoke: (id) => fetchAPI(`/api-keys/${id}`, { method: "DELETE", useCache: false }),
};

export const billingAPI = {
  status: () => fetchAPI("/subscriptions/status"),
  checkout: (payload) => fetchAPI("/billing/checkout", { method: "POST", body: payload, useCache: false }),
  portal: (payload) => fetchAPI("/billing/portal", { method: "POST", body: payload, useCache: false }),
};

export const watchlistsAPI = {
  list: () => fetchAPI("/watchlists"),
  getById: (id) => fetchAPI(`/watchlists/${id}`),
  create: (payload) => fetchAPI("/watchlists", { method: "POST", body: payload, useCache: false }),
  update: (id, payload) => fetchAPI(`/watchlists/${id}`, { method: "PUT", body: payload, useCache: false }),
  delete: (id) => fetchAPI(`/watchlists/${id}`, { method: "DELETE", useCache: false }),
  addItem: (watchlistId, payload) =>
    fetchAPI(`/watchlists/${watchlistId}/items`, { method: "POST", body: payload, useCache: false }),
  removeItem: (watchlistId, projectId) =>
    fetchAPI(`/watchlists/${watchlistId}/items/${projectId}`, { method: "DELETE", useCache: false }),
  getItems: (watchlistId) => fetchAPI(`/watchlists/${watchlistId}/items`),
  getLiveMetrics: (watchlistId) => fetchAPI(`/watchlists/${watchlistId}/live`, { useCache: false }),
  getChanges: (watchlistId, hours = 24) => fetchAPI(`/watchlists/${watchlistId}/changes?hours=${hours}`),
  getAlerts: (watchlistId) => fetchAPI(`/watchlists/${watchlistId}/alerts`),
  getSummary: () => fetchAPI("/watchlists/summary/all"),
};

export const reportsAPI = {
  list: () => fetchAPI("/reports"),
  create: (payload) => fetchAPI("/reports", { method: "POST", body: payload, useCache: false }),
  getById: (id) => fetchAPI(`/reports/${id}`),
  delete: (id) => fetchAPI(`/reports/${id}`, { method: "DELETE", useCache: false }),
};

export const briefingsAPI = {
  list: () => fetchAPI("/briefings"),
  getById: (id) => fetchAPI(`/briefings/${id}`),
  create: (payload) => fetchAPI("/briefings", { method: "POST", body: payload, useCache: false }),
  sendEmail: () => fetchAPI("/briefings/send", { method: "POST", useCache: false }),
  generate: () => fetchAPI("/briefings/generate", { method: "POST", useCache: false }),
};

export const searchAPI = {
  intel: (q) => fetchAPI(`/search/intel?q=${encodeURIComponent(q)}`),
  google: (q) => fetchAPI(`/search/google?q=${encodeURIComponent(q)}`),
  projects: (q) => fetchAPI(`/search/projects?q=${encodeURIComponent(q)}`),
};

export const exportsAPI = {
  downloadProjectsCsv: async () => {
    console.log('[API] Downloading projects CSV');
    const token = localStorage.getItem(TOKEN_KEY);
    const response = await fetch(buildUrl("/exports/projects.csv"), {
      headers: { 
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error("Could not download CSV.");
    }

    return response.blob();
  },

  downloadReportPdf: async (reportId) => {
    console.log(`[API] Downloading report PDF: ${reportId}`);
    const token = localStorage.getItem(TOKEN_KEY);
    const response = await fetch(buildUrl(`/exports/report.pdf?report_id=${reportId}`), {
      headers: { 
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error("Could not download PDF.");
    }

    return response.blob();
  },
  
  downloadProjectsJson: async () => {
    console.log('[API] Downloading projects JSON');
    const token = localStorage.getItem(TOKEN_KEY);
    const response = await fetch(buildUrl("/exports/projects.json"), {
      headers: { 
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error("Could not download JSON.");
    }

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
    fetchAPI("/users/me", { method: "PUT", body: payload, useCache: false }),
  changePassword: (payload) =>
    fetchAPI("/users/change-password", { method: "POST", body: payload, useCache: false }),
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
  update: (payload) => fetchAPI("/organizations/me", { method: "PUT", body: payload, useCache: false }),
  getSettings: () => fetchAPI("/organizations/settings"),
  updateSettings: (payload) => fetchAPI("/organizations/settings", { method: "PUT", body: payload, useCache: false }),
};

export const agentAPI = {
  chat: (payload) => fetchAPI("/agent/chat", { method: "POST", body: payload, useCache: false }),
  summary: () => fetchAPI("/agent/workspace-summary", { useCache: false }),
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
      const projects = await projectsAPI.getAll({ limit: 100 });
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
  clearCache: clearCache,
  
  // Debug method
  debug: () => {
    console.log('[API] Debug Info:', {
      API_BASE_URL,
      TOKEN_KEY,
      hasToken: !!localStorage.getItem(TOKEN_KEY),
      tokenPreview: localStorage.getItem(TOKEN_KEY) ? localStorage.getItem(TOKEN_KEY).substring(0, 20) + '...' : null,
      env: import.meta.env.MODE,
      cacheSize: cache.size,
    });
  },
};

// Log initialization
console.log('[API] Service initialized with base URL:', API_BASE_URL);
console.log('[API] Token present:', !!localStorage.getItem(TOKEN_KEY));

export default api;