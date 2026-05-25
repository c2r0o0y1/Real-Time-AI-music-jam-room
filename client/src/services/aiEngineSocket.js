const WS_URL = import.meta.env.VITE_API_WS_URL || 'ws://localhost:8000/ws/session/demo-session';

let socket = null;
let status = 'offline';
let statusListener = null;

function setStatus(nextStatus) {
  status = nextStatus;
  statusListener?.(status);
}

export function subscribeAIEngineStatus(listener) {
  statusListener = listener;
  listener?.(status);
  return () => {
    if (statusListener === listener) statusListener = null;
  };
}

export function connectAIEngine(url = WS_URL) {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  setStatus('connecting');

  try {
    socket = new WebSocket(url);
  } catch {
    setStatus('error');
    return;
  }

  socket.onopen = () => setStatus('connected');
  socket.onclose = () => setStatus('offline');
  socket.onerror = () => setStatus('error');
}

export function sendToAIEngine(message) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  socket.send(JSON.stringify(message));
  return true;
}

export function disconnectAIEngine() {
  if (socket) {
    socket.close();
    socket = null;
  }
  setStatus('offline');
}

export function getAIEngineStatus() {
  return status;
}
