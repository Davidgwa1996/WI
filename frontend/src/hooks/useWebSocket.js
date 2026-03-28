import useWebSocket from 'react-use-websocket';

export const useProjectUpdates = () => {
  // Use relative WebSocket path – Netlify will proxy it
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

  const { lastMessage, readyState } = useWebSocket(wsUrl, {
    onOpen: () => console.log('WebSocket connected'),
    shouldReconnect: (closeEvent) => true,
    onError: (err) => console.error('WebSocket error:', err),
  });

  return { lastMessage, readyState };
};