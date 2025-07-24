/**
 * MelodyGenerator.js - Advanced melody generation utilities for CodedSwitch
 * 
 * Provides intelligent melody generation by analyzing code structure and semantics
 * and applying music theory rules to create pleasing and meaningful melodies.
 *
 * @module MelodyGenerator
 */

import * as MusicTheory from './MusicTheory';
import { codeToNotes, analyzeCode, codeToStructure } from './CodeHarmonyTranslator';

// Named constants for magic numbers used throughout the code
export const CONSTANTS = {
  DEFAULT_VELOCITY: 80,
  MIN_VELOCITY: 40,
  MAX_VELOCITY: 127,
  DEFAULT_MEASURES: 4,
  DEFAULT_BPM: 120,
  QUARTER_NOTE: 0.25,
  EIGHTH_NOTE: 0.125,
  SIXTEENTH_NOTE: 0.0625,
  DEFAULT_COMPLEXITY: 0.5
};

/**
 * Default melodic patterns that can be applied to code structures
 */
export const MELODIC_PATTERNS = {
  ascending: [0, 2, 4, 7],
  descending: [7, 4, 2, 0],
  arpeggioUp: [0, 4, 7, 12],
  arpeggioDown: [12, 7, 4, 0],
  pentatonic: [0, 2, 4, 7, 9],
  wave: [0, 4, 7, 4, 0, -3],
  tonic: [0, 0, 7, 0],
  question: [0, 2, 4, 6],
  answer: [6, 4, 2, 0]
};

/**
 * Code structure to mood mapping
 * @type {Object}
 */
export const CODE_MOOD_MAPPING = {
  // More conditionals indicate decision making, mapped to "tense" mood
  conditionalHeavy: 'tense',
  
  // More loops indicate repetition and persistence, mapped to "epic" mood
  loopHeavy: 'epic',
  
  // More function calls indicate complexity, mapped to "happy" or "peaceful" based on nesting
  functionHeavy: 'happy',
  
  // Simple variable declarations with little nesting indicate clarity, mapped to "peaceful"
  variableHeavy: 'peaceful',
  
  // Error handling code indicates caution, mapped to "sad" or "tense" mood
  errorHandling: 'sad',
  
  // Default mood for balanced code
  balanced: 'neutral'
};

/**
 * Analyzes code semantics to determine musical parameters
 * @param {string} code - Source code to analyze
 * @returns {Object} Musical parameters including key, scale, complexity, mood
 */
