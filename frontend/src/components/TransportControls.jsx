import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStop, faRecordVinyl, faSliders } from '@fortawesome/free-solid-svg-icons';

const TransportControls = ({
  isPlaying, isRecording, showAdvancedControls, playheadPosition, getBeatsPerMeasure,
  autoScroll, onPlay, onStop, onRecord, onToggleAdvanced, onAutoScrollChange,
}) => (
  <div className="transport-controls">
    <div className="transport-buttons">
      <button className={`transport-button ${isPlaying ? 'active' : ''}`} onClick={isPlaying ? onStop : onPlay}>
        <FontAwesomeIcon icon={isPlaying ? faStop : faPlay} />
        <span className="btn-label">{isPlaying ? 'Stop' : 'Play'}</span>
      </button>
      <button className={`transport-button ${isRecording ? 'recording' : ''}`} onClick={onRecord}>
        <FontAwesomeIcon icon={faRecordVinyl} />
        <span className="btn-label">Record</span>
      </button>
    </div>
    <div className="transport-position">
      <span className="position-display">
        {Math.floor(playheadPosition / getBeatsPerMeasure()) + 1}.{Math.floor((playheadPosition % getBeatsPerMeasure()) * 4) + 1}.{Math.floor(((playheadPosition * 4) % 4) * 4) + 1}
      </span>
    </div>
    <div className="transport-right">
      <button className={`transport-button ${showAdvancedControls ? 'active' : ''}`} onClick={onToggleAdvanced}>
        <FontAwesomeIcon icon={faSliders} />
        <span className="btn-label">Advanced</span>
      </button>
      <label className="auto-scroll-label">
        <input type="checkbox" checked={autoScroll} onChange={e => onAutoScrollChange(e.target.checked)} />
        Auto-scroll
      </label>
    </div>
  </div>
);

export default TransportControls;
