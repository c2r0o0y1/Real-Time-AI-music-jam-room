export function midiNoteToFrequency(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function createBassSynth(audioContext) {
  const activeNodes = new Set();

  const playNote = ({ note, velocity = 80, startTime, duration = 0.35 }) => {
    if (!audioContext || typeof note !== 'number') return null;

    const safeStartTime = Math.max(audioContext.currentTime, startTime ?? audioContext.currentTime);
    const safeDuration = Math.max(0.05, duration || 0.35);
    const stopTime = safeStartTime + safeDuration;
    const gainValue = Math.max(0, Math.min(1, velocity / 127)) * 0.18;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(midiNoteToFrequency(note), safeStartTime);

    gain.gain.setValueAtTime(0, safeStartTime);
    gain.gain.linearRampToValueAtTime(gainValue, safeStartTime + 0.015);
    gain.gain.setValueAtTime(gainValue, Math.max(safeStartTime + 0.015, stopTime - 0.08));
    gain.gain.linearRampToValueAtTime(0, stopTime);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(safeStartTime);
    oscillator.stop(stopTime + 0.01);

    const nodeSet = { oscillator, gain };
    activeNodes.add(nodeSet);

    oscillator.onended = () => {
      activeNodes.delete(nodeSet);
      oscillator.disconnect();
      gain.disconnect();
    };

    return nodeSet;
  };

  const stopAll = () => {
    const now = audioContext.currentTime;
    activeNodes.forEach(({ oscillator }) => {
      try {
        oscillator.stop(now + 0.01);
      } catch {
        // Already stopped.
      }
    });
    activeNodes.clear();
  };

  return {
    playNote,
    stopAll,
  };
}
