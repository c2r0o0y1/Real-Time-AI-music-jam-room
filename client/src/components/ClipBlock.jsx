import React from 'react';

export default function ClipBlock({ clip, laneColor, isSelected, onSelect }) {
  return (
    <button type="button" className={`clip-block ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(clip.id)} style={{ left: `${clip.startPct}%`, width: `${clip.widthPct}%`, background: laneColor }} title={`${clip.name} (${clip.instrument})`}>
      <span>{clip.name}</span>
    </button>
  );
}
