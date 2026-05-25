function parseMidiMessage(messageEvent) {
  const [statusByte, note = 0, velocity = 0] = messageEvent.data;
  const command = statusByte & 0xf0;

  if (command === 0x90 && velocity > 0) {
    return { type: 'note_on', note, velocity, timestamp: Date.now() };
  }

  if (command === 0x80 || (command === 0x90 && velocity === 0)) {
    return { type: 'note_off', note, velocity, timestamp: Date.now() };
  }

  return null;
}

export async function requestMidiInputs(onMidiEvent, onStatus) {
  if (!navigator.requestMIDIAccess) {
    onStatus?.('Web MIDI is not supported in this browser.');
    return { inputNames: [], selectedInputName: null, midiAccess: null };
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess();
    const inputs = Array.from(midiAccess.inputs.values());
    const inputNames = inputs.map((input) => input.name || 'Unknown MIDI Input');

    if (inputs.length === 0) {
      onStatus?.('No MIDI input found.');
      return { inputNames, selectedInputName: null, midiAccess };
    }

    const selectedInput = inputs[0];
    selectedInput.onmidimessage = (event) => {
      const parsed = parseMidiMessage(event);
      if (parsed) onMidiEvent?.(parsed);
    };

    onStatus?.(`Connected: ${selectedInput.name || 'Unknown MIDI Input'}`);

    return {
      inputNames,
      selectedInputName: selectedInput.name || 'Unknown MIDI Input',
      midiAccess,
    };
  } catch (error) {
    onStatus?.(`Failed to access MIDI: ${error.message}`);
    return { inputNames: [], selectedInputName: null, midiAccess: null };
  }
}
