import logging

from app.core.models import AudioChunkMessage

logger = logging.getLogger(__name__)


def handle_audio_chunk(session_id: str, raw_message: dict) -> dict:
    """Validates audio chunk metadata, logs receipt, and returns an audio_ack."""
    audio_message = AudioChunkMessage.model_validate(raw_message)
    logger.info(
        "audio_chunk session=%s sample_rate=%s channels=%s duration_ms=%s format=%s",
        session_id,
        audio_message.sample_rate,
        audio_message.channels,
        audio_message.duration_ms,
        audio_message.format,
    )

    return {
        "type": "audio_ack",
        "status": "received",
        "session_id": session_id,
        "sample_rate": audio_message.sample_rate,
        "channels": audio_message.channels,
        "duration_ms": audio_message.duration_ms,
        "format": audio_message.format,
    }
