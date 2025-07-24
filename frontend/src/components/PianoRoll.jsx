import React from 'react';
import './PianoRoll.css';
import AdvancedControls from './AdvancedControls.jsx';
import TransportControls from './TransportControls.jsx';
import PianoKeys from './PianoKeys.jsx';
import usePianoRollLogic from './usePianoRollLogic.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import ChordProgressionGenerator from './ChordProgressionGenerator.jsx';

const PianoRoll = ({ notes, setNotes, width = 1000, height = 300 }) => {
  // Use our custom hook for all logic and state
  const logic = usePianoRollLogic({ notes, setNotes, width, height });

  return (
    <div className="piano-roll-container">
      {/* Header with controls */}
      <div className="piano-roll-header">
        <div className="piano-roll-title">Piano Roll Editor</div>
        <div className="piano-roll-settings">
          <div className="setting-group">
            <label>BPM:</label>
            <input 
              type="number" 
              value={logic.bpm} 
              onChange={(e) => logic.setBpm(parseInt(e.target.value))} 
              min="40" 
              max="300"
              className="bpm-input"
            />
          </div>
          <div className="setting-group">
            <label>Time:</label>
            <select 
              value={logic.timeSignature} 
              onChange={(e) => logic.setTimeSignature(e.target.value)}
              className="time-sig-select"
            >
              <option value="4/4">4/4</option>
              <option value="3/4">3/4</option>
              <option value="6/8">6/8</option>
            </select>
          </div>
          <div className="setting-group">
            <label>Grid:</label>
            <select 
              value={logic.gridResolution} 
              onChange={(e) => logic.setGridResolution(parseInt(e.target.value))}
              className="grid-res-select"
            >
              <option value="4">1/4</option>
              <option value="8">1/8</option>
              <option value="16">1/16</option>
              <option value="32">1/32</option>
            </select>
          </div>
          <div className="setting-group">
            <button onClick={() => logic.changeOctave(-1)} disabled={logic.currentOctave <= 0} className="octave-btn">
              <FontAwesomeIcon icon={faMinus} /> Octave
            </button>
            <div className="current-octave">O: {logic.currentOctave}</div>
            <button onClick={() => logic.changeOctave(1)} disabled={logic.currentOctave >= 7} className="octave-btn">
              <FontAwesomeIcon icon={faPlus} /> Octave
            </button>
          </div>
        </div>
      </div>
      
      {/* Timeline ruler at the top */}
      <div className="timeline-ruler" style={{ height: logic.TIMELINE_HEIGHT, marginLeft: logic.PIANO_KEY_WIDTH }}>
        {Array(logic.MEASURES).fill().map((_, i) => (
          <div key={i} className="measure-marker">
            <span className="measure-number">{i + 1}</span>
          </div>
        ))}
      </div>
      
      {/* Chord Progression Generator */}
      <div className="chord-section">
        <ChordProgressionGenerator
          currentKey={logic.currentKey}
          currentScale={logic.currentScale}
          onChordSelect={(chord) => {
            // Convert chord to notes and add to piano roll
            const chordNotes = chord.notes.map((noteName, index) => ({
              id: Date.now() + index,
              note: noteName,
              velocity: 80,
              start: logic.gridPosition * logic.gridResolution,
              duration: logic.gridResolution,
              selected: false
            }))
            logic.setNotes(prev => [...prev, ...chordNotes])
          }}
        />
      </div>

      {/* Piano roll main area */}
      <div className="piano-roll-wrapper" ref={logic.pianoRollRef} style={{ transform: `translateX(-${logic.viewportStart}px)` }}>
        {/* Piano keys component */}
        <PianoKeys notePositions={logic.notePositions} NOTE_HEIGHT={logic.NOTE_HEIGHT} />
        
        {/* Main grid */}
        <div 
          className="piano-grid" 
          ref={logic.gridRef}
          onMouseDown={logic.handleGridMouseDown}
        >
          {/* Playhead indicator */}
          {logic.isPlaying && (
            <div 
              ref={logic.playheadRef}
              className="playhead"
              style={{
                left: logic.beatToX(logic.playheadPosition),
                height: '100%'
              }}
            />
          )}

          {/* Horizontal lines for each note */}
          {logic.notePositions.map(({ note, position }) => (
            <React.Fragment key={position}>
              <div
                className={`grid-line horizontal ${note.includes('C') ? 'octave-line' : ''}`}
                style={{ top: position * logic.NOTE_HEIGHT, height: logic.NOTE_HEIGHT }}
              />
              {/* Highlight notes in the selected scale if snap to scale is enabled */}
              {logic.snapToScale && note.includes(logic.currentKey) && 
               MusicTheory.isNoteInScale(note, logic.currentKey, logic.currentScale) && (
                <div 
                  className="grid-highlight" 
                  style={{ 
                    top: position * logic.NOTE_HEIGHT,
                    height: logic.NOTE_HEIGHT 
                  }} 
                />
              )}
            </React.Fragment>
          ))}
          
          {/* Vertical lines for beat divisions */}
          {Array(logic.MEASURES * 16 + 1).fill().map((_, i) => {
            const beatInMeasure = i % 16;
            const isMeasureLine = beatInMeasure === 0;
            const isBeatLine = beatInMeasure % 4 === 0;
            return (
              <div 
                key={i} 
                className={`grid-line vertical ${isMeasureLine ? 'bar-line' : ''} ${isBeatLine ? 'beat-line' : ''}`}
                style={{ left: i * (logic.GRID_SIZE / 4) }}
              />
            );
          })}
          
          {/* Render notes */}
          {notes.map((note) => {
            const x = logic.beatToX(note.start);
            const y = logic.noteToY(note.midiNote);
            const noteWidth = logic.beatToX(note.duration);
            
            return (
              <div 
                key={note.id}
                className={`note ${logic.selectedNote === note.id ? 'selected' : ''} ${note.type === 'chord' ? 'chord-note' : ''} ${note.type === 'pattern' ? 'pattern-note' : ''}`}
                style={{ 
                  left: `${x}px`, 
                  top: `${y}px`, 
                  width: `${noteWidth}px`,
                  height: `${logic.NOTE_HEIGHT}px`,
                  opacity: Math.max(0.5, Math.min(1, (note.velocity || 100) / 127))
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  logic.setMouseDown(true);
                  logic.setStartPosition({ x, y });
                  logic.setSelectedNote(note.id);
                  logic.setDraggedNote(note.id);
                }}
              >
                <div className="note-label">
                  {logic.NOTE_NAMES[note.midiNote % 12] + Math.floor(note.midiNote / 12 - 1)}
                </div>
                <div 
                  className="note-resize-handle"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    logic.setIsResizing(true);
                    logic.setSelectedNote(note.id);
                    logic.setMouseDown(true);
                  }}
                />
                <div 
                  className="note-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    logic.deleteNote(note.id);
                  }}
                >
                  ×
                </div>
                {/* Note velocity indicator - subtle visual cue */}
                {note.velocity && (
                  <div 
                    className="velocity-indicator"
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      left: '4px',
                      right: '4px',
                      height: '3px',
                      background: `rgba(255, 255, 255, ${Math.min(1, note.velocity / 127) * 0.8})`,
                      borderRadius: '1px'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Velocity editor */}
      {logic.showVelocityEditor && (
        <div className="velocity-editor">
          {notes.map((note) => {
            const x = logic.beatToX(note.start);
            const width = Math.max(4, logic.beatToX(note.duration));
            const height = Math.min(60, Math.max(5, (note.velocity || 100) / 127 * 60));
            
            return (
              <div 
                key={`velocity-${note.id}`}
                className={`velocity-bar ${logic.selectedNote === note.id ? 'selected' : ''}`}
                style={{
                  left: `${x}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  marginRight: '1px'
                }}
                onClick={() => {
                  logic.setSelectedNote(note.id);
                }}
                onDoubleClick={() => {
                  logic.applyVelocity([note.id], logic.velocityValue);
                }}
              />
            );
          })}
        </div>
      )}
      
      {/* Transport controls */}
      <TransportControls 
        isPlaying={logic.isPlaying}
        isRecording={logic.isRecording}
        showAdvancedControls={logic.showAdvancedControls}
        playheadPosition={logic.playheadPosition}
        getBeatsPerMeasure={() => {
          const [numerator] = logic.timeSignature.split('/').map(Number);
          return numerator;
        }}
        autoScroll={logic.autoScroll}
        onPlay={logic.startPlayback}
        onStop={logic.stopPlayback}
        onRecord={logic.toggleRecording}
        onToggleAdvanced={logic.toggleAdvancedControls}
        onAutoScrollChange={logic.setAutoScroll}
      />
      
      {/* Advanced controls panel */}
      {logic.showAdvancedControls && (
        <AdvancedControls
          currentKey={logic.currentKey}
          setCurrentKey={logic.setCurrentKey}
          currentScale={logic.currentScale}
          setCurrentScale={logic.setCurrentScale}
          snapToScale={logic.snapToScale}
          setSnapToScale={logic.setSnapToScale}
          applyScaleSnapping={logic.applyScaleSnapping}
          chordMode={logic.chordMode}
          setChordMode={logic.setChordMode}
          currentChordType={logic.currentChordType}
          setCurrentChordType={logic.setCurrentChordType}
          patternMode={logic.patternMode}
          setPatternMode={logic.setPatternMode}
          selectedPattern={logic.selectedPattern}
          setSelectedPattern={logic.setSelectedPattern}
          quantizeEnabled={logic.quantizeEnabled}
          setQuantizeEnabled={logic.setQuantizeEnabled}
          applyQuantization={logic.applyQuantization}
          gridResolution={logic.gridResolution}
          updateGridResolution={logic.updateGridResolution}
          generateVariation={logic.generateVariation}
          showVelocityEditor={logic.showVelocityEditor}
          setShowVelocityEditor={logic.setShowVelocityEditor}
          velocityValue={logic.velocityValue}
          setVelocityValue={logic.setVelocityValue}
          applyVelocityToSelectedNotes={logic.applyVelocityToSelectedNotes}
        />
      )}
    </div>
  );
};

export default PianoRoll;
