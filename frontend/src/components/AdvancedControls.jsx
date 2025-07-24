import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMagic, faMusic, faSortAmountUp, faVolumeUp, 
  faRandom, faArrowsAlt, faWaveSquare, faExchangeAlt 
} from '@fortawesome/free-solid-svg-icons';
import * as MusicTheory from '../utils/MusicTheory';

const AdvancedControls = ({
  currentKey, setCurrentKey, currentScale, setCurrentScale, snapToScale, setSnapToScale,
  applyScaleSnapping, chordMode, setChordMode, currentChordType, setCurrentChordType,
  patternMode, setPatternMode, selectedPattern, setSelectedPattern, quantizeEnabled, setQuantizeEnabled,
  applyQuantization, gridResolution, updateGridResolution, generateVariation,
  showVelocityEditor, setShowVelocityEditor, velocityValue, setVelocityValue, applyVelocityToSelectedNotes,
}) => (
  <div className="advanced-controls-panel">
    {/* Music Theory Section */}
    <div className="advanced-controls-section">
      <h3>
        <FontAwesomeIcon icon={faMusic} />
        <span>Music Theory</span>
      </h3>
      <div className="control-row">
        <label>
          Key:
          <select 
            value={currentKey} 
            onChange={(e) => setCurrentKey(e.target.value)}
          >
            {MusicTheory.NOTES.map(note => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </label>
        <label>
          Scale:
          <select 
            value={currentScale} 
            onChange={(e) => setCurrentScale(e.target.value)}
          >
            {Object.keys(MusicTheory.SCALES).map(scale => (
              <option key={scale} value={scale}>{scale}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="control-row">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={snapToScale} 
            onChange={(e) => setSnapToScale(e.target.checked)} 
          />
          Snap to Scale
        </label>
        <button 
          className="tool-button" 
          onClick={() => applyScaleSnapping()}
          title="Snap all notes to the selected scale"
        >
          <FontAwesomeIcon icon={faMagic} />
          Apply Scale
        </button>
      </div>
    </div>

    {/* Editing Tools Section */}
    <div className="advanced-controls-section">
      <h3>
        <FontAwesomeIcon icon={faWaveSquare} />
        <span>Editing Tools</span>
      </h3>
      <div className="control-row">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={chordMode} 
            onChange={(e) => setChordMode(e.target.checked)} 
          />
          Chord Mode
        </label>
        <select 
          value={currentChordType} 
          onChange={(e) => setCurrentChordType(e.target.value)}
          disabled={!chordMode}
        >
          <option value="maj">Major</option>
          <option value="min">Minor</option>
          <option value="dim">Diminished</option>
          <option value="aug">Augmented</option>
          <option value="maj7">Major 7th</option>
          <option value="min7">Minor 7th</option>
          <option value="dom7">Dominant 7th</option>
          <option value="sus4">Sus4</option>
        </select>
      </div>
      <div className="control-row">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={patternMode} 
            onChange={(e) => setPatternMode(e.target.checked)} 
          />
          Pattern Mode
        </label>
        <select 
          value={selectedPattern} 
          onChange={(e) => setSelectedPattern(e.target.value)}
          disabled={!patternMode}
        >
          <option value="ascending">Ascending</option>
          <option value="descending">Descending</option>
          <option value="arpeggioUp">Arpeggio Up</option>
          <option value="arpeggioDown">Arpeggio Down</option>
          <option value="alternate">Alternate</option>
          <option value="random">Random</option>
        </select>
      </div>
      <div className="control-row">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={quantizeEnabled} 
            onChange={(e) => setQuantizeEnabled(e.target.checked)} 
          />
          Quantize
        </label>
        <button 
          className="tool-button" 
          onClick={() => applyQuantization()}
          title="Quantize all notes to the grid"
        >
          <FontAwesomeIcon icon={faSortAmountUp} />
          Apply Quantize
        </button>
      </div>
    </div>

    {/* Variations Section */}
    <div className="advanced-controls-section">
      <h3>
        <FontAwesomeIcon icon={faExchangeAlt} />
        <span>Variations</span>
      </h3>
      <div className="control-row">
        <button 
          className="tool-button" 
          onClick={() => generateVariation('inversion')}
          title="Create melodic inversion"
        >
          <FontAwesomeIcon icon={faArrowsAlt} />
          Invert
        </button>
        <button 
          className="tool-button" 
          onClick={() => generateVariation('retrograde')}
          title="Reverse the melody"
        >
          <FontAwesomeIcon icon={faExchangeAlt} />
          Retrograde
        </button>
        <button 
          className="tool-button" 
          onClick={() => generateVariation('randomize')}
          title="Randomize note pitches while preserving rhythm"
        >
          <FontAwesomeIcon icon={faRandom} />
          Randomize
        </button>
      </div>
    </div>

    {/* Velocity Controls Section */}
    <div className="advanced-controls-section">
      <h3>
        <FontAwesomeIcon icon={faVolumeUp} />
        <span>Velocity</span>
      </h3>
      <div className="control-row">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={showVelocityEditor} 
            onChange={(e) => setShowVelocityEditor(e.target.checked)} 
          />
          Show Velocity Editor
        </label>
      </div>
      <div className="control-row velocity-slider">
        <label>
          Velocity:
          <input 
            type="range" 
            min="1" 
            max="127" 
            value={velocityValue} 
            onChange={(e) => setVelocityValue(parseInt(e.target.value))} 
          />
          <span className="velocity-value">{velocityValue}</span>
        </label>
        <button 
          className="tool-button" 
          onClick={() => applyVelocityToSelectedNotes()}
          title="Apply current velocity to selected notes"
        >
          <FontAwesomeIcon icon={faVolumeUp} />
          Apply Velocity
        </button>
      </div>
    </div>
  </div>
);

export default AdvancedControls;
