import { useState, useEffect } from 'react';

export const useProjectUpdates = () => {
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(0);

  useEffect(() => {
    // Build WebSocket URL from current host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
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