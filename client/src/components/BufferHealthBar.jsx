import React from 'react';

export default function BufferHealthBar({ health }) {
  const pct = health === 'Healthy' ? 90 : health === 'Warning' ? 50 : 15;
  return (
    <section className="panel">
      <h2>Buffer Health</h2>
      <div className="health-track"><div className={`health-fill ${health.toLowerCase()}`} style={{ width: `${pct}%` }} /></div>
      <p>{health}</p>
    </section>
  );
}
