const WS_URL = 'ws://localhost:8000/ws/session/demo-session';

let socket = null;
let status = 'offline';
let statusListener = null;
let messageListener = null;

function normalizeWsUrl(url) {
  if (!url || typeof url !== 'string') return WS_URL;
  if (url.startsWith('http://')) return `ws://${url.slice('http://'.length)}`;
  if (url.startsWith('https://')) return `wss://${url.slice('https://'.length)}`;
  return url;
}

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

export function subscribeAIEngineMessages(listener) {
  messageListener = listener;
  return () => {
    if (messageListener === listener) messageListener = null;
  };
}

export function connectAIEngine(url = WS_URL) {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const wsUrl = normalizeWsUrl(url);
  setStatus('connecting');

  try {
    socket = new WebSocket(wsUrl);
  } catch {
    setStatus('error');
    return;
  }

  socket.onopen = () => {
    setStatus('connected');
  };

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      messageListener?.(parsed);
    } catch {
      // Ignore malformed payloads.
    }
  };

  socket.onerror = () => {
    setStatus('error');
  };

  socket.onclose = () => {
    setStatus('offline');
    socket = null;
  };
}

export function sendToAIEngine(message) {
  if (!socket) {
    return false;
  }

  if (socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  try {
    socket.send(JSON.stringify(message));
    return true;
  } catch {
    return false;
  }
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
