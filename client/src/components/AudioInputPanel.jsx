import React from 'react';

export default function AudioInputPanel({
  devices,
  selectedDeviceId,
  audioStatus,
  monitoring,
  gain,
  level,
  onSelectDevice,
  onRefresh,
  onStart,
  onStop,
  onMonitoring,
  onGain,
}) {
  const signalLabel = level < 0.08 ? 'Low signal' : level > 0.85 ? 'Clipping risk' : 'Signal healthy';

  return (
    <section className="panel">
      <h2>Audio Input</h2>
      <label>Audio Device
        <select value={selectedDeviceId} onChange={(e) => onSelectDevice(e.target.value)}>
          <option value="">Default Input</option>
          {devices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Unnamed Audio Input'}</option>)}
        </select>
      </label>
      <div className="row wrap">
        <button className="btn secondary" onClick={onRefresh}>Refresh Devices</button>
        <button className="btn" onClick={onStart}>Start Audio Input</button>
        <button className="btn secondary" onClick={onStop}>Stop Audio Input</button>
      </div>
      <label className="toggle"><input type="checkbox" checked={monitoring} onChange={onMonitoring} />Input monitoring</label>
      <p className="small">Use headphones when input monitoring is enabled.</p>
      <label>Input Gain: {gain.toFixed(2)}
        <input type="range" min="0" max="2" step="0.01" value={gain} onChange={(e) => onGain(Number(e.target.value))} />
      </label>
      <div className="level-meter">
        <div className="level-fill" style={{ width: `${Math.round(level * 100)}%` }} />
      </div>
      <p className="small">Level: {Math.round(level * 100)}% · {signalLabel}</p>
      <p className="small">Status: {audioStatus}</p>
    </section>
  );
}
