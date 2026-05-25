from typing import Literal

from pydantic import BaseModel, Field


class MidiEventMessage(BaseModel):
    type: Literal["midi_event"]
    event: Literal["note_on", "note_off"]
    note: int = Field(ge=0, le=127)
    velocity: int = Field(ge=0, le=127)
    timestamp: int


class AudioChunkMessage(BaseModel):
    type: Literal["audio_chunk"]
    timestamp: int
    sample_rate: int
    channels: int
    format: Literal["pcm16_base64"]
    duration_ms: int
    audio_data: str
    client_context: dict = Field(default_factory=dict)


class SessionState(BaseModel):
    session_id: str
    active_notes: list[int] = Field(default_factory=list)
    recent_events: list[dict] = Field(default_factory=list)
    events_received: int = 0