export const deriveMusicalParametersFromCode = (code) => {
  // Defensive programming - handle empty or invalid code
  if (!code || typeof code !== 'string') {
    console.warn('Invalid code provided to deriveMusicalParametersFromCode');
    return {
      key: 'C',
      scale: 'major',
      complexity: CONSTANTS.DEFAULT_COMPLEXITY,
      mood: 'neutral',
      length: CONSTANTS.DEFAULT_MEASURES
    };
  }
  // Get code structure analysis from the CodeHarmonyTranslator
  const codeStructure = codeToStructure(code);
  const codeAnalysis = analyzeCode(code);
  
  // Derive musical key based on predominant characters
  const charCounts = {};
  code.split('').forEach(char => {
    if (/[a-gA-G]/.test(char)) {
      const upperChar = char.toUpperCase();
      charCounts[upperChar] = (charCounts[upperChar] || 0) + 1;
    }
  });
  
  // Find the most common note letter in the code
  let maxCount = 0;
  let key = 'C'; // Default key
  Object.entries(charCounts).forEach(([char, count]) => {
    if (count > maxCount) {
      maxCount = count;
      key = char;
    }
  });
  
  // Determine if we should use major or minor based on code complexity
  // More complex code = minor, simpler code = major
  const nestingLevel = codeAnalysis.maxNestingLevel || 0;
  const scale = nestingLevel > 2 ? 'minor' : 'major';
  
  // Calculate complexity based on code structure
  const codeLength = code.length;
  const numFunctions = codeStructure.functions?.length || 0;
  const numConditionals = codeStructure.conditionals?.length || 0;
  const numLoops = codeStructure.loops?.length || 0;
  
  // Normalize complexity to 0-1 range
  const complexityScore = Math.min(1, 
    (nestingLevel * 0.15) + 
    (numFunctions / 10 * 0.3) + 
    (numConditionals / 5 * 0.3) + 
    (numLoops / 3 * 0.25)
  );
  
  // Determine mood based on code structure
  let mood = 'neutral';
  
  if (numConditionals > numFunctions && numConditionals > numLoops) {
    mood = CODE_MOOD_MAPPING.conditionalHeavy;
  } else if (numLoops > numFunctions && numLoops > numConditionals) {
    mood = CODE_MOOD_MAPPING.loopHeavy;
  } else if (numFunctions > numLoops && numFunctions > numConditionals) {
    mood = nestingLevel > 3 ? CODE_MOOD_MAPPING.functionHeavy : CODE_MOOD_MAPPING.peaceful;
  } else if (code.includes('try') && code.includes('catch')) {
    mood = CODE_MOOD_MAPPING.errorHandling;
  } else if (codeStructure.variables?.length > (numFunctions + numLoops + numConditionals)) {
    mood = CODE_MOOD_MAPPING.variableHeavy;
  }
  
  return {
    key,
    scale,
    complexity: complexityScore,
    mood,
    length: Math.max(4, Math.ceil(codeLength / 200)) // Estimate length based on code size
  };
};

/**
 * Generate a melody directly from source code with enhanced musical properties
 * @param {string} code - Source code to translate to music
 * @param {Object} options - Optional override parameters
 * @returns {Array} Array of note objects ready for PianoRoll
 */
export const generateMelodyFromCode = (code, options = {}) => {
  // Defensive programming - handle empty or invalid code
  if (!code || typeof code !== 'string') {
    console.warn('Invalid code provided to generateMelodyFromCode');
    return [];
  }
  // First, analyze the code to derive musical parameters
  const derivedParams = deriveMusicalParametersFromCode(code);
  
  // Merge with user-provided options
  const mergedOptions = {
    ...derivedParams,
    ...options
  };
  
  // Generate a base melody using the legacy translator
  let basicNotes = [];
  
  try {
    // Try to use the existing translator for initial note generation
    basicNotes = codeToNotes(code);
  } catch (error) {
    console.warn('Error using legacy translator, falling back to pure generation', error);
    // Fall back to pure generation if the translator fails
  }
  
  // Generate melody using our music theory rules
  const enhancedMelody = MusicTheory.generateMelody(mergedOptions);
  
  // If we have basic notes from the legacy translator, enhance them
  if (basicNotes.length > 0) {
    return enhanceExistingMelody(basicNotes, mergedOptions);
  }
  
  return enhancedMelody;
};

/**
 * Enhance an existing melody with more musical properties
 * @param {Array} basicNotes - Basic notes from the legacy translator
 * @param {Object} options - Musical parameters
 * @returns {Array} Enhanced melody with more musical properties
 */
export const enhanceExistingMelody = (basicNotes, options = {}) => {
  // Defensive programming - handle invalid input
  if (!Array.isArray(basicNotes) || basicNotes.length === 0) {
    console.warn('Invalid or empty notes array provided to enhanceExistingMelody');
    return [];
  }
  const {
    key = 'C',
    scale = 'major',
    complexity = 0.5
  } = options;
  
  // First, ensure notes are mapped to the correct key and scale
  let enhancedNotes = MusicTheory.snapNotesToScale(basicNotes, key, scale);
  
  // Apply quantization based on complexity - higher complexity = less quantizing
  const gridResolution = complexity < 0.3 ? 8 : (complexity < 0.7 ? 16 : 32);
  enhancedNotes = MusicTheory.quantizeNotes(enhancedNotes, gridResolution);
  
  // Add velocity variation for more expressive performance
  enhancedNotes = enhancedNotes.map(note => ({
    ...note,
    velocity: CONSTANTS.DEFAULT_VELOCITY + Math.floor(Math.random() * (CONSTANTS.MAX_VELOCITY - CONSTANTS.DEFAULT_VELOCITY) * 0.5) // Random velocity with sensible range
  }));
  
  return enhancedNotes;
};

