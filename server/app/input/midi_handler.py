import logging

from app.core.models import MidiEventMessage
from app.core.session_manager import session_manager
from app.music.chord_detector_midi import detect_chord_from_midi_notes

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
    detected_chord = detect_chord_from_midi_notes(session.active_notes)
    session = session_manager.set_current_chord(session_id, detected_chord)
    logger.info(
        "Session %s active_notes: %s, chord: %s",
        session_id,
        session.active_notes,
        session.current_chord,
    )

    return {
        "type": "midi_state_update",
        "status": "updated",
        "session_id": session_id,
        "event": midi_message.event,
        "note": midi_message.note,
        "velocity": midi_message.velocity,
        "timestamp": midi_message.timestamp,
        "active_notes": session.active_notes,
        "detected_chord": session.current_chord,
        "events_received": session.events_received,
    }
