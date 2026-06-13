from typing import Literal, Optional

from pydantic import BaseModel, Field


class MidiWindowFeatures(BaseModel):
    window_notes: list[int] = Field(default_factory=list)
    window_pitch_classes: list[int] = Field(default_factory=list)
    window_chord: str = "None"
    note_density: int = 0
    window_duration_ms: int = 2000
    context_source: str = "active_notes"


class MusicContext(BaseModel):
    input_type: str = "midi"
    user_instrument: str = "MIDI Keyboard"
    detected_chord: str = "None"
    estimated_key: str = "Unknown"
    bpm: int = 90
    active_notes: list[int] = Field(default_factory=list)
    window_notes: list[int] = Field(default_factory=list)
    note_density: int = 0
    context_source: str = "active_notes"
    confidence: float = 0.0


class AccompanimentNote(BaseModel):
    note: int
    velocity: int
    start_offset_ms: int
    duration_ms: int


class AccompanimentSegment(BaseModel):
    type: str = "accompaniment_segment"
    track: str = "bass"
    instrument: str = "bass"
    chord: str
    notes: list[AccompanimentNote]
    segment_duration_ms: int = 1000
    deadline_status: str = "unknown"
    fallback_used: bool = False


class LatencyMetrics(BaseModel):
    server_receive_time_ms: int
    processing_time_ms: float
    generation_time_ms: float
    scheduler_time_ms: float
    deadline_ms: int = 100


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
    current_chord: str = "None"
    context_source: str = "active_notes"
    estimated_key: str = "Unknown"
    bpm: int = 90
    user_instrument: str = "MIDI Keyboard"
    input_type: str = "midi"
    window_duration_ms: int = 2000
    last_window_features: MidiWindowFeatures | None = None
    last_music_context: MusicContext | None = None
    last_generated_segment: Optional[AccompanimentSegment] = None
    last_latency_metrics: Optional[LatencyMetrics] = None
    recent_events: list[dict] = Field(default_factory=list)
    events_received: int = 0
    segments_generated: int = 0
    fallback_count: int = 0
