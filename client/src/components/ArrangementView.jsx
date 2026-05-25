import React from 'react';
import TrackLane from './TrackLane';

export default function ArrangementView({ lanes, clips, selectedClipId, onSelectClip, onLaneMute, onLaneVolume, playheadPct }) {
  return (
    <section className="panel arrangement">
      <div className="arr-header">
        <h2>Live Arrangement</h2>
        <div className="bar-markers">{[1,2,3,4,5,6,7,8].map((b) => <span key={b}>{b}</span>)}</div>
      </div>
      <div className="arr-grid-wrap">
        <div className="playhead" style={{ left: `${playheadPct}%` }} />
        {lanes.map((lane) => (
          <TrackLane
            key={lane.key}
            lane={lane}
            clips={clips.filter((c) => c.track === lane.label)}
            selectedClipId={selectedClipId}
            onSelectClip={onSelectClip}
            onToggleMute={onLaneMute}
            onVolume={onLaneVolume}
          />
        ))}
      </div>
    </section>
  );
}
