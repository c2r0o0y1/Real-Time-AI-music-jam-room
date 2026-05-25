import React from 'react';

function statusClass(status) {
  if (status === 'connected' || status.startsWith('Connected')) return 'badge green';
  if (status === 'connecting') return 'badge yellow';
  if (status === 'error' || status === 'disconnected' || status.startsWith('Failed')) return 'badge red';
  return 'badge yellow';
}

export default function Header({ wsStatus, midiStatus }) {
  return (
    <header className="top-header panel">
      <h1>Real-Time AI Accompaniment</h1>
      <div className="badges">
        <span className={statusClass(wsStatus)}>WS: {wsStatus}</span>
        <span className={statusClass(midiStatus)}>MIDI: {midiStatus}</span>
      </div>
    </header>
  );
}
