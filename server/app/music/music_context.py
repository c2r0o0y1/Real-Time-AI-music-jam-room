from app.core.models import MusicContext, SessionState

KNOWN_CHORDS = {"C", "F", "G", "Am", "Dm", "Em"}


def estimate_key_from_chord(chord: str) -> str:
    if chord in KNOWN_CHORDS:
        return "C major / A minor"
    if chord in {"None", "Unknown"}:
        return "Unknown"
    return "Unknown"


def build_music_context_from_session(session: SessionState) -> MusicContext:
    chord = session.current_chord or "None"
    estimated_key = estimate_key_from_chord(chord)
    window_features = session.last_window_features

    if chord in KNOWN_CHORDS:
        confidence = 0.95
    elif chord == "None":
        confidence = 0.0
    else:
        confidence = 0.3

    return MusicContext(
        input_type=session.input_type or "midi",
        user_instrument=session.user_instrument or "MIDI Keyboard",
        detected_chord=chord,
        estimated_key=estimated_key,
        bpm=session.bpm if session.bpm else 90,
        active_notes=list(session.active_notes),
        window_notes=list(window_features.window_notes) if window_features else [],
        note_density=window_features.note_density if window_features else 0,
        context_source=session.context_source or "active_notes",
        confidence=confidence,
    )
