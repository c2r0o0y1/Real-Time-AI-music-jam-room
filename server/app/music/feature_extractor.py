from app.core.models import MidiWindowFeatures, SessionState
from app.music.chord_detector_midi import detect_chord_from_midi_notes


def extract_midi_window_features(session: SessionState, current_timestamp: int) -> MidiWindowFeatures:
    """Extracts short-horizon MIDI note features to support arpeggio-aware context detection."""
    recent_window_events = [
        event
        for event in session.recent_events
        if current_timestamp - int(event.get("timestamp", 0)) <= session.window_duration_ms
    ]

    note_on_events = [
        event
        for event in recent_window_events
        if event.get("event") == "note_on" and int(event.get("velocity", 0)) > 0
    ]

    window_notes: list[int] = []
    for event in note_on_events:
        note = int(event.get("note", -1))
        if 0 <= note <= 127 and note not in window_notes:
            window_notes.append(note)

    window_pitch_classes: list[int] = []
    for note in window_notes:
        pitch_class = note % 12
        if pitch_class not in window_pitch_classes:
            window_pitch_classes.append(pitch_class)

    window_chord = detect_chord_from_midi_notes(window_notes)

    return MidiWindowFeatures(
        window_notes=window_notes,
        window_pitch_classes=window_pitch_classes,
        window_chord=window_chord,
        note_density=len(note_on_events),
        window_duration_ms=session.window_duration_ms,
        context_source="active_notes",
    )
