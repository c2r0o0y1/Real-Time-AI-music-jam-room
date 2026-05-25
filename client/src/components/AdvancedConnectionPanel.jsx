import React from 'react';

export default function AdvancedConnectionPanel({ open, wsUrl, wsStatus, onWsUrl, onConnect, onDisconnect, onToggle, onTestBass }) {
  return (
    <section className="panel advanced">
      <div className="row between">
        <h2>Advanced Connection Settings</h2>
        <button className="btn ghost" onClick={onToggle}>{open ? 'Hide' : 'Show'}</button>
      </div>
      {open ? (
        <>
          <label>WebSocket URL<input value={wsUrl} onChange={(e) => onWsUrl(e.target.value)} /></label>
          <p className="small">Raw Connection: {wsStatus}</p>
          <div className="row">
            <button className="btn" onClick={onConnect}>Connect</button>
            <button className="btn secondary" onClick={onDisconnect}>Disconnect</button>
            <button className="btn secondary" onClick={onTestBass}>Audio Test</button>
          </div>
        </>
      ) : null}
    </section>
  );
}
