import React from 'react';

export default function SessionSetupPanel({ inputSource, userInstrument, genre, mood, selectedKey, timeSignature, onInputSource, onUserInstrument, onGenre, onMood, onKey, onTimeSignature }) {
  return (
    <section className="panel">
      <h2>Session Setup</h2>
      <label>Input Source
        <select value={inputSource} onChange={(e) => onInputSource(e.target.value)}>
          <option value="midi">MIDI</option>
          <option value="audio">Audio Interface / Microphone</option>
          <option value="demo">Demo Jam</option>
        </select>
      </label>
      <label>Your Instrument
        <select value={userInstrument} onChange={(e) => onUserInstrument(e.target.value)}>
          <option>MIDI Keyboard</option><option>Guitar</option><option>Piano</option><option>Violin</option><option>Acoustic Piano</option>
          <option>Drums</option><option>Bass</option><option>Voice</option><option>Other</option>
        </select>
      </label>
      <label>Genre
        <select value={genre} onChange={(e) => onGenre(e.target.value)}>
          <option>Pop</option><option>Rock</option><option>Jazz</option><option>Blues</option><option>Lo-fi</option>
          <option>Hip-Hop</option><option>R&B</option><option>Classical</option><option>EDM</option><option>Country</option><option>Reggae</option><option>Funk</option>
        </select>
      </label>
      <label>Mood
        <select value={mood} onChange={(e) => onMood(e.target.value)}>
          <option>Energetic</option><option>Chill</option><option>Cinematic</option><option>Melancholic</option><option>Groovy</option>
        </select>
      </label>
      <label>Key<input value={selectedKey} onChange={(e) => onKey(e.target.value)} /></label>
      <label>Time Signature<input value={timeSignature} onChange={(e) => onTimeSignature(e.target.value)} /></label>
    </section>
  );
}
