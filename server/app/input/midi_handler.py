import logging

from app.core.models import LatencyMetrics, MidiEventMessage
from app.core.session_manager import session_manager
from app.generation.rule_based_generator import generate_bass_segment
from app.generation.scheduler import schedule_or_fallback_segment
from app.metrics.latency import current_time_ms, elapsed_ms
from app.music.chord_detector_midi import detect_chord_from_midi_notes
from app.music.feature_extractor import extract_midi_window_features
from app.music.music_context import build_music_context_from_session

logger = logging.getLogger(__name__)


def handle_midi_event(session_id: str, raw_message: dict) -> dict:
    """Validates MIDI input, updates session note state, and returns the latest snapshot."""
    deadline_ms = 100
    server_receive_time_ms = current_time_ms()
    processing_start_time_ms = current_time_ms()
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

    previous_segment = session.last_generated_segment
    generation_start_time_ms = current_time_ms()
    generated_segment = generate_bass_segment(context)
    generation_time_ms = elapsed_ms(generation_start_time_ms)

    scheduler_start_time_ms = current_time_ms()
    processing_time_before_scheduler_ms = elapsed_ms(processing_start_time_ms)
    accompaniment = schedule_or_fallback_segment(
        generated_segment=generated_segment,
        context=context,
        previous_segment=previous_segment,
        processing_time_ms=processing_time_before_scheduler_ms,
        deadline_ms=deadline_ms,
    )
    scheduler_time_ms = elapsed_ms(scheduler_start_time_ms)

    processing_time_ms = elapsed_ms(processing_start_time_ms)
    latency_metrics = LatencyMetrics(
        server_receive_time_ms=server_receive_time_ms,
        processing_time_ms=processing_time_ms,
        generation_time_ms=generation_time_ms,
        scheduler_time_ms=scheduler_time_ms,
        deadline_ms=deadline_ms,
    )

    session = session_manager.set_last_generated_segment(session_id, accompaniment)
    session = session_manager.set_last_latency_metrics(session_id, latency_metrics)
    logger.info(
        "Session %s generated bass segment for chord %s",
        session_id,
        accompaniment.chord,
    )
    logger.info(
        "Session %s context: chord=%s, key=%s, bpm=%s, active_notes=%s",
        session_id,
        session.current_chord,
        context.estimated_key,
        context.bpm,
        session.active_notes,
    )

    return {
        "type": "hot_path_update",
        "status": "updated",
        "session_id": session_id,
        "event": midi_message.event,
        "note": midi_message.note,
        "velocity": midi_message.velocity,
        "active_notes": session.active_notes,
        "detected_chord": session.current_chord,
        "context": context.model_dump(),
        "accompaniment": accompaniment.model_dump(),
        "metrics": latency_metrics.model_dump(),
        "events_received": session.events_received,
        "segments_generated": session.segments_generated,
        "fallback_count": session.fallback_count,
    }
