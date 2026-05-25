let audioContext = null;
const activeOscillators = new Set();

function getAudioContext() {
  if (!audioContext) audioContext = new window.AudioContext();
  return audioContext;
}

export function midiNoteToFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

export async function playNote(note, velocity = 80, durationMs = 500, options = {}) {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const now = ctx.currentTime;
  const durationSec = Math.max(0.05, durationMs / 1000);
  const attack = options.attack ?? 0.01;
  const release = options.release ?? 0.05;
  const wave = options.waveform ?? 'triangle';
  const volume = Math.max(0, Math.min(1, options.volume ?? 0.5));
  const gainValue = Math.max(0, Math.min(1, velocity / 127)) * volume;
  const stopAt = now + durationSec;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = wave;
  osc.frequency.setValueAtTime(midiNoteToFrequency(note), now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(gainValue, now + attack);
  gain.gain.setValueAtTime(gainValue, Math.max(now + attack, stopAt - release));
  gain.gain.linearRampToValueAtTime(0, stopAt);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(stopAt);
  activeOscillators.add(osc);

  osc.onended = () => {
    activeOscillators.delete(osc);
    osc.disconnect();
    gain.disconnect();
  };
}

export function playBassNote(note, velocity = 80, durationMs = 500, volume = 0.5) {
  return playNote(note, velocity, durationMs, {
    waveform: 'triangle',
    volume: volume * 0.5,
    attack: 0.01,
    release: 0.06,
  });
}

export function stopAllPlayback() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  activeOscillators.forEach((osc) => {
    try {
      osc.stop(now + 0.01);
    } catch {
      // ignore if already stopped
    }
  });
}
