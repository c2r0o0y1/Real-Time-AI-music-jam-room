import React from 'react';

export default function MidiPanel({ selectedInput, inputNames, onConnectMidi, activeNotes }) {
  return (
    <section className="panel">
      <h2>MIDI Device</h2>
      <button onClick={onConnectMidi} className="btn full">Connect MIDI</button>
      <p>Selected: <strong>{selectedInput}</strong></p>
      <p>Inputs: {inputNames.length ? inputNames.join(', ') : 'No MIDI input found.'}</p>
      <p>Active: {activeNotes.length ? activeNotes.join(', ') : 'None'}</p>
    </section>
  );
}
