import React from 'react';

export default function AIEngineStatus({ status }) {
  const cls = status === 'Connected' || status === 'Generating' ? 'good' : status === 'Waiting' ? 'warn' : 'bad';
  return (
    <section className="panel">
      <h2>AI Engine</h2>
      <p className={`engine-status ${cls}`}>{status}</p>
    </section>
  );
}
