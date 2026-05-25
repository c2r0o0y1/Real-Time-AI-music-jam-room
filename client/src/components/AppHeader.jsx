import React from 'react';

function badgeClass(kind) {
  if (kind === 'good') return 'chip good';
  if (kind === 'warn') return 'chip warn';
  return 'chip bad';
}

export default function AppHeader({ sessionMode, midiStatus, latencyMs, bufferHealth, aiEngineStatus, onToggleSettings }) {
  const sessionLabel = {
    stopped: 'Stopped',
    playing: 'Playing',
    recording: 'Recording',
    demo: 'Demo Jam',
  }[sessionMode] || 'Stopped';

  const midiGood = midiStatus.startsWith('Connected');
  const bufferKind = bufferHealth === 'Healthy' ? 'good' : bufferHealth === 'Warning' ? 'warn' : 'bad';
  const aiKind = aiEngineStatus === 'Connected' || aiEngineStatus === 'Generating' ? 'good' : aiEngineStatus === 'Waiting' ? 'warn' : 'bad';

  return (
    <header className="app-header">
      <div>
        <h1>Real-Time AI Accompaniment</h1>
        <p className="subtitle">Session Ready for Live Jamming</p>
      </div>
      <div className="header-chips">
        <span className={badgeClass(sessionMode === 'stopped' ? 'warn' : 'good')}>Session: {sessionLabel}</span>
        <span className={badgeClass(midiGood ? 'good' : 'bad')}>MIDI: {midiGood ? 'Connected' : 'Not Connected'}</span>
        <span className={badgeClass(latencyMs !== null && latencyMs < 90 ? 'good' : 'warn')}>Latency: {latencyMs ?? '--'} ms</span>
        <span className={badgeClass(bufferKind)}>Buffer: {bufferHealth}</span>
        <span className={badgeClass(aiKind)}>AI Engine: {aiEngineStatus}</span>
        <button className="btn ghost" onClick={onToggleSettings}>Settings</button>
      </div>
    </header>
  );
}
