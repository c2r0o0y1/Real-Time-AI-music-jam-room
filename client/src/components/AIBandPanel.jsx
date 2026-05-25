import React from 'react';

export default function AIBandPanel({ channels, onUpdateChannel }) {
  return (
    <section className="panel">
      <h2>AI Band Setup</h2>
      {Object.entries(channels).map(([key, ch]) => (
        <div className="channel-card" key={key}>
          <div className="channel-head">
            <strong>{ch.label}</strong>
            <span className={`tiny ${ch.enabled ? 'on' : 'off'}`}>{ch.enabled ? 'Enabled' : 'Off'}</span>
          </div>
          <div className="channel-controls">
            <label className="toggle"><input type="checkbox" checked={ch.enabled} onChange={() => onUpdateChannel(key, { enabled: !ch.enabled })} />Enable</label>
            <label className="toggle"><input type="checkbox" checked={ch.muted} onChange={() => onUpdateChannel(key, { muted: !ch.muted })} />Mute</label>
            <label className="toggle"><input type="checkbox" checked={ch.solo} onChange={() => onUpdateChannel(key, { solo: !ch.solo })} />Solo</label>
          </div>
          <label>Volume {Math.round(ch.volume * 100)}%
            <input type="range" min="0" max="1" step="0.01" value={ch.volume} onChange={(e) => onUpdateChannel(key, { volume: Number(e.target.value) })} />
          </label>
          <div className="channel-meta">Status: {ch.status} | Clips: {ch.clipCount}</div>
        </div>
      ))}
    </section>
  );
}
