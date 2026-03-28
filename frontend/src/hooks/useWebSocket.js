import { useEffect, useState } from 'react';

export const useProjectUpdates = () => {
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(0);

  useEffect(() => {
    // Dynamically import react-use-websocket only if available
    import('react-use-websocket').then((module) => {
      const useWebSocket = module.default;
      const ws = useWebSocket('ws://localhost:8000/ws', {
        onOpen: () => console.log('WebSocket connected'),
        shouldReconnect: (closeEvent) => true,
        onMessage: (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
          } catch (e) {
            console.warn('Received non-JSON message:', event.data);
          }
        }
      });
      setReadyState(ws.readyState);
      // Store the ws instance to clean up later
      return ws;
    }).catch(err => {
      console.error('Failed to load react-use-websocket:', err);
    });
  }, []);

  return { lastMessage, readyState };
};
