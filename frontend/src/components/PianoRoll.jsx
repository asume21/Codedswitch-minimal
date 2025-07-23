import React, { useState, useEffect, useRef } from 'react';
import './PianoRoll.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStop, faRecordVinyl, faCog, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

const PianoRoll = ({ notes, setNotes, width = 1000, height = 300 }) => {
  const [draggedNote, setDraggedNote] = useState(null);
  const [currentOctave, setCurrentOctave] = useState(4);
  const [mouseDown, setMouseDown] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [gridResolution, setGridResolution] = useState(16); // 16th notes
  const [autoScroll, setAutoScroll] = useState(true);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [viewportStart, setViewportStart] = useState(0); // horizontal scroll position
  
  const pianoRollRef = useRef(null);
  const gridRef = useRef(null);
  const playheadRef = useRef(null);
  const playIntervalRef = useRef(null);
  
  // Constants for the piano roll
  const NOTE_HEIGHT = 20;
  const GRID_SIZE = 25; // pixels per 16th note
  const OCTAVES = 7; // 7 octaves
  const NOTES_PER_OCTAVE = 12;
  const TOTAL_NOTES = NOTES_PER_OCTAVE * OCTAVES;
  const PIANO_KEY_WIDTH = 60;
  const TIMELINE_HEIGHT = 25;
  const TRANSPORT_HEIGHT = 40;
  const MEASURES = 16; // Number of measures to display
  
  const OCTAVE_C_NOTES = [0, 12, 24, 36, 48, 60, 72, 84];
  
  const NOTE_NAMES = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
  ];

  // Create an array of all note positions
  const notePositions = Array(TOTAL_NOTES).fill().map((_, i) => {
    const octave = Math.floor(i / NOTES_PER_OCTAVE);
    const noteIndex = i % NOTES_PER_OCTAVE;
    return {
      note: `${NOTE_NAMES[noteIndex]}${octave}`,
      position: i,
      isBlackKey: [1, 3, 6, 8, 10].includes(noteIndex)
    };
  }).reverse(); // Reverse so higher notes are at the top

  // Convert MIDI note number to y position
  const noteToY = (midiNote) => {
    return (TOTAL_NOTES - 1 - (midiNote - 21)) * NOTE_HEIGHT;
  };
  
  // Convert y position to MIDI note number
  const yToNote = (y) => {
    const noteIndex = Math.floor(y / NOTE_HEIGHT);
    return Math.min(Math.max(21, 127 - noteIndex), 108);
  };
  
  // Convert beat position to x position
  const beatToX = (beat) => {
    return beat * GRID_SIZE;
  };
  
  // Convert x position to beat position
  const xToBeat = (x) => {
    return Math.max(0, Math.floor(x / GRID_SIZE) * 0.25);
  };
  
  // Handle mouse down on the grid
  const handleGridMouseDown = (e) => {
    if (!gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMouseDown(true);
    setStartPosition({ x, y });
    
    // Check if clicking on an existing note
    const clickedNote = notes.find(note => {
      const noteX = beatToX(note.start);
      const noteY = noteToY(note.midiNote);
      const noteEndX = noteX + beatToX(note.duration);
      
      return (
        x >= noteX && x <= noteEndX &&
        y >= noteY && y <= noteY + NOTE_HEIGHT
      );
    });
    
    if (clickedNote) {
      // Check if clicking on the resize handle (right edge)
      const noteX = beatToX(clickedNote.start);
      const noteEndX = noteX + beatToX(clickedNote.duration);
      
      if (x >= noteEndX - 10 && x <= noteEndX) {
        setIsResizing(true);
        setSelectedNote(clickedNote.id);
        return;
      }
      
      setDraggedNote(clickedNote.id);
      setSelectedNote(clickedNote.id);
    } else {
      // Create a new note
      const midiNote = yToNote(y);
      const beat = xToBeat(x);
      
      const newNote = {
        id: Date.now(),
        midiNote,
        start: beat,
        duration: 0.5, // 8th note duration
        velocity: 100
      };
      
      setNotes([...notes, newNote]);
      setSelectedNote(newNote.id);
    }
  };
  
  // Handle mouse move on the grid
  const handleGridMouseMove = (e) => {
    if (!mouseDown || !gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isResizing) {
      // Resize the note
      setNotes(notes.map(note => {
        if (note.id === selectedNote) {
          const newDuration = Math.max(0.25, xToBeat(x) - note.start);
          return { ...note, duration: newDuration };
        }
        return note;
      }));
    } else if (draggedNote) {
      // Move the note
      setNotes(notes.map(note => {
        if (note.id === draggedNote) {
          const deltaX = x - startPosition.x;
          const deltaY = y - startPosition.y;
          
          const newBeat = Math.max(0, xToBeat(beatToX(note.start) + deltaX));
          const newMidiNote = Math.min(Math.max(21, note.midiNote + Math.round(deltaY / NOTE_HEIGHT * -1)), 108);
          
          return { ...note, start: newBeat, midiNote: newMidiNote };
        }
        return note;
      }));
      
      setStartPosition({ x, y });
    } else if (selectedNote) {
      // Resize the new note being created
      const beat = xToBeat(x);
      
      setNotes(notes.map(note => {
        if (note.id === selectedNote) {
          const duration = Math.max(0.25, beat - note.start);
          return { ...note, duration };
        }
        return note;
      }));
    }
  };
  
  // Handle mouse up
  const handleMouseUp = () => {
    setMouseDown(false);
    setDraggedNote(null);
    setIsResizing(false);
  };

  // Handle deleting a note
  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
    if (selectedNote === id) {
      setSelectedNote(null);
    }
  };
  
  // Handle octave change
  const changeOctave = (delta) => {
    const newOctave = Math.min(Math.max(0, currentOctave + delta), 7);
    setCurrentOctave(newOctave);
  };
  
  // Handle playback start
  const startPlayback = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    
    // Calculate time per 16th note in milliseconds
    const timePerBeat = 60000 / bpm;
    const timePerSixteenth = timePerBeat / 4;
    
    // Reset playhead position
    setPlayheadPosition(viewportStart);
    
    // Set up the interval to move the playhead
    playIntervalRef.current = setInterval(() => {
      setPlayheadPosition(prevPos => {
        const newPos = prevPos + 0.25; // Move by 1/16th note
        
        // Auto-scroll if enabled
        if (autoScroll && gridRef.current) {
          const gridWidth = gridRef.current.clientWidth;
          if (beatToX(newPos) > viewportStart + gridWidth * 0.7) {
            setViewportStart(prevStart => prevStart + GRID_SIZE);
          }
        }
        
        return newPos;
      });
    }, timePerSixteenth);
  };
  
  // Handle playback stop
  const stopPlayback = () => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  };
  
  // Handle recording toggle
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      stopPlayback();
    } else {
      setIsRecording(true);
      startPlayback();
    }
  };
  
  // Update grid resolution
  const updateGridResolution = (resolution) => {
    setGridResolution(resolution);
  };
  
  // Calculate beats per measure from time signature
  const getBeatsPerMeasure = () => {
    return parseInt(timeSignature.split('/')[0]);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);
  
  // Attach and detach event listeners
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleGridMouseMove);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleGridMouseMove);
    };
  }, [mouseDown, draggedNote, startPosition, isResizing, selectedNote]);

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
              value={bpm} 
              onChange={(e) => setBpm(parseInt(e.target.value))} 
              min="40" 
              max="300"
              className="bpm-input"
            />
          </div>
          <div className="setting-group">
            <label>Time:</label>
            <select 
              value={timeSignature} 
              onChange={(e) => setTimeSignature(e.target.value)}
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
              value={gridResolution} 
              onChange={(e) => updateGridResolution(parseInt(e.target.value))}
              className="grid-res-select"
            >
              <option value="4">1/4</option>
              <option value="8">1/8</option>
              <option value="16">1/16</option>
              <option value="32">1/32</option>
            </select>
          </div>
          <div className="setting-group">
            <button onClick={() => changeOctave(-1)} disabled={currentOctave <= 0} className="octave-btn">
              <FontAwesomeIcon icon={faMinus} /> Octave
            </button>
            <div className="current-octave">O: {currentOctave}</div>
            <button onClick={() => changeOctave(1)} disabled={currentOctave >= 7} className="octave-btn">
              <FontAwesomeIcon icon={faPlus} /> Octave
            </button>
          </div>
        </div>
      </div>
      
      {/* Timeline ruler at the top */}
      <div className="timeline-ruler" style={{ height: TIMELINE_HEIGHT, marginLeft: PIANO_KEY_WIDTH }}>
        {Array(MEASURES).fill().map((_, i) => (
          <div key={i} className="measure-marker">
            <span className="measure-number">{i + 1}</span>
          </div>
        ))}
      </div>
      
      {/* Piano roll main area */}
      <div className="piano-roll-wrapper" ref={pianoRollRef} style={{ transform: `translateX(-${viewportStart}px)` }}>
        {/* Piano keys on the left */}
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
        
        {/* Main grid */}
        <div 
          className="piano-grid" 
          ref={gridRef}
          onMouseDown={handleGridMouseDown}
        >
          {/* Playhead indicator */}
          {isPlaying && (
            <div 
              ref={playheadRef}
              className="playhead"
              style={{
                left: beatToX(playheadPosition),
                height: '100%'
              }}
            />
          )}

          {/* Horizontal lines for each note */}
          {notePositions.map(({ note, position }) => (
            <div 
              key={position} 
              className={`grid-line horizontal ${note.includes('C') ? 'octave-line' : ''}`}
              style={{ top: position * NOTE_HEIGHT, height: NOTE_HEIGHT }}
            />
          ))}
          
          {/* Vertical lines for beat divisions */}
          {Array(MEASURES * 16 + 1).fill().map((_, i) => {
            const beatInMeasure = i % 16;
            const isMeasureLine = beatInMeasure === 0;
            const isBeatLine = beatInMeasure % 4 === 0;
            return (
              <div 
                key={i} 
                className={`grid-line vertical ${isMeasureLine ? 'bar-line' : ''} ${isBeatLine ? 'beat-line' : ''}`}
                style={{ left: i * (GRID_SIZE / 4) }}
              />
            );
          })}
          
          {/* Render notes */}
          {notes.map((note) => {
            const x = beatToX(note.start);
            const y = noteToY(note.midiNote);
            const noteWidth = beatToX(note.duration);
            
            return (
              <div
                key={note.id}
                className={`note ${selectedNote === note.id ? 'selected' : ''}`}
                style={{
                  left: x,
                  top: y,
                  width: noteWidth,
                  height: NOTE_HEIGHT
                }}
              >
                <div className="note-label">
                  {NOTE_NAMES[note.midiNote % 12] + Math.floor(note.midiNote / 12 - 1)}
                </div>
                <div 
                  className="note-resize-handle"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setSelectedNote(note.id);
                    setMouseDown(true);
                  }}
                />
                <div 
                  className="note-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                >
                  ×
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Transport controls */}
      <div className="transport-controls" style={{ height: TRANSPORT_HEIGHT }}>
        <div className="transport-buttons">
          <button 
            className={`transport-button ${isPlaying ? 'active' : ''}`} 
            onClick={isPlaying ? stopPlayback : startPlayback}
          >
            <FontAwesomeIcon icon={isPlaying ? faStop : faPlay} />
            <span className="btn-label">{isPlaying ? 'Stop' : 'Play'}</span>
          </button>
          <button 
            className={`transport-button ${isRecording ? 'recording' : ''}`} 
            onClick={toggleRecording}
          >
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
          <button className="transport-button">
            <FontAwesomeIcon icon={faCog} />
          </button>
          <label className="auto-scroll-label">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={(e) => setAutoScroll(e.target.checked)} 
            />
            Auto-scroll
          </label>
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;
