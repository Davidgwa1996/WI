// src/hooks/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export const useWebSocket = (path) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_URL}${path}`);
      
      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
      
      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
        // Attempt reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WebSocket] Attempting reconnect...');
          connect();
        }, 3000);
      };
      
      ws.onmessage = (event) => {
        console.log('[WebSocket] Message received:', event.data);
        setLastMessage(event.data);
      };
      
      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
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
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
};