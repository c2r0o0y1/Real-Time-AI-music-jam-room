import React from 'react';

export default function ConnectionPanel({ wsUrl, wsStatus, onWsUrlChange, onConnectWs, onDisconnectWs }) {
  return (
    <section className="panel">
      <h2>WebSocket</h2>
      <label>WebSocket URL
        <input value={wsUrl} onChange={(e) => onWsUrlChange(e.target.value)} placeholder="ws://localhost:8000/ws/test-session" />
      </label>
      <p>Status: <strong>{wsStatus}</strong></p>
      <div className="row">
        <button onClick={onConnectWs} className="btn full">Connect</button>
      </div>
      <div className="row">
        <button onClick={onDisconnectWs} className="btn secondary full">Disconnect</button>
      </div>
    </section>
  );
}
