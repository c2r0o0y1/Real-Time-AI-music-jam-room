import React from 'react';

export default function UpcomingSegmentPanel({ segment }) {
  return (
    <section className="panel">
      <h2>Upcoming AI Segment</h2>
      <div className="kv"><span>Starts In</span><strong>{segment.startsInMs} ms</strong></div>
      <div className="kv"><span>Duration</span><strong>{segment.durationLabel}</strong></div>
      <div className="kv"><span>Instruments</span><strong>{segment.instruments}</strong></div>
      <div className="kv"><span>Deadline</span><strong>{segment.deadline}</strong></div>
      <div className="kv"><span>Buffer Ready</span><strong>{segment.bufferReady}</strong></div>
    </section>
  );
}
