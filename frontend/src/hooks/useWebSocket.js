// src/hooks/useWebSocket.js

import { useEffect, useRef, useState, useCallback } from 'react';

// ✅ FIXED: Use Railway WebSocket URL
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  'wss://wi-production-ae1c.up.railway.app';

export const useWebSocket = (path) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    // Prevent duplicate connections
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_URL}${path}`);

      ws.onopen = () => {
        console.log('[WebSocket] Connected:', `${WS_URL}${path}`);
        setIsConnected(true);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);

        // reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WebSocket] Reconnecting...');
          connect();
        }, 3000);
      };

      ws.onmessage = (event) => {
        console.log('[WebSocket] Message:', event.data);
        setLastMessage(event.data);
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
    }
  }, [path]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Not connected');
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
};

// ------------------------------------------------------------
// Project updates
// ------------------------------------------------------------
export const useProjectUpdates = (projectId) => {
  const [updates, setUpdates] = useState([]);
  const { isConnected, lastMessage } = useWebSocket('/ws');

  useEffect(() => {
    if (lastMessage && projectId) {
      try {
        const data = JSON.parse(lastMessage);

        if (data.projectId === projectId) {
          setUpdates((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    }
  }, [lastMessage, projectId]);

  return { updates, isConnected };
};

// ------------------------------------------------------------
// Competitor updates
// ------------------------------------------------------------
export const useCompetitorUpdates = () => {
  const [competitors, setCompetitors] = useState([]);
  const { isConnected, lastMessage } = useWebSocket('/ws'); // ✅ FIXED (NOT /competitors)

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);

        if (data.type === 'competitor_update') {
          setCompetitors((prev) => [...prev, data.competitor]);
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    }
  }, [lastMessage]);

  return { competitors, isConnected };
};

export default useWebSocket;