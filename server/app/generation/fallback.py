from typing import Optional

from app.core.models import AccompanimentNote, AccompanimentSegment, MusicContext
from app.generation.rule_based_generator import CHORD_ROOT_NOTES


def build_fallback_segment(
    context: MusicContext,
    previous_segment: Optional[AccompanimentSegment],
) -> AccompanimentSegment:
    if previous_segment and previous_segment.notes:
        fallback_segment = previous_segment.model_copy(deep=True)
        fallback_segment.fallback_used = True
        fallback_segment.deadline_status = "late_fallback_previous"
        return fallback_segment

    chord = context.detected_chord or "None"
    root_note = CHORD_ROOT_NOTES.get(chord)

    if root_note is not None:
        return AccompanimentSegment(
            chord=chord,
            notes=[
                AccompanimentNote(
                    note=root_note,
                    velocity=75,
                    start_offset_ms=0,
                    duration_ms=500,
                ),
            ],
            deadline_status="late_fallback_root",
            fallback_used=True,
        )

    return AccompanimentSegment(
        chord=chord,
        notes=[],
        deadline_status="late_fallback_empty",
        fallback_used=True,
    )
