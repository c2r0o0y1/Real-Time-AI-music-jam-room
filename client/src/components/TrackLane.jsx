import React from 'react';
import ClipBlock from './ClipBlock';

export default function TrackLane({ lane, clips, selectedClipId, onSelectClip, onToggleMute, onVolume }) {
  return (
    <div className="track-lane">
      <div className="track-meta">
        <strong>{lane.label}</strong>
        <div className="row">
          <button className="mini" onClick={() => onToggleMute(lane.key)}>{lane.muted ? 'Unmute' : 'Mute'}</button>
          <input type="range" min="0" max="1" step="0.01" value={lane.volume} onChange={(e) => onVolume(lane.key, Number(e.target.value))} />
        </div>
        <span className="tiny">{lane.status}</span>
      </div>
      <div className="lane-grid">
        {clips.map((clip) => (
          <ClipBlock key={clip.id} clip={clip} laneColor={lane.color} isSelected={selectedClipId === clip.id} onSelect={onSelectClip} />
        ))}
      </div>
    </div>
  );
}
