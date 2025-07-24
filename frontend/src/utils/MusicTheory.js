/**
 * MusicTheory.js - Advanced music theory utilities for CodedSwitch
 * Provides musical scales, chord progressions, and melody generation tools
 * for use in the piano roll and melody generation features.
 *
 * @module MusicTheory
 */

/**
 * Convert scale position to a MIDI note
 * @param {string} key - Root note of the scale, e.g., 'C', 'F#'
 * @param {string} scaleType - Type of scale from SCALES, e.g., 'major', 'minor'
 * @param {number} scalePosition - Position in the scale (0-based)
 * @param {number} octaveOffset - Number of octaves to offset from the base octave
 * @param {number} baseOctave - Base octave for the note
 * @returns {number} MIDI note number for the specified scale position
 */
export const scalePositionToMidi = (key, scaleType, scalePosition, octaveOffset = 0, baseOctave = 4) => {
  // Get scale notes
  const scaleNotes = getScaleNotes(key, scaleType);
  if (!scaleNotes.length) {
    console.warn('Could not generate scale notes in scalePositionToMidi');
    return 60; // Default to middle C as fallback
  }
  
  // Calculate octave shift based on scale position
  const octaveShift = Math.floor(scalePosition / scaleNotes.length);
  
  // Get note name from scale position
  const noteName = scaleNotes[((scalePosition % scaleNotes.length) + scaleNotes.length) % scaleNotes.length];
  
  // Calculate final octave with offsets
  const finalOctave = baseOctave + octaveShift + octaveOffset;
  
  // Return MIDI note
  return getMidiNote(noteName, finalOctave);
};

/**
 * Check if a note is in a particular scale
 * @param {string} noteName - Note name to check, e.g., 'C', 'F#'
 * @param {string} key - Root note of the scale
 * @param {string} scaleType - Type of scale from SCALES
 * @returns {boolean} True if the note is in the scale
 */
export const isNoteInScale = (noteName, key, scaleType = 'major') => {
  // Get just the note part without the octave (e.g., 'C4' -> 'C')
  const noteOnly = noteName.replace(/[0-9]/g, '');
  
  // Get scale notes
  const scaleNotes = getScaleNotes(key, scaleType);
  
  // Check if note is in scale
  return scaleNotes.includes(noteOnly);
};

// All notes in the chromatic scale
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Scale definitions (semitone intervals from root)
export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
  pentatonicMinor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10]
};

// Chord type definitions (semitone intervals from root)
export const CHORD_TYPES = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  dim7: [0, 3, 6, 9],
  hdim7: [0, 3, 6, 10],
  maj9: [0, 4, 7, 11, 14],
  min9: [0, 3, 7, 10, 14],
  dom9: [0, 4, 7, 10, 14]
};

// Common chord progressions by mood
export const PROGRESSIONS = {
  happy: [
    ['I', 'V', 'vi', 'IV'],
    ['I', 'IV', 'V'],
    ['I', 'vi', 'IV', 'V'],
    ['I', 'IV', 'I', 'V']
  ],
  sad: [
    ['vi', 'IV', 'I', 'V'],
    ['i', 'VI', 'III', 'VII'],
    ['i', 'iv', 'VII', 'III'],
    ['i', 'iv', 'v']
  ],
  tense: [
    ['i', 'V', 'i'],
    ['i', 'diminished', 'V'],
    ['i', 'VI', 'VII'],
    ['i', 'bII', 'bIII']
  ],
  peaceful: [
    ['I', 'iii', 'IV', 'vi'],
    ['I', 'vi', 'iii', 'IV'],
    ['I', 'V', 'vi', 'iii'],
    ['IV', 'I', 'V', 'vi']
  ],
  epic: [
    ['I', 'V', 'vi', 'iii'],
    ['i', 'VII', 'VI', 'VII'],
    ['I', 'V', 'vi', 'IV'],
    ['i', 'VI', 'III', 'VII']
  ]
};

// Roman numeral mapping to scale degrees
export const NUMERAL_TO_DEGREE = {
  'I': 0,
  'II': 1,
  'III': 2,
  'IV': 3,
  'V': 4,
  'VI': 5,
  'VII': 6,
  'i': 0,
  'ii': 1,
  'iii': 2, 
  'iv': 3,
  'v': 4,
  'vi': 5,
  'vii': 6
};

// Utility functions
/**
 * Get MIDI note number from note name and octave
 * @param {string} noteName - Note name, e.g., 'C', 'F#'
 * @param {number} octave - Octave number (0-10)
 * @returns {number} MIDI note number or fallback value if invalid
 */
