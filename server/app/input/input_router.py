from pydantic import ValidationError

from app.input.audio_handler import handle_audio_chunk
from app.input.midi_handler import handle_midi_event


def route_input_message(session_id: str, raw_message: dict) -> dict:
    """Routes validated input types to domain handlers and normalizes error responses."""
    # Client Input -> WebSocket -> Input Router -> Input Handler
    message_type = raw_message.get("type")

    if message_type == "ping":
        return {"type": "pong"}

    if message_type == "midi_event":
        try:
            return handle_midi_event(session_id, raw_message)
        except ValidationError as exc:
            return {
                "type": "error",
                "message": "Invalid MIDI event",
                "details": exc.errors(),
            }

    if message_type == "audio_chunk":
        try:
            return handle_audio_chunk(session_id, raw_message)
        except ValidationError as exc:
            return {
                "type": "error",
                "message": "Invalid audio chunk",
                "details": exc.errors(),
            }

    return {
        "type": "error",
        "message": "Unsupported message type",
        "received_type": message_type,
    }
