from app.core.models import AccompanimentSegment, MusicContext
from app.generation.fallback import build_fallback_segment


def schedule_or_fallback_segment(
    generated_segment: AccompanimentSegment,
    context: MusicContext,
    previous_segment: AccompanimentSegment | None,
    processing_time_ms: float,
    deadline_ms: int = 100,
) -> AccompanimentSegment:
    if processing_time_ms <= deadline_ms:
        generated_segment.deadline_status = "on_time"
        generated_segment.fallback_used = False
        return generated_segment

    return build_fallback_segment(context, previous_segment)
