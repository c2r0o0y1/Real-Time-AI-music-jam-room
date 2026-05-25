import React from 'react';
import { midiNoteToName } from '../musicTheory';

function laneEvents(events, lane) {
  return events.filter((e) => e.lane === lane);
}

function noteLabel(e) {
  const ts = new Date(e.timestamp || Date.now()).toLocaleTimeString();
  return `${midiNoteToName(e.note)} · ${e.source} · ${e.instrument} · ${ts}`;
}

export default function PianoRoll({ events }) {
  const user = laneEvents(events, 'user');
  const ai = laneEvents(events, 'ai');

  return (
    <section className="panel piano-roll">
      <h2>Piano Roll</h2>
      <div className="lane">
        <span className="lane-title">User Input</span>
        <div className="lane-track">
          {user.length === 0 ? <span className="placeholder">No notes</span> : user.map((e) => (
            <div className="note-block user" title={noteLabel(e)} key={e.id} style={{ width: `${Math.max(80, e.durationMs / 4)}px` }}>
              {midiNoteToName(e.note)}
            </div>
          ))}
        </div>
      </div>
      <div className="lane">
        <span className="lane-title">AI Output</span>
        <div className="lane-track">
          {ai.length === 0 ? <span className="placeholder">No notes</span> : ai.map((e) => (
            <div className="note-block ai" title={noteLabel(e)} key={e.id} style={{ width: `${Math.max(80, e.durationMs / 4)}px` }}>
              {midiNoteToName(e.note)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
