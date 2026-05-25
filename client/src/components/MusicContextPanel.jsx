import React from 'react';

export default function MusicContextPanel({ context }) {
  return (
    <section className="panel">
      <h2>Music Context</h2>
      <div className="kv"><span>Active Notes</span><strong>{context.activeNoteNames || 'None'}</strong></div>
      <div className="kv"><span>Detected Chord</span><strong>{context.chord || 'Listening...'}</strong></div>
      <div className="kv"><span>Estimated Key</span><strong>{context.key || 'Estimating...'}</strong></div>
      <div className="kv"><span>BPM</span><strong>{context.bpm}</strong></div>
      <div className="kv"><span>Beat Position</span><strong>{context.beatPosition || 'Waiting...'}</strong></div>
      <div className="kv"><span>Current Genre</span><strong>{context.genre}</strong></div>
      <div className="kv"><span>Your Instrument</span><strong>{context.userInstrument}</strong></div>
      <div className="kv"><span>AI Instrument</span><strong>{context.aiInstrument}</strong></div>
    </section>
  );
}
