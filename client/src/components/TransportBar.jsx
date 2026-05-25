import React from 'react';

export default function TransportBar({ sessionMode, bpm, selectedKey, timeSignature, metronomeOn, loopEnabled, countInEnabled, onStartLiveJam, onStop, onRecord, onDemoJam, onBpm, onKey, onTimeSignature, onMetronome, onLoop, onCountIn }) {
  const isRecording = sessionMode === 'recording';
  return (
    <section className="transport-bar">
      <div className="transport-actions">
        <button className="btn" onClick={onStartLiveJam}>Start Live Jam</button>
        <button className="btn secondary" onClick={onStop}>Stop</button>
        <button className={`btn ${isRecording ? 'danger' : 'secondary'}`} onClick={onRecord}>Record Jam</button>
        <button className="btn secondary" onClick={onDemoJam}>Demo Jam</button>
      </div>
      <div className="transport-fields">
        <label>BPM<input type="number" min="40" max="240" value={bpm} onChange={(e) => onBpm(Number(e.target.value))} /></label>
        <label>Key
          <select value={selectedKey} onChange={(e) => onKey(e.target.value)}>
            <option>C major / A minor</option><option>G major / E minor</option><option>D major / B minor</option>
            <option>F major / D minor</option><option>Bb major / G minor</option><option>Eb major / C minor</option>
          </select>
        </label>
        <label>Time Signature
          <select value={timeSignature} onChange={(e) => onTimeSignature(e.target.value)}>
            <option>4/4</option><option>3/4</option><option>6/8</option>
          </select>
        </label>
        <label className="toggle"><input type="checkbox" checked={metronomeOn} onChange={onMetronome} />Metronome</label>
        <label className="toggle"><input type="checkbox" checked={loopEnabled} onChange={onLoop} />Loop</label>
        <label className="toggle"><input type="checkbox" checked={countInEnabled} onChange={onCountIn} />Count-in</label>
      </div>
    </section>
  );
}
