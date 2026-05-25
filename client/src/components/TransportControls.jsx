import React from 'react';

export default function TransportControls({ isPlaying, bpm, onPlay, onStop, onTapTempo, onBpmChange, metronomeOn, onToggleMetronome, beatPulse, onTestBass, onDemoMode }) {
  return (
    <section className="panel">
      <h2>Transport</h2>
      <div className="row wrap">
        <button onClick={onPlay} className="btn">Play</button>
        <button onClick={onStop} className="btn secondary">Stop</button>
        <button onClick={onTapTempo} className="btn secondary">Tap Tempo</button>
        <button onClick={onTestBass} className="btn secondary">Test Bass Note</button>
        <button onClick={onDemoMode} className="btn secondary">Demo Mode</button>
      </div>
      <div className="row wrap controls-row">
        <label>BPM
          <input type="number" min="40" max="240" value={bpm} onChange={(e) => onBpmChange(Number(e.target.value))} />
        </label>
        <label className="toggle">
          <input type="checkbox" checked={metronomeOn} onChange={onToggleMetronome} />
          Metronome
        </label>
        <span className={`pulse ${beatPulse ? 'on' : ''}`}>{isPlaying ? 'Running' : 'Stopped'}</span>
      </div>
    </section>
  );
}
