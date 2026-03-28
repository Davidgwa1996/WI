// src/hooks/useWebSocket.js

import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (url = null) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(0); // 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Use environment variable if no URL provided, fallback to Railway backend
  const wsUrl = url || import.meta.env.VITE_WS_URL || 'wss://wi-production-ae1c.up.railway.app/ws';

  useEffect(() => {
    const connect = () => {
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setReadyState(ws.readyState);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          setLastMessage(data);
        } catch (e) {
          console.warn('Failed to parse WebSocket message:', event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setReadyState(ws.readyState);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        setReadyState(ws.readyState);

        // Attempt to reconnect after 3 seconds, unless closed intentionally
        if (!event.wasClean) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [wsUrl]);

  // Function to manually send messages
  const sendMessage = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not open. Cannot send message.');
    }
  };

  return { lastMessage, readyState, sendMessage };
};