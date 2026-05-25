const DEFAULT_WS_URL = import.meta.env.VITE_API_WS_URL || 'ws://localhost:8000/ws/session/demo-session';

export function createSocket({ url = DEFAULT_WS_URL, onMessage, onStatusChange } = {}) {
  let socket = null;
  let currentUrl = url;

  const setStatus = (status) => onStatusChange?.(status);

  const connect = (nextUrl) => {
    if (nextUrl) currentUrl = nextUrl;

    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus('connecting');

    try {
      socket = new WebSocket(currentUrl);
    } catch {
      setStatus('error');
      return;
    }

    socket.onopen = () => setStatus('connected');
    socket.onclose = () => setStatus('disconnected');
    socket.onerror = () => setStatus('error');
    socket.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      onMessage?.(message);
    };
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
      socket = null;
    }
    setStatus('disconnected');
  };

  const sendJson = (payload) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  };

  const isConnected = () => Boolean(socket && socket.readyState === WebSocket.OPEN);

  return {
    connect,
    disconnect,
    sendJson,
    isConnected,
    getUrl: () => currentUrl,
  };
}
