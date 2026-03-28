import useWebSocket from 'react-use-websocket';

export const useProjectUpdates = () => {
  // Build WebSocket URL from current host (Netlify will proxy)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  const { lastMessage, readyState } = useWebSocket(wsUrl, {
    onOpen: () => console.log('WebSocket connected'),
    shouldReconnect: (closeEvent) => true,
    onError: (err) => console.error('WebSocket error:', err),
  });

  return { lastMessage, readyState };
};