import { useEffect, useRef, useState, useCallback } from "react";

// ------------------------------------------------------------
// Base WebSocket URL
// Recommended env:
// VITE_WS_URL=wss://wi-production-ae1c.up.railway.app/ws
// ------------------------------------------------------------
const RAW_WS_URL =
  import.meta.env.VITE_WS_URL ||
  "wss://wi-production-ae1c.up.railway.app/ws";

const BASE_WS_URL = String(RAW_WS_URL || "").replace(/\/+$/, "");

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const normalizePath = (path = "") => {
  if (!path || path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
};

const buildWsUrl = (path = "") => {
  const cleanPath = normalizePath(path);

  if (!cleanPath) {
    return BASE_WS_URL;
  }

  if (BASE_WS_URL.endsWith(cleanPath)) {
    return BASE_WS_URL;
  }

  if (BASE_WS_URL.endsWith("/ws") && cleanPath === "/ws") {
    return BASE_WS_URL;
  }

  return `${BASE_WS_URL}${cleanPath}`;
};

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const getStoredToken = () => {
  return (
    localStorage.getItem("w3i_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
};

// ------------------------------------------------------------
// Main hook
// ------------------------------------------------------------
export const useWebSocket = (path = "", options = {}) => {
  const {
    enabled = true,
    reconnect = true,
    reconnectDelay = 3000,
    pingInterval = 25000,
    debug = false,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [lastJsonMessage, setLastJsonMessage] = useState(null);
  const [connectionError, setConnectionError] = useState("");

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const manuallyClosedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  const clearReconnectTimer = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const clearPingTimer = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  const closeSocket = useCallback(() => {
    clearReconnectTimer();
    clearPingTimer();

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (error) {
        if (debug) {
          console.warn("[WebSocket] Close warning:", error);
        }
      }
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [debug]);

  const connect = useCallback(() => {
    if (!enabled || !BASE_WS_URL) {
      return;
    }

    const url = buildWsUrl(path);

    if (!url) {
      setConnectionError("WebSocket URL is not configured.");
      return;
    }

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      manuallyClosedRef.current = false;
      clearReconnectTimer();

      const token = getStoredToken();

      // Future-friendly token support if backend later reads query params.
      const finalUrl =
        token && !url.includes("token=")
          ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
          : url;

      if (debug) {
        console.log("[WebSocket] Connecting:", finalUrl);
      }

      const ws = new WebSocket(finalUrl);

      ws.onopen = () => {
        if (debug) {
          console.log("[WebSocket] Connected:", finalUrl);
        }

        reconnectAttemptsRef.current = 0;
        setConnectionError("");
        setIsConnected(true);

        clearReconnectTimer();
        clearPingTimer();

        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, pingInterval);
      };

      ws.onmessage = (event) => {
        const raw = event.data;
        const parsed = safeJsonParse(raw);

        if (debug) {
          console.log("[WebSocket] Message:", parsed);
        }

        setLastMessage(raw);
        setLastJsonMessage(
          typeof parsed === "object" && parsed !== null
            ? parsed
            : { type: "raw", message: parsed }
        );
      };

      ws.onerror = () => {
        if (debug) {
          console.warn("[WebSocket] Connection error");
        }
      };

      ws.onclose = (event) => {
        if (debug) {
          console.log("[WebSocket] Disconnected:", event.code, event.reason || "");
        }

        setIsConnected(false);
        clearPingTimer();

        if (manuallyClosedRef.current || !enabled || !reconnect) {
          return;
        }

        reconnectAttemptsRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      };

      wsRef.current = ws;
    } catch (error) {
      setConnectionError(error?.message || "WebSocket connection failed");

      if (debug) {
        console.error("[WebSocket] Connection failed:", error);
      }
    }
  }, [enabled, path, reconnect, reconnectDelay, pingInterval, debug]);

  useEffect(() => {
    if (!enabled) {
      manuallyClosedRef.current = true;
      closeSocket();
      return;
    }

    connect();

    return () => {
      manuallyClosedRef.current = true;
      closeSocket();
    };
  }, [enabled, connect, closeSocket]);

  const sendMessage = useCallback(
    (data) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        if (debug) {
          console.warn("[WebSocket] Not connected");
        }
        return false;
      }

      try {
        const payload = typeof data === "string" ? data : JSON.stringify(data);
        wsRef.current.send(payload);
        return true;
      } catch (error) {
        if (debug) {
          console.error("[WebSocket] Send failed:", error);
        }
        return false;
      }
    },
    [debug]
  );

  return {
    isConnected,
    lastMessage,
    lastJsonMessage,
    connectionError,
    sendMessage,
  };
};

// ------------------------------------------------------------
// Project updates
// ------------------------------------------------------------
export const useProjectUpdates = (projectId, options = {}) => {
  const [updates, setUpdates] = useState([]);
  const { isConnected, lastJsonMessage, connectionError } = useWebSocket("/ws", options);

  useEffect(() => {
    if (!lastJsonMessage || !projectId) return;

    if (
      lastJsonMessage.type === "full_update" &&
      Number(lastJsonMessage.data?.project_id) === Number(projectId)
    ) {
      setUpdates((prev) => [lastJsonMessage, ...prev].slice(0, 30));
    }
  }, [lastJsonMessage, projectId]);

  return { updates, isConnected, connectionError };
};

// ------------------------------------------------------------
// Competitor updates
// ------------------------------------------------------------
export const useCompetitorUpdates = (options = {}) => {
  const [competitors, setCompetitors] = useState([]);
  const { isConnected, lastJsonMessage, connectionError } = useWebSocket("/ws", options);

  useEffect(() => {
    if (!lastJsonMessage) return;

    if (lastJsonMessage.type === "competitor_update") {
      setCompetitors((prev) => {
        const next = lastJsonMessage.data ? [lastJsonMessage.data, ...prev] : prev;
        return next.slice(0, 30);
      });
    }
  }, [lastJsonMessage]);

  return { competitors, isConnected, connectionError };
};

// ------------------------------------------------------------
// General dashboard stream
// ------------------------------------------------------------
export const useDashboardStream = (options = {}) => {
  const [alerts, setAlerts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [projectEvents, setProjectEvents] = useState([]);

  const {
    isConnected,
    lastJsonMessage,
    sendMessage,
    connectionError,
  } = useWebSocket("/ws", options);

  useEffect(() => {
    if (!lastJsonMessage) return;

    switch (lastJsonMessage.type) {
      case "full_update":
        setProjectEvents((prev) => [lastJsonMessage, ...prev].slice(0, 20));
        if (lastJsonMessage.message) {
          setAlerts((prev) => [lastJsonMessage.message, ...prev].slice(0, 20));
        }
        break;

      case "anomaly":
        if (lastJsonMessage.message) {
          setAlerts((prev) => [lastJsonMessage.message, ...prev].slice(0, 20));
        }
        break;

      case "ai_alert":
        if (lastJsonMessage.message) {
          setInsights((prev) => [lastJsonMessage.message, ...prev].slice(0, 20));
        }
        break;

      default:
        break;
    }
  }, [lastJsonMessage]);

  return {
    isConnected,
    lastJsonMessage,
    alerts,
    insights,
    projectEvents,
    connectionError,
    sendMessage,
  };
};

export default useWebSocket;