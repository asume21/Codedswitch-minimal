import React from 'react';

const PianoKeys = ({ notePositions, NOTE_HEIGHT }) => {
  return (
    <div className="piano-keys">
      {notePositions.map(({ note, position, isBlackKey }) => (
        <div
          key={position}
          className={`piano-key ${isBlackKey ? 'black-key' : 'white-key'} ${note.includes('C') ? 'c-note' : ''}`}
          style={{ height: NOTE_HEIGHT }}
        >
          {note.includes('C') && <span className="note-label">{note}</span>}
          {!note.includes('C') && note.includes('F') && <span className="note-label small">{note}</span>}
        </div>
      ))}
    </div>
  );
};

export default PianoKeys;
