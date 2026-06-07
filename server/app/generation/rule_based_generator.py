from app.core.models import AccompanimentNote, AccompanimentSegment, MusicContext

CHORD_ROOT_NOTES = {
    "C": 36,
    "F": 41,
    "G": 43,
    "Am": 45,
    "Dm": 38,
    "Em": 40,
}


def generate_bass_segment(context: MusicContext) -> AccompanimentSegment:
    """Generates a short rule-based bass accompaniment from detected chord context."""
    chord = context.detected_chord or "None"

    if chord == "None":
        return AccompanimentSegment(
            chord="None",
            notes=[],
            fallback_used=True,
        )

    root_note = CHORD_ROOT_NOTES.get(chord, 36)
    fallback_used = chord not in CHORD_ROOT_NOTES

    return AccompanimentSegment(
        chord=chord,
        notes=[
            AccompanimentNote(
                note=root_note,
                velocity=80,
                start_offset_ms=0,
                duration_ms=400,
            ),
            AccompanimentNote(
                note=root_note + 12,
                velocity=70,
                start_offset_ms=500,
                duration_ms=350,
            ),
        ],
        fallback_used=fallback_used,
    )
