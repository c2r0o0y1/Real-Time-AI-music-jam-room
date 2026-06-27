const DEFAULT_PLAYBACK_BUFFER_MS = 200;

function createClientSegmentId(segment) {
  const chord = segment?.chord || 'unknown';
  const notes = Array.isArray(segment?.notes)
    ? segment.notes.map((n) => `${n.note}:${n.start_offset_ms || 0}:${n.duration_ms || 0}`).join(',')
    : 'empty';
  return `client_${chord}_${notes}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function createPlaybackScheduler(options = {}) {
  const { audioContext, synth } = options;
  let playbackBufferMs = options.playbackBufferMs ?? DEFAULT_PLAYBACK_BUFFER_MS;
  const queue = [];
  const scheduledSegmentIds = new Set();

  const scheduleSegment = (segment) => {
    if (!segment || !Array.isArray(segment.notes) || segment.notes.length === 0) {
      return null;
    }

    if (!audioContext || !synth?.playNote) {
      return null;
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    const segmentId = segment.segment_id || segment.id || segment.__client_segment_id || createClientSegmentId(segment);
    if (scheduledSegmentIds.has(segmentId)) {
      return null;
    }

    if (!segment.segment_id && !segment.id && !segment.__client_segment_id) {
      Object.defineProperty(segment, '__client_segment_id', {
        value: segmentId,
        enumerable: false,
        configurable: true,
      });
    }

    const scheduledStartTime = audioContext.currentTime + playbackBufferMs / 1000;
    const notes = segment.notes.map((note) => {
      const startOffsetSec = Math.max(0, (note.start_offset_ms || 0) / 1000);
      const durationSec = Math.max(0.05, (note.duration_ms || 350) / 1000);
      const startTime = scheduledStartTime + startOffsetSec;

      synth.playNote({
        note: note.note,
        velocity: note.velocity ?? 80,
        startTime,
        duration: durationSec,
      });

      return {
        ...note,
        scheduled_start_time: startTime,
      };
    });

    const scheduledSegment = {
      ...segment,
      segment_id: segmentId,
      scheduled_start_time: scheduledStartTime,
      scheduled_start_time_ms: Math.round(scheduledStartTime * 1000),
      playback_buffer_ms: playbackBufferMs,
      notes,
    };

    scheduledSegmentIds.add(segmentId);
    queue.push(scheduledSegment);

    return scheduledSegment;
  };

  const clearQueue = () => {
    queue.length = 0;
    scheduledSegmentIds.clear();
  };

  const getQueue = () => [...queue];

  const setPlaybackBufferMs = (ms) => {
    const nextMs = Number(ms);
    playbackBufferMs = Number.isFinite(nextMs) && nextMs >= 0 ? nextMs : DEFAULT_PLAYBACK_BUFFER_MS;
  };

  return {
    scheduleSegment,
    clearQueue,
    getQueue,
    setPlaybackBufferMs,
  };
}