export const getMidiNote = (noteName, octave) => {
  // Error handling for invalid inputs
  if (!noteName || typeof noteName !== 'string') {
    console.warn('Invalid note name provided to getMidiNote:', noteName);
    return 60; // Default to middle C as fallback
  }
  
  const noteIndex = NOTES.indexOf(noteName);
  if (noteIndex === -1) {
    console.warn('Note name not found in valid notes:', noteName);
    return 60; // Default to middle C as fallback
  }
  
  // Ensure octave is in valid range
  const safeOctave = Math.min(Math.max(0, octave || 4), 9);
  return (safeOctave + 1) * 12 + noteIndex;
};

/**
 * Get note name from MIDI note number
 * @param {number} midiNote - MIDI note number (0-127)
 * @returns {Object} Object with note name and octave {note: string, octave: number}
 */
export const getNoteFromMidi = (midiNote) => {
  // Error handling for invalid MIDI note
  if (midiNote === undefined || midiNote === null || isNaN(midiNote)) {
    console.warn('Invalid MIDI note provided to getNoteFromMidi:', midiNote);
    return { note: 'C', octave: 4 }; // Default to middle C as fallback
  }
  
  // Ensure midiNote is within valid range (0-127)
  const safeMidiNote = Math.min(Math.max(0, midiNote), 127);
  
  const octave = Math.floor(safeMidiNote / 12) - 1;
  const noteIndex = safeMidiNote % 12;
  return {
    note: NOTES[noteIndex],
    octave
  };
};

/**
 * Get the scale notes for a given key and scale type
 * @param {string} key - Root note of the scale, e.g., 'C', 'F#'
 * @param {string} scaleType - Type of scale from SCALES, e.g., 'major', 'minor'
 * @returns {Array} Array of note names in the scale
 */
export const getScaleNotes = (key, scaleType = 'major') => {
  // Error handling for invalid scale type
  if (!SCALES[scaleType]) {
    console.warn(`Scale type '${scaleType}' not found, using major scale instead`);
    scaleType = 'major'; // Fallback to major scale
  }
  
  // Error handling for invalid key
  const rootIndex = NOTES.indexOf(key);
  if (rootIndex === -1) {
    console.warn(`Invalid key '${key}', using C as default`);
    return getScaleNotes('C', scaleType); // Recursive call with valid key
  }
  
  return SCALES[scaleType].map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return NOTES[noteIndex];
  });
};

/**
 * Get the chord notes for a given root note and chord type
 * @param {string} rootNote - Root note of the chord, e.g., 'C', 'F#'
 * @param {string} chordType - Type of chord from CHORD_TYPES, e.g., 'maj', 'min7'
 * @param {number} octave - Base octave for the chord
 * @returns {Array} Array of MIDI note numbers for the chord
 */
export const getChordNotes = (rootNote, chordType = 'maj', octave = 4) => {
  // Error handling for invalid chord type
  if (!CHORD_TYPES[chordType]) {
    console.warn(`Chord type '${chordType}' not found, using major chord instead`);
    chordType = 'maj'; // Fallback to major chord
  }
  
  const rootIndex = NOTES.indexOf(rootNote);
  if (rootIndex === -1) return [];
  
  const rootMidi = (octave + 1) * 12 + rootIndex;
  
  return CHORD_TYPES[chordType].map(interval => rootMidi + interval);
};

/**
 * Get a chord progression based on key, scale and mood
 * @param {string} key - Root note of the key, e.g., 'C', 'F#'
 * @param {string} scaleType - Type of scale, e.g., 'major', 'minor'
 * @param {string} mood - Mood from PROGRESSIONS, e.g., 'happy', 'sad'
 * @param {number} length - Number of measures/bars
 * @returns {Array} Array of chord objects with root, type, and notes properties
 */
const generateChordProgression = (key, scaleType = 'major', mood = 'neutral', length = 4) => {
  // Default to happy progressions if mood not found or neutral
  const moodToUse = PROGRESSIONS[mood] ? mood : 'happy';
  
  // Pick a progression pattern based on the mood
  const progressionPatterns = PROGRESSIONS[moodToUse];
  const pattern = progressionPatterns[Math.floor(Math.random() * progressionPatterns.length)];
  
  // Get scale notes for the key
  const scaleNotes = getScaleNotes(key, scaleType);
  
  // Generate chords based on the roman numerals in the progression
  const chords = pattern.map(numeral => {
    // Determine if major or minor chord based on numeral case
    const isMajor = numeral === numeral.toUpperCase();
    const degree = NUMERAL_TO_DEGREE[numeral] || 0;
    
    // Get the root note for this degree of the scale
    const rootNote = scaleNotes[degree];
    
    // Determine chord type based on position in the scale and scale type
    let chordType = 'maj';
    
    if (!isMajor) {
      chordType = 'min';
    }
    
    // Create chord object with its properties
    return {
      root: rootNote,
      type: chordType,
      notes: getChordNotes(rootNote, chordType, 3) // Base octave 3
    };
  });
  
  // Repeat the progression to fill the requested length
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(chords[i % chords.length]);
  }
  
  return result;
};

