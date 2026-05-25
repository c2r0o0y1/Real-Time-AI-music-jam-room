import React from 'react';

function pretty(ev) {
  const time = new Date(ev.timestamp || Date.now()).toLocaleTimeString();
  if (ev.type === 'bass_note') return `${time} | bass_note n=${ev.note} v=${ev.velocity} d=${ev.duration_ms}ms`;
  return `${time} | ${ev.type} n=${ev.note} v=${ev.velocity}`;
}

export default function EventLog({ title, events }) {
  return (
    <section className="panel event-log">
      <h2>{title}</h2>
      <ul>
        {events.length === 0 ? <li>No events yet.</li> : events.map((ev, idx) => <li key={`${ev.timestamp}-${idx}`}>{pretty(ev)}</li>)}
      </ul>
    </section>
  );
}
