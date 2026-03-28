import useWebSocket from 'react-use-websocket';

export const useProjectUpdates = () => {
  // Get backend URL from environment variable (e.g., set in Netlify)
  const backendUrl = import.meta.env.VITE_API_URL || '';
  // Build WebSocket URL: replace http/https with ws/wss and append /ws
  const wsUrl = backendUrl
    ? backendUrl.replace(/^http/, 'ws') + '/ws'
    : 'ws://localhost:8000/ws';

  const { lastMessage, readyState } = useWebSocket(wsUrl, {
    onOpen: () => console.log('WebSocket connected'),
    shouldReconnect: (closeEvent) => true,
    onError: (err) => console.error('WebSocket error:', err),
  });

  return { lastMessage, readyState };
};