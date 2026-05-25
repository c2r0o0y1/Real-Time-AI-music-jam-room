export async function startMidiInput({ onMidiEvent, onStatusChange, onError }) {
  if (!navigator.requestMIDIAccess) {
    onStatusChange?.({ status: 'not_supported', devices: [] });
    onError?.(new Error('Web MIDI is not supported in this browser. Try Chrome or Edge.'));
    return () => {};
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess();
    const inputs = Array.from(midiAccess.inputs.values());
    const deviceNames = inputs.map((input) => input.name || 'Unknown MIDI Device');

    if (inputs.length === 0) {
      onStatusChange?.({ status: 'no_device', devices: [] });
      return () => {};
    }

    onStatusChange?.({ status: 'ready', devices: deviceNames });

    const handlers = inputs.map((input) => {
      const handler = (messageEvent) => {
        const [status = 0, note = 0, velocity = 0] = messageEvent.data || [];
        const command = status & 0xf0;

        let eventType = null;
        if (command === 0x90 && velocity > 0) eventType = 'note_on';
        if (command === 0x80 || (command === 0x90 && velocity === 0)) eventType = 'note_off';
        if (!eventType) return;

        const message = {
          type: 'midi_event',
          event: eventType,
          note,
          velocity,
          timestamp: Date.now(),
        };

        onMidiEvent?.(message);
      };

      input.onmidimessage = handler;
      return { input, handler };
    });

    return () => {
      handlers.forEach(({ input }) => {
        input.onmidimessage = null;
      });
    };
  } catch (error) {
    onStatusChange?.({ status: 'error', devices: [] });
    onError?.(error);
    return () => {};
  }
}
