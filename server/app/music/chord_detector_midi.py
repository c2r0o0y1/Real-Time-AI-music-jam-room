CHORD_PATTERNS: list[tuple[set[int], str]] = [
    ({0, 4, 7}, "C"),
    ({5, 9, 0}, "F"),
    ({7, 11, 2}, "G"),
    ({9, 0, 4}, "Am"),
    ({2, 5, 9}, "Dm"),
    ({4, 7, 11}, "Em"),
]


def detect_chord_from_midi_notes(active_notes: list[int]) -> str:
    """Detects simple triads from active MIDI notes using pitch-class subset matching."""
    pitch_classes = {note % 12 for note in active_notes}

    if len(pitch_classes) < 3:
        return "None"

    for required_pitch_classes, chord_name in CHORD_PATTERNS:
        if required_pitch_classes.issubset(pitch_classes):
            return chord_name

    return "Unknown"
