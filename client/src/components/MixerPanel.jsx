import React from 'react';

export default function MixerPanel({ userVolume, aiVolume, muteAi, soloAi, onUserVolume, onAiVolume, onMuteAi, onSoloAi }) {
  return (
    <section className="panel">
      <h2>Mixer</h2>
      <label>User Volume: {Math.round(userVolume * 100)}%
        <input type="range" min="0" max="1" step="0.01" value={userVolume} onChange={(e) => onUserVolume(Number(e.target.value))} />
      </label>
      <label>AI Volume: {Math.round(aiVolume * 100)}%
        <input type="range" min="0" max="1" step="0.01" value={aiVolume} onChange={(e) => onAiVolume(Number(e.target.value))} />
      </label>
      <label className="toggle">
        <input type="checkbox" checked={muteAi} onChange={onMuteAi} />
        Mute AI
      </label>
      <label className="toggle">
        <input type="checkbox" checked={soloAi} onChange={onSoloAi} />
        Solo AI
      </label>
    </section>
  );
}
