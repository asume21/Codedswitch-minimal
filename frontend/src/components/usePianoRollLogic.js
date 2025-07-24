import { useState, useEffect, useRef } from 'react';
import * as MusicTheory from '../utils/MusicTheory';
import * as MelodyGenerator from '../utils/MelodyGenerator';

const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export default function usePianoRollLogic({ notes, setNotes, width = 1000, height = 300 }) {
  // State
  const [draggedNote, setDraggedNote] = useState(null);
  const [currentOctave, setCurrentOctave] = useState(4);
  const [mouseDown, setMouseDown] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [gridResolution, setGridResolution] = useState(16);
  const [autoScroll, setAutoScroll] = useState(true);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [viewportStart, setViewportStart] = useState(0);

  // Advanced features
  const [currentKey, setCurrentKey] = useState('C');
  const [currentScale, setCurrentScale] = useState('major');
  const [snapToScale, setSnapToScale] = useState(false);
  const [chordMode, setChordMode] = useState(false);
  const [currentChordType, setCurrentChordType] = useState('maj');
  const [showVelocityEditor, setShowVelocityEditor] = useState(false);
  const [velocityValue, setVelocityValue] = useState(100);
  const [patternMode, setPatternMode] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState('ascending');
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [quantizeEnabled, setQuantizeEnabled] = useState(false);

  // Refs
  const pianoRollRef = useRef(null);
  const gridRef = useRef(null);
  const playheadRef = useRef(null);
  const playIntervalRef = useRef(null);

  // Constants
  const NOTE_HEIGHT = 20;
  const GRID_SIZE = 25;
  const OCTAVES = 7;
  const NOTES_PER_OCTAVE = 12;
  const TOTAL_NOTES = NOTES_PER_OCTAVE * OCTAVES;
  const PIANO_KEY_WIDTH = 60;
  const TIMELINE_HEIGHT = 25;
  const TRANSPORT_HEIGHT = 40;
  const MEASURES = 16;

  // Note positions
  const notePositions = Array(TOTAL_NOTES).fill().map((_, i) => {
    const octave = Math.floor(i / NOTES_PER_OCTAVE);
    const noteIndex = i % NOTES_PER_OCTAVE;
    return {
      note: `${NOTE_NAMES[noteIndex]}${octave}`,
      position: i,
      isBlackKey: [1, 3, 6, 8, 10].includes(noteIndex)
    };
  }).reverse();

  // Utility functions
  const beatToX = (beat) => beat * GRID_SIZE;
  const xToBeat = (x) => Math.max(0, x / GRID_SIZE);
  const yToNote = (y) => {
    const index = Math.floor(y / NOTE_HEIGHT);
    return notePositions[Math.min(index, notePositions.length - 1)].note;
  };
  const noteToY = (midiNote) => {
    const reverseIndex = TOTAL_NOTES - 1 - (midiNote - 12);
    return reverseIndex * NOTE_HEIGHT;
  };
  const getBeatsPerMeasure = () => {
    const [numerator] = timeSignature.split('/').map(Number);
    return numerator;
  };

  // Note management
  const createNote = (beat, midiNote, duration = 1, velocity = velocityValue) => {
    const noteId = Date.now().toString();
    const newNote = {
      id: noteId,
      start: beat,
      duration: duration,
      midiNote: midiNote,
      velocity: velocity
    };

    if (chordMode && currentChordType) {
      const chordNotes = MusicTheory.createChord(midiNote, currentChordType);
      const chordObjects = chordNotes.map((note, i) => ({
        id: `${noteId}-${i}`,
        start: beat,
        duration: duration,
        midiNote: note,
        velocity: velocity,
        type: 'chord'
      }));
      setNotes([...notes, ...chordObjects]);
      return chordObjects;
    } else if (patternMode && selectedPattern) {
      const patternNotes = MusicTheory.createPattern(midiNote, selectedPattern, gridResolution);
      const patternObjects = patternNotes.map((note, i) => ({
        id: `${noteId}-${i}`,
        start: beat + i * (1 / gridResolution),
        duration: 1 / gridResolution,
        midiNote: note,
        velocity: velocity,
        type: 'pattern'
      }));
      setNotes([...notes, ...patternObjects]);
      return patternObjects;
    } else {
      setNotes([...notes, newNote]);
      return [newNote];
    }
  };

  const deleteNote = (noteId) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  const updateNote = (noteId, changes) => {
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, ...changes } : note
    ));
  };

  const resizeNote = (noteId, newDuration) => {
    updateNote(noteId, { duration: Math.max(1/gridResolution, newDuration) });
  };

  // Scale and quantization
  const applyScaleSnapping = (notesToSnap = notes) => {
    if (!snapToScale) return notesToSnap;
    
    const snappedNotes = MusicTheory.snapNotesToScale(notesToSnap, currentKey, currentScale);
    setNotes(snappedNotes);
    return snappedNotes;
  };

  const applyQuantization = (notesToQuantize = notes) => {
    const resolution = gridResolution;
    const quantizedNotes = MusicTheory.quantizeNotes(notesToQuantize, resolution);
    setNotes(quantizedNotes);
    return quantizedNotes;
  };

  const generateVariation = (variationType) => {
    if (notes.length === 0) return;
    
    const variationNotes = MelodyGenerator.generateMelodyVariation(notes, variationType);
    setNotes(variationNotes);
    return variationNotes;
  };

  // Velocity functions
  const applyVelocity = (noteIds, velocity) => {
    setNotes(notes.map(note => 
      noteIds.includes(note.id) ? { ...note, velocity } : note
    ));
  };

  const applyVelocityToSelectedNotes = () => {
    if (selectedNote) {
      applyVelocity([selectedNote], velocityValue);
    }
  };

  // Event handlers
  const handleGridMouseDown = (e) => {
    if (e.button !== 0) return; // Only handle left-clicks
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMouseDown(true);
    setStartPosition({ x, y });
    
    // Create a new note if not clicking on an existing one
    const beat = Math.floor(xToBeat(x) * gridResolution) / gridResolution;
    const noteElement = e.target.closest('.note');
    
    if (!noteElement) {
      const noteName = yToNote(y);
      const midiNote = MusicTheory.noteToMidi(noteName);
      createNote(beat, midiNote, 1 / gridResolution);
    }
  };

  const handleGridMouseMove = (e) => {
    if (!mouseDown) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (draggedNote) {
      const note = notes.find(n => n.id === draggedNote);
      if (note) {
        const dx = x - startPosition.x;
        const dy = y - startPosition.y;
        
        if (dx !== 0 || dy !== 0) {
          const gridX = Math.floor(xToBeat(x + dx) * gridResolution) / gridResolution;
          let newMidiNote = note.midiNote;
          
          // Only update Y position if moved enough vertically
          if (Math.abs(dy) >= NOTE_HEIGHT) {
            const noteName = yToNote(y);
            newMidiNote = MusicTheory.noteToMidi(noteName);
          }
          
          updateNote(note.id, {
            start: Math.max(0, gridX),
            midiNote: newMidiNote
          });
          
          setStartPosition({ x, y });
        }
      }
    } else if (isResizing && selectedNote) {
      const note = notes.find(n => n.id === selectedNote);
      if (note) {
        const dx = x - startPosition.x;
        const gridX = Math.max(0, dx / GRID_SIZE);
        const newDuration = Math.max(1/gridResolution, note.duration + gridX);
        resizeNote(note.id, newDuration);
        setStartPosition({ x, y });
      }
    }
  };

  const handleMouseUp = () => {
    if (mouseDown) {
      setMouseDown(false);
      if (isResizing) {
        setIsResizing(false);
      }
      setDraggedNote(null);
      
      // Apply quantization or scale snapping if enabled
      if (quantizeEnabled) {
        applyQuantization();
      }
      if (snapToScale) {
        applyScaleSnapping();
      }
    }
  };

  // Playback functions
  const startPlayback = () => {
    setIsPlaying(true);
    setPlayheadPosition(0);
    
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
    
    const bps = bpm / 60;
    const intervalTime = 1000 / (bps * 4); // Sixteenth note intervals
    
    playIntervalRef.current = setInterval(() => {
      setPlayheadPosition(prev => {
        const nextPos = prev + 0.25; // Advance by a sixteenth note
        
        // Auto-scroll if enabled
        if (autoScroll && pianoRollRef.current) {
          const playheadX = beatToX(nextPos);
          const viewportWidth = pianoRollRef.current.clientWidth - PIANO_KEY_WIDTH;
          
          if (playheadX > viewportStart + viewportWidth * 0.7) {
            setViewportStart(Math.max(0, playheadX - viewportWidth * 0.3));
          }
        }
        
        // Find notes that start at this position and play them
        const notesToPlay = notes.filter(note => 
          Math.abs(note.start - nextPos) < 0.1
        );
        
        if (notesToPlay.length > 0) {
          // Here you would trigger audio playback
          console.log('Play notes:', notesToPlay);
        }
        
        return nextPos;
      });
    }, intervalTime);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const toggleAdvancedControls = () => {
    setShowAdvancedControls(!showAdvancedControls);
  };

  const updateGridResolution = (res) => {
    setGridResolution(res);
  };

  const changeOctave = (direction) => {
    setCurrentOctave(prev => Math.min(7, Math.max(0, prev + direction)));
  };

  // Mouse event listeners
  useEffect(() => {
    if (mouseDown) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleGridMouseMove);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleGridMouseMove);
    };
  }, [mouseDown, draggedNote, startPosition, isResizing, selectedNote]);

  // Clean up playback interval
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    draggedNote, setDraggedNote,
    currentOctave, setCurrentOctave,
    mouseDown, setMouseDown,
    startPosition, setStartPosition,
    isResizing, setIsResizing,
    selectedNote, setSelectedNote,
    isPlaying, setIsPlaying,
    isRecording, setIsRecording,
    bpm, setBpm,
    timeSignature, setTimeSignature,
    gridResolution, setGridResolution, updateGridResolution,
    autoScroll, setAutoScroll,
    playheadPosition, setPlayheadPosition,
    viewportStart, setViewportStart,
    currentKey, setCurrentKey,
    currentScale, setCurrentScale,
    snapToScale, setSnapToScale,
    chordMode, setChordMode,
    currentChordType, setCurrentChordType,
    showVelocityEditor, setShowVelocityEditor,
    velocityValue, setVelocityValue,
    patternMode, setPatternMode,
    selectedPattern, setSelectedPattern,
    showAdvancedControls, setShowAdvancedControls, toggleAdvancedControls,
    quantizeEnabled, setQuantizeEnabled,
    
    // Refs
    pianoRollRef, gridRef, playheadRef, playIntervalRef,
    
    // Constants
    NOTE_HEIGHT, GRID_SIZE, OCTAVES, NOTES_PER_OCTAVE, TOTAL_NOTES,
    PIANO_KEY_WIDTH, TIMELINE_HEIGHT, TRANSPORT_HEIGHT, MEASURES,
    NOTE_NAMES, notePositions,
    
    // Utility functions
    beatToX, xToBeat, yToNote, noteToY, getBeatsPerMeasure,
    
    // Note management
    createNote, deleteNote, updateNote, resizeNote,
    
    // Scale and quantization
    applyScaleSnapping,
    applyQuantization,
    generateVariation,
    
    // Velocity functions
    applyVelocity, applyVelocityToSelectedNotes,
    
    // Event handlers
    handleGridMouseDown, handleGridMouseMove, handleMouseUp,
    
    // Playback functions
    startPlayback, stopPlayback, toggleRecording,
    
    // Other functions
    changeOctave
  };
}
