const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiNoteToName(note) {
  const n = Number(note);
  if (!Number.isFinite(n)) return 'Unknown';
  const pitchClass = ((n % 12) + 12) % 12;
  const octave = Math.floor(n / 12) - 1;
  return `${NOTE_NAMES[pitchClass]}${octave}`;
}

export function detectSimpleChord(activeNotes) {
  if (!activeNotes || activeNotes.length < 3) return 'Listening...';

  const classes = [...new Set(activeNotes.map((n) => ((n % 12) + 12) % 12))];
  if (classes.length < 3) return 'Listening...';

  for (let root = 0; root < 12; root += 1) {
    const major = [root, (root + 4) % 12, (root + 7) % 12];
    const minor = [root, (root + 3) % 12, (root + 7) % 12];

    if (major.every((n) => classes.includes(n))) return NOTE_NAMES[root];
    if (minor.every((n) => classes.includes(n))) return `${NOTE_NAMES[root]}m`;
  }

  return 'Listening...';
}
