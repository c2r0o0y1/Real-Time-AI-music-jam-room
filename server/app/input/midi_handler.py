import logging

from app.core.models import MidiEventMessage
from app.core.session_manager import session_manager
from app.music.chord_detector_midi import detect_chord_from_midi_notes
from app.music.feature_extractor import extract_midi_window_features
from app.music.music_context import build_music_context_from_session

logger = logging.getLogger(__name__)


def handle_midi_event(session_id: str, raw_message: dict) -> dict:
    """Validates MIDI input, updates session note state, and returns the latest snapshot."""
    midi_message = MidiEventMessage.model_validate(raw_message)
    session = session_manager.update_midi_note(
        session_id=session_id,
        event=midi_message.event,
        note=midi_message.note,
        velocity=midi_message.velocity,
        timestamp=midi_message.timestamp,
    )
    window_features = extract_midi_window_features(session, midi_message.timestamp)
    active_chord = detect_chord_from_midi_notes(session.active_notes)
    active_pitch_class_count = len({note % 12 for note in session.active_notes})

    if active_pitch_class_count >= 3 and active_chord != "Unknown":
        final_chord = active_chord
        context_source = "active_notes"
    elif window_features.window_chord not in {"None", "Unknown"}:
        final_chord = window_features.window_chord
        context_source = "sliding_window"
    else:
        final_chord = active_chord
        context_source = "active_notes"

    window_features.context_source = context_source
    session = session_manager.set_last_window_features(session_id, window_features)
    session = session_manager.set_current_chord(session_id, final_chord)
    session = session_manager.set_context_source(session_id, context_source)
    context = build_music_context_from_session(session)
    session = session_manager.set_last_music_context(session_id, context)
    logger.info(
        "Session %s context: chord=%s, key=%s, bpm=%s, active_notes=%s",
        session_id,
        session.current_chord,
        context.estimated_key,
        context.bpm,
        session.active_notes,
    )

    return {
        "type": "music_context_update",
        "status": "updated",
        "session_id": session_id,
        "event": midi_message.event,
        "note": midi_message.note,
        "velocity": midi_message.velocity,
        "active_notes": session.active_notes,
        "detected_chord": session.current_chord,
        "window_features": window_features.model_dump(),
        "context": context.model_dump(),
        "events_received": session.events_received,
    }
