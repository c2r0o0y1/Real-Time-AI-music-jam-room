import React from 'react';

export default function MetricsPanel({ metrics }) {
  return (
    <section className="panel">
      <h2>Real-Time System</h2>
      <div className="kv"><span>WebSocket Latency</span><strong>{metrics.roundTripLatencyMs ?? '--'} ms</strong></div>
      <div className="kv"><span>Server Processing</span><strong>{metrics.serverLatencyMs ?? '--'} ms</strong></div>
      <div className="kv"><span>Last Server Response</span><strong>{metrics.lastResponseTime || '--'}</strong></div>
      <div className="kv"><span>Playback Buffer</span><strong>{metrics.playbackBufferHealth}</strong></div>
      <div className="kv"><span>Buffer Size</span><strong>{metrics.playbackBufferSize}</strong></div>
      <div className="kv"><span>Events Sent</span><strong>{metrics.midiSentCount}</strong></div>
      <div className="kv"><span>AI Events Received</span><strong>{metrics.aiReceivedCount}</strong></div>
      <div className="kv"><span>Missed Deadlines</span><strong>{metrics.missedDeadlineCount}</strong></div>
      <div className="kv"><span>Dropped Events</span><strong>{metrics.droppedCount}</strong></div>
    </section>
  );
}