/**
 * Generate a melodic pattern that fits a chord progression
 * @param {Array} chordProgression - Array of chord objects
 * @param {number} complexity - 0-1, controls rhythmic/melodic complexity
 * @returns {Array} Array of pattern objects with degree, octaveOffset, and timing properties
 */
const generateMelodicPattern = (chordProgression, complexity = 0.5) => {
  const pattern = [];
  
  // Number of notes per chord depends on complexity
  const notesPerChord = Math.max(2, Math.floor(4 + complexity * 8));
  
  chordProgression.forEach((chord, chordIndex) => {
    // For each chord, create several pattern notes
    for (let i = 0; i < notesPerChord; i++) {
      // Higher complexity means more variation in rhythm
      const timing = {
        startOffset: i / notesPerChord + (complexity > 0.7 ? (Math.random() * 0.1 - 0.05) : 0),
        duration: (1 / notesPerChord) * (complexity < 0.3 ? 1 : 0.8 + Math.random() * 0.4)
      };
      
      // Note selection: with higher complexity, sometimes pick notes outside the chord
      const useChordNote = Math.random() > complexity * 0.7;
      let noteIndex;
      
      if (useChordNote) {
        // Pick from chord tones
        noteIndex = Math.floor(Math.random() * chord.notes.length);
        
        pattern.push({
          midiNote: chord.notes[noteIndex],
          timing: {
            measure: chordIndex,
            ...timing
          },
          velocity: 70 + Math.floor(Math.random() * 40) // Random velocity for expressiveness
        });
      } else {
        // Pick a scale tone or passing tone
        const scalePosition = Math.floor(Math.random() * 7);
        const octaveOffset = Math.floor(Math.random() * 2);
        
        // Create a pattern element with relative values
        pattern.push({
          scalePosition,
          octaveOffset,
          timing: {
            measure: chordIndex,
            ...timing
          },
          velocity: 70 + Math.floor(Math.random() * 40)
        });
      }
    }
  });
  
  return pattern;
};

/**
 * Create actual notes with timing, duration, and velocity from a pattern
 * @param {Array} melodicPattern - Array of pattern objects
 * @param {number} complexity - 0-1 controls additional processing
 * @returns {Array} Array of note objects ready for the PianoRoll
 */
const createNotesFromPattern = (melodicPattern, complexity = 0.5) => {
  const notes = melodicPattern.map((patternNote, index) => {
    // Calculate absolute start time in beats
    const start = patternNote.timing.measure + patternNote.timing.startOffset;
    
    // Calculate duration, adding slight variations based on complexity
    const duration = patternNote.timing.duration * (1 + (complexity > 0.5 ? (Math.random() * 0.2 - 0.1) : 0));
    
    return {
      id: `note_${index}`,
      midiNote: patternNote.midiNote,
      start,
      duration,
      velocity: patternNote.velocity
    };
  });
  
  return notes;
};

/**
 * Generate a complete melody based on musical parameters
 * @param {Object} options - Melody generation options
 * @returns {Array} Array of note objects ready for the PianoRoll
 */
const generateMelody = (options = {}) => {
  const {
    key = 'C',
    scale = 'major',
    complexity = 0.5,
    length = 4,
    mood = 'neutral'
  } = options;
  
  // Generate chord progression
  const chordProgression = generateChordProgression(key, scale, mood, length);
  
  // Generate melodic pattern based on chord progression
  const melodicPattern = generateMelodicPattern(chordProgression, complexity);
  
  // Create actual notes from the pattern
  return createNotesFromPattern(melodicPattern, complexity);
};

/**
 * Harmonize a melody with appropriate chords
 * @param {Array} melody - Array of note objects
 * @param {string} key - Root note of the key
 * @param {string} scale - Scale type
 * @returns {Array} Array of chord objects aligned with the melody
 */
