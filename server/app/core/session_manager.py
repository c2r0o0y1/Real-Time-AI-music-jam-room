from app.core.models import (
    AccompanimentSegment,
    LatencyMetrics,
    MidiWindowFeatures,
    MusicContext,
    SessionState,
)


class SessionManager:
    """Maintains in-memory session state for live input hot-path processing."""

    def __init__(self) -> None:
        self.sessions: dict[str, SessionState] = {}

    def get_or_create_session(self, session_id: str) -> SessionState:
        """Returns existing session state or creates a new empty one."""
        if session_id not in self.sessions:
            self.sessions[session_id] = SessionState(session_id=session_id)
        return self.sessions[session_id]

    def update_midi_note(
        self,
        session_id: str,
        event: str,
        note: int,
        velocity: int,
        timestamp: int,
    ) -> SessionState:
        """Applies MIDI note on/off semantics and updates bounded recent event history."""
        session = self.get_or_create_session(session_id)

        is_note_off = event == "note_off" or (event == "note_on" and velocity == 0)

        if is_note_off:
            if note in session.active_notes:
                session.active_notes.remove(note)
        elif note not in session.active_notes:
            session.active_notes.append(note)

        session.recent_events.append(
            {
                "event": event,
                "note": note,
                "velocity": velocity,
                "timestamp": timestamp,
            }
        )
        session.recent_events = session.recent_events[-50:]
        session.events_received += 1

        return session

    def set_current_chord(self, session_id: str, chord: str) -> SessionState:
        """Updates and returns the session's currently detected chord."""
        session = self.get_or_create_session(session_id)
        session.current_chord = chord
        return session

    def set_context_source(self, session_id: str, context_source: str) -> SessionState:
        """Tracks where the current chord context originated."""
        session = self.get_or_create_session(session_id)
        session.context_source = context_source
        return session

    def set_last_window_features(
        self,
        session_id: str,
        window_features: MidiWindowFeatures,
    ) -> SessionState:
        """Stores the latest sliding-window MIDI features on the session."""
        session = self.get_or_create_session(session_id)
        session.last_window_features = window_features
        return session

    def set_last_music_context(self, session_id: str, context: MusicContext) -> SessionState:
        """Stores the latest unified music context on the session."""
        session = self.get_or_create_session(session_id)
        session.last_music_context = context
        session.estimated_key = context.estimated_key
        return session

    def set_last_generated_segment(
        self,
        session_id: str,
        segment: AccompanimentSegment,
    ) -> SessionState:
        """Stores the latest generated accompaniment segment on the session."""
        session = self.get_or_create_session(session_id)
        session.last_generated_segment = segment
        if segment.notes and not segment.fallback_used:
            session.segments_generated += 1
        if segment.fallback_used:
            session.fallback_count += 1
        return session

    def set_last_latency_metrics(
        self,
        session_id: str,
        latency_metrics: LatencyMetrics,
    ) -> SessionState:
        """Stores the latest hot-path latency metrics on the session."""
        session = self.get_or_create_session(session_id)
        session.last_latency_metrics = latency_metrics
        return session


session_manager = SessionManager()
