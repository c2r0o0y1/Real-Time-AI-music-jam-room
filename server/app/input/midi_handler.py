from app.core.models import MidiEventMessage
from app.core.session_manager import session_manager


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
    print(f"Session {session_id} active_notes: {session.active_notes}")

    return {
        "type": "midi_state_update",
        "status": "updated",
        "session_id": session_id,
        "event": midi_message.event,
        "note": midi_message.note,
        "velocity": midi_message.velocity,
        "timestamp": midi_message.timestamp,
        "active_notes": session.active_notes,
        "events_received": session.events_received,
    }
