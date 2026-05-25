import React from 'react';

export default function JamHistoryPanel({ clips, selectedClipId, onSelectClip, onRename, onDelete, onDuplicate, onMute }) {
  const selected = clips.find((c) => c.id === selectedClipId) || null;

  return (
    <section className="panel">
      <h2>Jam History / Editable Clips</h2>
      <div className="history-list">
        {clips.length === 0 ? <p className="small">No clips yet.</p> : clips.map((clip) => (
          <button key={clip.id} className={`history-item ${selectedClipId === clip.id ? 'active' : ''}`} onClick={() => onSelectClip(clip.id)}>
            {clip.name} · {clip.track} {clip.muted ? '(Muted)' : ''}
          </button>
        ))}
      </div>
      {selected ? (
        <div className="clip-actions">
          <label>Rename Clip<input value={selected.name} onChange={(e) => onRename(selected.id, e.target.value)} /></label>
          <div className="row wrap">
            <button className="btn secondary" onClick={() => onDuplicate(selected.id)}>Duplicate</button>
            <button className="btn secondary" onClick={() => onMute(selected.id)}>{selected.muted ? 'Unmute Clip' : 'Mute Clip'}</button>
            <button className="btn danger" onClick={() => onDelete(selected.id)}>Delete</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