/**
 * Generate variations of a melody
 * @param {Array} originalNotes - Original melody notes
 * @param {string} variationType - Type of variation to apply ('rhythm', 'pitch', 'inversion', 'retrograde')
 * @returns {Array} Variation of the original melody
 */
export const generateMelodyVariation = (originalNotes, variationType = 'rhythm') => {
  // Defensive programming - handle invalid input
  if (!Array.isArray(originalNotes) || originalNotes.length === 0) {
    console.warn('Invalid or empty notes array provided to generateMelodyVariation');
    return [];
  }
  const noteCopy = JSON.parse(JSON.stringify(originalNotes));
  
  switch (variationType) {
    case 'rhythm':
      // Change rhythm but keep pitches
      return noteCopy.map(note => ({
        ...note,
        start: note.start + (Math.random() * 0.25 - 0.125), // Slight timing shift
        duration: note.duration * (0.75 + Math.random() * 0.5) // Duration variation
      }));
      
    case 'pitch':
      // Change pitches but keep rhythm
      return noteCopy.map(note => ({
        ...note,
        midiNote: note.midiNote + [-12, -7, -5, 0, 0, 0, 5, 7, 12][Math.floor(Math.random() * 9)]
      }));
      
    case 'inversion':
      // Invert the melody around its first note
      if (noteCopy.length === 0) return noteCopy;
      
      const firstNote = noteCopy[0].midiNote;
      return noteCopy.map(note => ({
        ...note,
        midiNote: firstNote + (firstNote - note.midiNote)
      }));
      
    case 'retrograde':
      // Reverse the melody
      const totalLength = Math.max(...noteCopy.map(n => n.start + n.duration));
      return noteCopy.map(note => ({
        ...note,
        start: totalLength - (note.start + note.duration)
      })).sort((a, b) => a.start - b.start);
      
    default:
      return noteCopy;
  }
};

/**
 * Create a drum pattern based on code structure
 * @param {string} code - Source code to analyze
 * @param {number} measures - Number of measures to generate
 * @returns {Object} Drum patterns organized by drum type
 */
export const generateDrumPattern = (code, measures = CONSTANTS.DEFAULT_MEASURES) => {
  // Defensive programming - handle invalid input
  if (!code || typeof code !== 'string') {
    console.warn('Invalid code provided to generateDrumPattern');
    code = ''; // Use empty string as fallback
  }
  
  // Ensure measures is valid
  measures = Math.max(1, Math.min(16, measures || CONSTANTS.DEFAULT_MEASURES));
  const analysis = analyzeCode(code);
  const complexity = analysis.complexity || 0.5;
  
  // Determine pattern density based on code complexity
  const kickDensity = 0.3 + complexity * 0.3; 
  const snareDensity = 0.2 + complexity * 0.2;
  const hatDensity = 0.5 + complexity * 0.4;
  
  const drumPattern = {
    kick: [],
    snare: [],
    hihat: []
  };
  
  // Generate patterns
  for (let measure = 0; measure < measures; measure++) {
    // Kick drum - typically on beats 1 and 3 in 4/4 time
    for (let beat = 0; beat < 4; beat++) {
      if (beat === 0 || beat === 2 || Math.random() < kickDensity * 0.5) {
        drumPattern.kick.push({
          id: `kick_${measure}_${beat}`,
          start: measure + beat * 0.25,
          duration: 0.25,
          velocity: 100 + Math.floor(Math.random() * 27)
        });
      }
    }
    
    // Snare drum - typically on beats 2 and 4 in 4/4 time
    for (let beat = 0; beat < 4; beat++) {
      if (beat === 1 || beat === 3 || Math.random() < snareDensity * 0.3) {
        drumPattern.snare.push({
          id: `snare_${measure}_${beat}`,
          start: measure + beat * 0.25,
          duration: 0.25,
          velocity: 90 + Math.floor(Math.random() * 30)
        });
      }
    }
    
    // Hi-hat - eighth or sixteenth notes depending on complexity
    const divisionPerBeat = complexity > 0.6 ? 4 : 2; // 16th or 8th notes
    for (let beat = 0; beat < 4; beat++) {
      for (let div = 0; div < divisionPerBeat; div++) {
        if (Math.random() < hatDensity) {
          drumPattern.hihat.push({
            id: `hat_${measure}_${beat}_${div}`,
            start: measure + beat * 0.25 + div * (0.25 / divisionPerBeat),
            duration: 0.125,
            velocity: 70 + Math.floor(Math.random() * 30)
          });
        }
      }
    }
  }
  
  return drumPattern;
};

