const WS_URL = 'ws://localhost:8000/ws/session/demo-session';

let socket = null;
let status = 'offline';
let statusListener = null;
let messageListener = null;

function readyStateLabel(readyState) {
  if (readyState === WebSocket.CONNECTING) return 'CONNECTING';
  if (readyState === WebSocket.OPEN) return 'OPEN';
  if (readyState === WebSocket.CLOSING) return 'CLOSING';
  if (readyState === WebSocket.CLOSED) return 'CLOSED';
  return 'UNKNOWN';
}

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
    console.log('[AI Engine WS] Reusing existing socket. readyState=', readyStateLabel(socket.readyState));
    return;
  }

  const wsUrl = normalizeWsUrl(url);
  console.log('[AI Engine WS] Connection attempt URL:', wsUrl);
  setStatus('connecting');

  try {
    socket = new WebSocket(wsUrl);
  } catch (error) {
    console.error('[AI Engine WS] Failed to create socket:', error);
    setStatus('error');
    return;
  }

  socket.onopen = () => {
    console.log('AI Engine WebSocket opened');
    setStatus('connected');
  };

  socket.onmessage = (event) => {
    console.log('[AI Engine WS] onmessage raw:', event.data);
    try {
      const parsed = JSON.parse(event.data);
      console.log('[AI Engine WS] onmessage parsed:', parsed);
      messageListener?.(parsed);
    } catch (error) {
      console.error('[AI Engine WS] Failed to parse message:', error);
    }
  };

  socket.onerror = (event) => {
    console.error('[AI Engine WS] onerror:', event);
    setStatus('error');
  };

  socket.onclose = (event) => {
    console.log('[AI Engine WS] onclose:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
    setStatus('offline');
    socket = null;
  };
}

export function sendToAIEngine(message) {
  if (!socket) {
    console.warn('[AI Engine WS] sendToAIEngine failed: socket does not exist');
    return false;
  }

  if (socket.readyState !== WebSocket.OPEN) {
    console.warn(
      '[AI Engine WS] sendToAIEngine failed: socket not OPEN. readyState=',
      readyStateLabel(socket.readyState)
    );
    return false;
  }

  try {
    socket.send(JSON.stringify(message));
    console.log('[AI Engine WS] sendToAIEngine success:', message);
    return true;
  } catch (error) {
    console.error('[AI Engine WS] sendToAIEngine failed:', error);
    return false;
  }
}

export function disconnectAIEngine() {
  if (socket) {
    console.log('[AI Engine WS] Closing socket. readyState=', readyStateLabel(socket.readyState));
    socket.close();
    socket = null;
  }
  setStatus('offline');
}

export function getAIEngineStatus() {
  return status;
}
