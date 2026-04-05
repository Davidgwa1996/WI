import { useEffect, useRef, useState, useCallback } from "react";

// ------------------------------------------------------------
// Base WebSocket URL
// Recommended env:
// VITE_WS_URL=wss://wi-production-ae1c.up.railway.app/ws
// ------------------------------------------------------------
const RAW_WS_URL =
  import.meta.env.VITE_WS_URL ||
  "wss://wi-production-ae1c.up.railway.app/ws";

const BASE_WS_URL = RAW_WS_URL.replace(/\/+$/, "");

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const buildWsUrl = (path = "") => {
  if (!path || path === "/") return BASE_WS_URL;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // If BASE_WS_URL already ends with /ws, don't duplicate it
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

// ------------------------------------------------------------
// Main hook
// ------------------------------------------------------------
export const useWebSocket = (path = "") => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [lastJsonMessage, setLastJsonMessage] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const manuallyClosedRef = useRef(false);

  const connect = useCallback(() => {
    const url = buildWsUrl(path);

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("[WebSocket] Connected:", url);
        setIsConnected(true);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Match backend behavior: backend expects plain "ping"
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        const raw = event.data;
        const parsed = safeJsonParse(raw);

        console.log("[WebSocket] Message:", parsed);

        setLastMessage(raw);
        setLastJsonMessage(
          typeof parsed === "object" && parsed !== null
            ? parsed
            : { type: "raw", message: parsed }
        );
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
      };

      ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        setIsConnected(false);

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (!manuallyClosedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[WebSocket] Reconnecting...");
            connect();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("[WebSocket] Connection failed:", error);
    }
  }, [path]);

  useEffect(() => {
    manuallyClosedRef.current = false;
    connect();

    return () => {
      manuallyClosedRef.current = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[WebSocket] Not connected");
      return false;
    }

    try {
      const payload =
        typeof data === "string" ? data : JSON.stringify(data);
      wsRef.current.send(payload);
      return true;
    } catch (error) {
      console.error("[WebSocket] Send failed:", error);
      return false;
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    lastJsonMessage,
    sendMessage,
  };
};

// ------------------------------------------------------------
// Project updates
// Matches backend event shape:
// {
//   type: "full_update",
//   message: "...",
//   data: { project_id: 1, ... }
// }
// ------------------------------------------------------------
export const useProjectUpdates = (projectId) => {
  const [updates, setUpdates] = useState([]);
  const { isConnected, lastJsonMessage } = useWebSocket("/ws");

  useEffect(() => {
    if (!lastJsonMessage || !projectId) return;

    if (
      lastJsonMessage.type === "full_update" &&
      lastJsonMessage.data?.project_id === projectId
    ) {
      setUpdates((prev) => [lastJsonMessage, ...prev]);
    }
  }, [lastJsonMessage, projectId]);

  return { updates, isConnected };
};

// ------------------------------------------------------------
// Competitor updates
// Backend currently does not expose competitor websocket events.
// This is kept for future compatibility only.
// ------------------------------------------------------------
export const useCompetitorUpdates = () => {
  const [competitors, setCompetitors] = useState([]);
  const { isConnected, lastJsonMessage } = useWebSocket("/ws");

  useEffect(() => {
    if (!lastJsonMessage) return;

    if (lastJsonMessage.type === "competitor_update") {
      setCompetitors((prev) => [
        ...(lastJsonMessage.data ? [lastJsonMessage.data] : []),
        ...prev,
      ]);
    }
  }, [lastJsonMessage]);

  return { competitors, isConnected };
};

// ------------------------------------------------------------
// General dashboard stream
// Useful for dashboard pages handling all live event types
// ------------------------------------------------------------
export const useDashboardStream = () => {
  const [alerts, setAlerts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [projectEvents, setProjectEvents] = useState([]);

  const { isConnected, lastJsonMessage, sendMessage } = useWebSocket("/ws");

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
    sendMessage,
  };
};

export default useWebSocket;