/**
 * Apply a melodic pattern to a root note
 * @param {number} rootNote - The MIDI note number of the root note
 * @param {Array<number>} pattern - Array of semitone offsets from the root note
 * @param {Object} options - Optional parameters
 * @param {number} options.octaveOffset - Octave offset to apply (default: 0)
 * @param {boolean} options.useScale - Whether to snap notes to a scale (default: false)
 * @param {string} options.key - Key for scale snapping (default: 'C')
 * @param {string} options.scale - Scale for snapping (default: 'major')
 * @returns {Array<number>} Array of MIDI notes generated from the pattern
 */
export const applyPatternToRoot = (rootNote, pattern, options = {}) => {
  // Defensive programming - handle invalid input
  if (rootNote === undefined || rootNote === null || isNaN(rootNote)) {
    console.warn('Invalid root note provided to applyPatternToRoot');
    rootNote = 60; // Default to middle C
  }
  
  if (!Array.isArray(pattern) || pattern.length === 0) {
    console.warn('Invalid or empty pattern provided to applyPatternToRoot');
    return [rootNote]; // Return just the root note as fallback
  }
  
  // Extract options with defaults
  const { 
    octaveOffset = 0, 
    useScale = false, 
    key = 'C', 
    scale = 'major' 
  } = options;
  
  // Apply the pattern to generate notes
  let resultNotes = pattern.map(offset => rootNote + offset);
  
  // Apply octave offset if specified
  if (octaveOffset !== 0) {
    resultNotes = resultNotes.map(note => note + (octaveOffset * 12));
  }
  
  // Apply scale snapping if requested
  if (useScale) {
    const scaleNotes = MusicTheory.getScaleNotes(key, scale);
    if (scaleNotes.length > 0) {
      resultNotes = resultNotes.map(note => {
        // Extract note information
        const { note: noteName, octave } = MusicTheory.getNoteFromMidi(note);
        
        // Find closest note in scale
        const noteIndex = MusicTheory.NOTES.indexOf(noteName);
        if (noteIndex === -1) return note; // Keep original if not found
        
        // Find closest note in scale
        let closestNote = noteName;
        let minDistance = 12;
        
        for (const scaleNote of scaleNotes) {
          const scaleNoteIndex = MusicTheory.NOTES.indexOf(scaleNote);
          const distance = Math.min(
            (scaleNoteIndex - noteIndex + 12) % 12,
            (noteIndex - scaleNoteIndex + 12) % 12
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestNote = scaleNote;
          }
        }
        
        // Convert back to MIDI
        return MusicTheory.getMidiNote(closestNote, octave);
      });
    }
  }
  
  return resultNotes;
};

// Export all functions and constants
// Individual exports already exist above each function/constant