const harmonizeMelody = (melody, key = 'C', scale = 'major') => {
  // Group notes by measure
  const measureGroups = {};
  melody.forEach(note => {
    const measure = Math.floor(note.start);
    if (!measureGroups[measure]) {
      measureGroups[measure] = [];
    }
    measureGroups[measure].push(note);
  });
  
  // Get scale notes
  const scaleNotes = getScaleNotes(key, scale);
  
  // For each measure, find appropriate chord
  const chords = [];
  Object.entries(measureGroups).forEach(([measure, notes]) => {
    // Count occurrences of each scale degree
    const degreeCount = new Array(7).fill(0);
    
    notes.forEach(note => {
      const { note: noteName } = getNoteFromMidi(note.midiNote);
      const noteIndex = NOTES.indexOf(noteName);
      if (noteIndex >= 0) {
        const scaleIndex = scaleNotes.indexOf(noteName);
        if (scaleIndex >= 0) {
          degreeCount[scaleIndex]++;
        }
      }
    });
    
    // Find the most common scale degree
    let maxCount = 0;
    let maxDegree = 0;
    degreeCount.forEach((count, degree) => {
      if (count > maxCount) {
        maxCount = count;
        maxDegree = degree;
      }
    });
    
    // Chord options for this scale degree
    let chordOptions;
    if (scale === 'major') {
      chordOptions = [
        { degree: 0, type: 'maj' },
        { degree: 1, type: 'min' },
        { degree: 2, type: 'min' },
        { degree: 3, type: 'maj' },
        { degree: 4, type: 'maj' },
        { degree: 5, type: 'min' },
        { degree: 6, type: 'dim' }
      ];
    } else {
      chordOptions = [
        { degree: 0, type: 'min' },
        { degree: 1, type: 'dim' },
        { degree: 2, type: 'maj' },
        { degree: 3, type: 'min' },
        { degree: 4, type: 'min' },
        { degree: 5, type: 'maj' },
        { degree: 6, type: 'maj' }
      ];
    }
    
    // Choose a chord based on the most common degree
    const chordOption = chordOptions[maxDegree];
    const rootNote = scaleNotes[chordOption.degree];
    
    chords.push({
      measure: parseInt(measure),
      root: rootNote,
      type: chordOption.type,
      notes: getChordNotes(rootNote, chordOption.type, 3)
    });
  });
  
  return chords;
};

/**
 * Quantize notes to a grid based on the specified grid resolution
 * @param {Array} notes - Array of note objects
 * @param {number} gridResolution - Grid resolution (4 = quarter notes, 8 = eighth notes, etc.)
 * @returns {Array} Array of quantized note objects
 */
const quantizeNotes = (notes, gridResolution = 16) => {
  const gridValue = 4 / gridResolution; // Convert to beats (4 beats per measure)
  
  return notes.map(note => {
    // Quantize start time
    const quantizedStart = Math.round(note.start / gridValue) * gridValue;
    
    // Quantize duration, ensuring minimum length
    const quantizedDuration = Math.max(
      gridValue,
      Math.round(note.duration / gridValue) * gridValue
    );
    
    return {
      ...note,
      start: quantizedStart,
      duration: quantizedDuration
    };
  });
};

/**
 * Snap notes to a specific scale
 * @param {Array} notes - Array of note objects
 * @param {string} key - Root note of the key
 * @param {string} scaleType - Scale type from SCALES
 * @returns {Array} Array of scale-snapped note objects
 */
const snapNotesToScale = (notes, key = 'C', scaleType = 'major') => {
  // Get the scale intervals
  const scaleIntervals = SCALES[scaleType];
  if (!scaleIntervals) return notes;
  
  const rootIndex = NOTES.indexOf(key);
  if (rootIndex === -1) return notes;
  
  // Create an array of all valid MIDI notes in this scale
  const validMidiNotes = [];
  for (let octave = 0; octave < 10; octave++) {
    const octaveBase = (octave + 1) * 12;
    scaleIntervals.forEach(interval => {
      validMidiNotes.push(octaveBase + ((rootIndex + interval) % 12));
    });
  }
  
  // Snap each note to the nearest scale note
  return notes.map(note => {
    const midiNote = note.midiNote;
    
    // If already in scale, leave it alone
    if (validMidiNotes.includes(midiNote)) {
      return note;
    }
    
    // Find the closest valid note
    let closest = validMidiNotes[0];
    let minDistance = Math.abs(midiNote - closest);
    
    validMidiNotes.forEach(validNote => {
      const distance = Math.abs(midiNote - validNote);
      if (distance < minDistance) {
        minDistance = distance;
        closest = validNote;
      }
    });
    
    return {
      ...note,
      midiNote: closest
    };
  });
};

export {
  NOTES,
  SCALES,
  CHORD_TYPES,
  PROGRESSIONS,
  getMidiNote,
  getNoteFromMidi,
  getScaleNotes,
  getChordNotes,
  generateChordProgression,
  generateMelodicPattern,
  createNotesFromPattern,
  generateMelody,
  harmonizeMelody,
  quantizeNotes,
  snapNotesToScale
};
