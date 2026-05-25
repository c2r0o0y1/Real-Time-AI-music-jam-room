import React from 'react';

export default function AccompanimentControls({
  userInstrument,
  genre,
  aiInstrument,
  complexity,
  responsiveness,
  creativity,
  humanize,
  fallbackMode,
  generateEnabled,
  onUserInstrument,
  onGenre,
  onAiInstrument,
  onComplexity,
  onResponsiveness,
  onCreativity,
  onHumanize,
  onFallbackMode,
  onGenerate,
}) {
  return (
    <section className="panel">
      <h2>Performance Setup</h2>

      <label>Your Instrument
        <select value={userInstrument} onChange={(e) => onUserInstrument(e.target.value)}>
          <option>MIDI Keyboard</option>
          <option>Guitar</option>
          <option>Piano</option>
          <option>Violin</option>
          <option>Drums</option>
          <option>Bass</option>
          <option>Voice</option>
          <option>Other</option>
        </select>
      </label>

      <label>Genre
        <select value={genre} onChange={(e) => onGenre(e.target.value)}>
          <option>Pop</option>
          <option>Rock</option>
          <option>Jazz</option>
          <option>Blues</option>
          <option>Lo-fi</option>
          <option>Hip-Hop</option>
          <option>R&B</option>
          <option>Classical</option>
          <option>EDM</option>
          <option>Country</option>
          <option>Reggae</option>
          <option>Funk</option>
        </select>
      </label>

      <label>AI Accompaniment Instrument
        <select value={aiInstrument} onChange={(e) => onAiInstrument(e.target.value)}>
          <option>Bass</option>
          <option>Drums</option>
          <option>Piano</option>
          <option>Guitar</option>
          <option>Strings</option>
          <option>Synth Pad</option>
          <option>Melody</option>
          <option>Full Band</option>
        </select>
      </label>

      <label>Complexity: {complexity}
        <input type="range" min="1" max="5" value={complexity} onChange={(e) => onComplexity(Number(e.target.value))} />
      </label>

      <label>Responsiveness: {responsiveness}
        <input type="range" min="1" max="5" value={responsiveness} onChange={(e) => onResponsiveness(Number(e.target.value))} />
      </label>

      <label>Creativity: {creativity}
        <input type="range" min="1" max="5" value={creativity} onChange={(e) => onCreativity(Number(e.target.value))} />
      </label>

      <label>Fallback Mode
        <select value={fallbackMode} onChange={(e) => onFallbackMode(e.target.value)}>
          <option>Repeat Previous Pattern</option>
          <option>Extend Current Chord</option>
          <option>Rule-Based Bassline</option>
          <option>Silence Only If Needed</option>
        </select>
      </label>

      <label className="toggle">
        <input type="checkbox" checked={humanize} onChange={onHumanize} />
        Humanize
      </label>

      <label className="toggle">
        <input type="checkbox" checked={generateEnabled} onChange={onGenerate} />
        Generate AI
      </label>
    </section>
  );
}
