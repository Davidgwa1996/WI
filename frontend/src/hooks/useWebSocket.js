import { useState, useEffect } from 'react';

export const useProjectUpdates = () => {
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(0);

  useEffect(() => {
    // Use environment variable if defined, otherwise default to Railway backend
    const wsUrl = process.env.REACT_APP_WS_URL || 'wss://wi-production-ae1c.up.railway.app/ws';
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setReadyState(1); // OPEN
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
      setReadyState(3); // CLOSED
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setReadyState(3); // CLOSED
    };

    return () => {
      ws.close();
    };
  }, []);

  return { lastMessage, readyState };
};