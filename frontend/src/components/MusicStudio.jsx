import React, { useState, useRef, useEffect } from 'react'
import './MusicStudio.css'
import { 
  FaPlay, FaPause, FaStop, FaVolumeUp, FaVolumeMute, 
  FaDrum, FaMusic, FaRobot, FaCircle, FaLayerGroup, 
  FaTrash, FaGuitar, FaMagic, FaMicrophone, FaKeyboard 
} from 'react-icons/fa'
import { 
  GiPianoKeys, GiTrumpet, GiFlute, GiSaxophone, 
  GiViolin, GiGuitar, GiDrum, GiMusicalNotes,
  GiGuitarBassHead, GiMusicalKeyboard, GiSoundWaves, GiMagicSwirl
} from 'react-icons/gi'
import * as Tone from 'tone'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in MusicStudio:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          color: 'white', 
          background: '#ff6b6b',
          borderRadius: '8px',
          margin: '20px',
          textAlign: 'center'
        }}>
          <h3>Something went wrong with the Music Studio</h3>
          <p>{this.state.error?.message || 'Unknown error occurred'}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              marginTop: '10px',
              background: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Component
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

const BACKEND_URL = 'https://newnewwebsite.onrender.com'

// Piano keys (extended to three octaves)
const PIANO_KEYS = [
  // Octave 2
  { note: 'C', octave: 2, type: 'white', midi: 36 },
  { note: 'C#', octave: 2, type: 'black', midi: 37 },
  { note: 'D', octave: 2, type: 'white', midi: 38 },
  { note: 'D#', octave: 2, type: 'black', midi: 39 },
  { note: 'E', octave: 2, type: 'white', midi: 40 },
  { note: 'F', octave: 2, type: 'white', midi: 41 },
  { note: 'F#', octave: 2, type: 'black', midi: 42 },
  { note: 'G', octave: 2, type: 'white', midi: 43 },
  { note: 'G#', octave: 2, type: 'black', midi: 44 },
  { note: 'A', octave: 2, type: 'white', midi: 45 },
  { note: 'A#', octave: 2, type: 'black', midi: 46 },
  { note: 'B', octave: 2, type: 'white', midi: 47 },
  // Octave 3
  { note: 'C', octave: 3, type: 'white', midi: 48 },
  { note: 'C#', octave: 3, type: 'black', midi: 49 },
  { note: 'D', octave: 3, type: 'white', midi: 50 },
  { note: 'D#', octave: 3, type: 'black', midi: 51 },
  { note: 'E', octave: 3, type: 'white', midi: 52 },
  { note: 'F', octave: 3, type: 'white', midi: 53 },
  { note: 'F#', octave: 3, type: 'black', midi: 54 },
  { note: 'G', octave: 3, type: 'white', midi: 55 },
  { note: 'G#', octave: 3, type: 'black', midi: 56 },
  { note: 'A', octave: 3, type: 'white', midi: 57 },
  { note: 'A#', octave: 3, type: 'black', midi: 58 },
  { note: 'B', octave: 3, type: 'white', midi: 59 },
  // Octave 4
  { note: 'C', octave: 4, type: 'white', midi: 60 },
  { note: 'C#', octave: 4, type: 'black', midi: 61 },
  { note: 'D', octave: 4, type: 'white', midi: 62 },
  { note: 'D#', octave: 4, type: 'black', midi: 63 },
  { note: 'E', octave: 4, type: 'white', midi: 64 },
  { note: 'F', octave: 4, type: 'white', midi: 65 },
  { note: 'F#', octave: 4, type: 'black', midi: 66 },
  { note: 'G', octave: 4, type: 'white', midi: 67 },
  { note: 'G#', octave: 4, type: 'black', midi: 68 },
  { note: 'A', octave: 4, type: 'white', midi: 69 },
  { note: 'A#', octave: 4, type: 'black', midi: 70 },
  { note: 'B', octave: 4, type: 'white', midi: 71 },
  // Octave 5
  { note: 'C', octave: 5, type: 'white', midi: 72 },
  { note: 'C#', octave: 5, type: 'black', midi: 73 },
  { note: 'D', octave: 5, type: 'white', midi: 74 },
  { note: 'D#', octave: 5, type: 'black', midi: 75 },
  { note: 'E', octave: 5, type: 'white', midi: 76 },
  { note: 'F', octave: 5, type: 'white', midi: 77 },
  { note: 'F#', octave: 5, type: 'black', midi: 78 },
  { note: 'G', octave: 5, type: 'white', midi: 79 },
  { note: 'G#', octave: 5, type: 'black', midi: 80 },
  { note: 'A', octave: 5, type: 'white', midi: 81 },
  { note: 'A#', octave: 5, type: 'black', midi: 82 },
  { note: 'B', octave: 5, type: 'white', midi: 83 },
  // Octave 6
  { note: 'C', octave: 6, type: 'white', midi: 84 }
]

// Drum pads (expanded to 9 pads)
const DRUM_PADS = [
  { name: 'Kick', key: 'Q', color: '#FF6B6B' },
  { name: 'Snare', key: 'W', color: '#4ECDC4' },
  { name: 'Hi-Hat', key: 'E', color: '#45B7D1' },
  { name: 'Crash', key: 'R', color: '#96CEB4' },
  { name: 'Tom 1', key: 'T', color: '#FFEEAD' },
  { name: 'Tom 2', key: 'Y', color: '#D4A5A5' },
  { name: 'Clap', key: 'U', color: '#9B6A6C' },
  { name: 'Rim', key: 'I', color: '#E9C46A' },
  { name: 'Perc', key: 'O', color: '#F4A261' }
].map((pad, index) => ({
  ...pad,
  key: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O'][index] || String.fromCharCode(65 + index)
}));

// Instrument categories
const INSTRUMENT_CATEGORIES = [
  { id: 'piano', name: 'Piano', icon: <GiPianoKeys /> },
  { id: 'drums', name: 'Drums', icon: <FaDrum /> },
  { id: 'strings', name: 'Strings', icon: <GiViolin /> },
  { id: 'guitar', name: 'Guitar', icon: <GiGuitar /> },
  { id: 'brass', name: 'Brass', icon: <GiTrumpet /> },
  { id: 'woodwinds', name: 'Woodwinds', icon: <GiFlute /> },
  { id: 'synth', name: 'Synth', icon: <FaRobot /> },
  { id: 'fx', name: 'FX', icon: <GiMagicSwirl /> }
]

// String instruments
const STRING_INSTRUMENTS = [
  { name: 'Violin', color: '#a5b4fc', type: 'strings', octave: 4 },
  { name: 'Cello', color: '#818cf8', type: 'strings', octave: 3 },
  { name: 'Viola', color: '#6366f1', type: 'strings', octave: 3 },
  { name: 'Double Bass', color: '#4f46e5', type: 'strings', octave: 2 },
  { name: 'Harp', color: '#7c3aed', type: 'strings', octave: 4 },
  { name: 'Pizzicato', color: '#a78bfa', type: 'strings', octave: 4 }
]

// Guitar types
const GUITAR_TYPES = [
  { name: 'Acoustic', color: '#f9a8d4', type: 'guitar' },
  { name: 'Electric', color: '#f472b6', type: 'guitar' },
  { name: 'Clean', color: '#ec4899', type: 'guitar' },
  { name: 'Distorted', color: '#db2777', type: 'guitar' },
  { name: 'Muted', color: '#be185d', type: 'guitar' }
]

// Brass instruments - Expanded with more horn types and mutes
const BRASS_INSTRUMENTS = [
  // Trumpets
  { name: 'Trumpet', color: '#fbbf24', type: 'brass', category: 'trumpet' },
  { name: 'Piccolo Trumpet', color: '#f9b308', type: 'brass', category: 'trumpet' },
  { name: 'Flugelhorn', color: '#f7a70e', type: 'brass', category: 'trumpet' },
  { name: 'Muted Trumpet', color: '#92400e', type: 'brass', category: 'muted' },
  { name: 'Harmon Mute', color: '#7a360c', type: 'brass', category: 'muted' },
  // Trombones
  { name: 'Trombone', color: '#f59e0b', type: 'brass', category: 'trombone' },
  { name: 'Bass Trombone', color: '#e09009', type: 'brass', category: 'trombone' },
  { name: 'Soprano Trombone', color: '#cc8308', type: 'brass', category: 'trombone' },
  // French Horns
  { name: 'French Horn', color: '#d97706', type: 'brass', category: 'horn' },
  { name: 'Wagner Tuba', color: '#c26b05', type: 'brass', category: 'horn' },
  // Low Brass
  { name: 'Tuba', color: '#b45309', type: 'brass', category: 'low' },
  { name: 'Sousaphone', color: '#9e4908', type: 'brass', category: 'low' },
  { name: 'Euphonium', color: '#883f07', type: 'brass', category: 'low' },
  { name: 'Baritone', color: '#723506', type: 'brass', category: 'low' },
  // Special
  { name: 'Flugabone', color: '#5d2b05', type: 'brass', category: 'special' },
  { name: 'Cimbasso', color: '#472203', type: 'brass', category: 'special' }
]

// Woodwind instruments - Expanded with more flute types and woodwinds
const WOODWIND_INSTRUMENTS = [
  // Flutes
  { name: 'Concert Flute', color: '#34d399', type: 'woodwind', category: 'flute' },
  { name: 'Alto Flute', color: '#2bc58f', type: 'woodwind', category: 'flute' },
  { name: 'Bass Flute', color: '#22b785', type: 'woodwind', category: 'flute' },
  { name: 'Pan Flute', color: '#1aa87a', type: 'woodwind', category: 'flute' },
  { name: 'Shakuhachi', color: '#0f9b6e', type: 'woodwind', category: 'flute' },
  // Other woodwinds
  { name: 'Clarinet', color: '#10b981', type: 'woodwind', category: 'single-reed' },
  { name: 'Bass Clarinet', color: '#0d9e6c', type: 'woodwind', category: 'single-reed' },
  { name: 'Oboe', color: '#059669', type: 'woodwind', category: 'double-reed' },
  { name: 'English Horn', color: '#04835a', type: 'woodwind', category: 'double-reed' },
  { name: 'Bassoon', color: '#047857', type: 'woodwind', category: 'double-reed' },
  { name: 'Contrabassoon', color: '#036a4c', type: 'woodwind', category: 'double-reed' },
  { name: 'Soprano Sax', color: '#065f46', type: 'woodwind', category: 'sax' },
  { name: 'Alto Sax', color: '#055537', type: 'woodwind', category: 'sax' },
  { name: 'Tenor Sax', color: '#044b2d', type: 'woodwind', category: 'sax' },
  { name: 'Baritone Sax', color: '#034124', type: 'woodwind', category: 'sax' },
  { name: 'Recorder', color: '#064e3b', type: 'woodwind', category: 'fipple' },
  { name: 'Tin Whistle', color: '#053f30', type: 'woodwind', category: 'fipple' },
  { name: 'Ocarina', color: '#043528', type: 'woodwind', category: 'fipple' }
]

// Synth types - Expanded with more electronic sounds
const SYNTH_TYPES = [
  // Lead Synths
  { name: 'Lead 1', color: '#a78bfa', type: 'synth', category: 'lead' },
  { name: 'Lead 2', color: '#9d7bf5', type: 'synth', category: 'lead' },
  { name: 'Lead 3', color: '#936bf0', type: 'synth', category: 'lead' },
  // Bass Synths
  { name: 'Bass 1', color: '#8b5cf6', type: 'synth', category: 'bass' },
  { name: 'Bass 2', color: '#7d4aed', type: 'synth', category: 'bass' },
  { name: 'Bass 3', color: '#6d28d9', type: 'synth', category: 'bass' },
  // Pads
  { name: 'Pad 1', color: '#7c3aed', type: 'synth', category: 'pad' },
  { name: 'Pad 2', color: '#6d28d9', type: 'synth', category: 'pad' },
  { name: 'Pad 3', color: '#5b21b6', type: 'synth', category: 'pad' },
  // Plucks
  { name: 'Pluck 1', color: '#6d28d9', type: 'synth', category: 'pluck' },
  { name: 'Pluck 2', color: '#5b21b6', type: 'synth', category: 'pluck' },
  // Arpeggiators
  { name: 'Arp 1', color: '#5b21b6', type: 'synth', category: 'arp' },
  { name: 'Arp 2', color: '#4c1d95', type: 'synth', category: 'arp' },
  // FX
  { name: 'FX 1', color: '#4c1d95', type: 'synth', category: 'fx' },
  { name: 'FX 2', color: '#3b1680', type: 'synth', category: 'fx' },
  // Special
  { name: 'Atmosphere', color: '#2e1065', type: 'synth', category: 'special' },
  { name: 'Drone', color: '#1f0d4d', type: 'synth', category: 'special' }
]

// Sound effects - Expanded with more variations
const SOUND_FX = [
  // Drips
  { name: 'Water Drip', color: '#74b9ff', type: 'fx', category: 'drip' },
  { name: 'Heavy Drip', color: '#5aa8e6', type: 'fx', category: 'drip' },
  { name: 'Metallic Drip', color: '#4097cc', type: 'fx', category: 'drip' },
  { name: 'Echo Drip', color: '#2c85b8', type: 'fx', category: 'drip' },
  // Hits
  { name: 'Punch', color: '#fd79a8', type: 'fx', category: 'hit' },
  { name: 'Slap', color: '#fc5f97', type: 'fx', category: 'hit' },
  { name: 'Kick', color: '#fb4686', type: 'fx', category: 'hit' },
  { name: 'Snap', color: '#fa2c75', type: 'fx', category: 'hit' },
  { name: 'Thud', color: '#f91264', type: 'fx', category: 'hit' },
  // Whooshes
  { name: 'Sweep Up', color: '#fdcb6e', type: 'fx', category: 'whoosh' },
  { name: 'Sweep Down', color: '#fdc155', type: 'fx', category: 'whoosh' },
  { name: 'Wind', color: '#fcb63d', type: 'fx', category: 'whoosh' },
  { name: 'Air', color: '#fbab24', type: 'fx', category: 'whoosh' },
  // Pops
  { name: 'Pop', color: '#6c5ce7', type: 'fx', category: 'pop' },
  { name: 'Click', color: '#5d4fd9', type: 'fx', category: 'pop' },
  { name: 'Snap', color: '#4f43ca', type: 'fx', category: 'pop' },
  { name: 'Blip', color: '#4237b8', type: 'fx', category: 'pop' },
  // Zaps
  { name: 'Zap', color: '#00b894', type: 'fx', category: 'zap' },
  { name: 'Zing', color: '#00a885', type: 'fx', category: 'zap' },
  { name: 'Zap 2', color: '#009876', type: 'fx', category: 'zap' },
  { name: 'Zap 3', color: '#008767', type: 'fx', category: 'zap' },
  // Beeps
  { name: 'Beep', color: '#e17055', type: 'fx', category: 'beep' },
  { name: 'Boop', color: '#d1644c', type: 'fx', category: 'beep' },
  { name: 'Bleep', color: '#c15843', type: 'fx', category: 'beep' },
  { name: 'Blip', color: '#b14d3a', type: 'fx', category: 'beep' },
  // Rises
  { name: 'Rise', color: '#a55eea', type: 'fx', category: 'rise' },
  { name: 'Lift', color: '#9a4ce8', type: 'fx', category: 'rise' },
  { name: 'Climb', color: '#8f3be6', type: 'fx', category: 'rise' },
  { name: 'Soar', color: '#8429e4', type: 'fx', category: 'rise' },
  // Drops
  { name: 'Drop', color: '#45aaf2', type: 'fx', category: 'drop' },
  { name: 'Plunge', color: '#2e9ff1', type: 'fx', category: 'drop' },
  { name: 'Fall', color: '#1795f0', type: 'fx', category: 'drop' },
  { name: 'Descend', color: '#008aef', type: 'fx', category: 'drop' },
  // Noise
  { name: 'White Noise', color: '#a5b1c2', type: 'fx', category: 'noise' },
  { name: 'Pink Noise', color: '#94a3b8', type: 'fx', category: 'noise' },
  { name: 'Brown Noise', color: '#8395ae', type: 'fx', category: 'noise' },
  { name: 'Blue Noise', color: '#7287a4', type: 'fx', category: 'noise' }
]

// Main component with error boundary
function MusicStudio() {
  return (
    <ErrorBoundary>
      <MusicStudioContent />
    </ErrorBoundary>
  );
}

function MusicStudioContent() {
  const [activeTab, setActiveTab] = useState('piano')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volumeState, setVolumeState] = useState(0.7)
  const [bpm, setBpm] = useState(120)
  const [audioReady, setAudioReady] = useState(false)
  const [audioError, setAudioError] = useState(null)
  const [selectedInstrument, setSelectedInstrument] = useState(null)
  const [activeNotes, setActiveNotes] = useState({})
  const [synthParams, setSynthParams] = useState({
    attack: 0.1,
    decay: 0.3,
    sustain: 0.5,
    release: 1
  })
  
  // Tone.js instruments
  const [instruments, setInstruments] = useState(null)
  
  // Reference to track if audio is initialized
  const audioInitializedRef = useRef(false)
  const [showInitialization, setShowInitialization] = useState(true)
  
  // Initialize audio function with better error handling
  const initializeAudio = async () => {
    console.log('Initializing audio system...');
    if (audioInitializedRef.current) return;
    
    setAudioError(null);
    
    try {
      // Start audio context with user interaction
      if (Tone.context.state === 'suspended') {
        console.log('Resuming suspended audio context...');
        await Tone.context.resume();
      }
      
      console.log('Starting Tone.js...');
      await Tone.start();
      console.log('Audio context ready');
      
      // Initialize all instruments
      const initializedInstruments = initializeInstruments();
      
      // Set initial volume
      initializedInstruments.setVolume(volumeState);
      
      console.log('Instruments initialized successfully');
      setAudioReady(true);
      audioInitializedRef.current = true;
      setShowInitialization(false);
      
      // Play a test sound to ensure audio is working
      const testSynth = new Tone.Synth().toDestination();
      const now = Tone.now();
      testSynth.triggerAttackRelease("C4", "8n", now + 0.1);
      
      // Set the instruments in state
      setInstruments(initializedInstruments);
      
      return initializedInstruments;
    } catch (error) {
      console.error('Failed to start audio context:', error);
      setAudioError(error.message);
      audioInitializedRef.current = false;
      throw error; // Re-throw to be caught by the outer try-catch
    }
  };

  // Initialize instruments
  const initializeInstruments = () => {
    // Create drum kit
    const drumKit = {
      'Kick': new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 5,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 }
      }).toDestination(),
      'Snare': new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 }
      }).toDestination(),
      'Hi-Hat': new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).toDestination(),
      'Clap': new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.01, release: 0.03 }
      }).toDestination(),
      'Tom 1': new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 5,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.3 }
      }).toDestination(),
      'Tom 2': new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 5,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.3 }
      }).toDestination(),
      'Crash': new Tone.MetalSynth({
        frequency: 300,
        envelope: { attack: 0.001, decay: 1, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 64,
        resonance: 4000,
        octaves: 1.5
      }).toDestination(),
      'Rim': new Tone.MetalSynth({
        frequency: 500,
        envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 16,
        resonance: 4000,
        octaves: 1.5
      }).toDestination(),
      'Perc': new Tone.NoiseSynth({
        noise: { type: 'brown' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.4 }
      }).toDestination()
    };

    // Create string instruments
    const strings = {
      'Violin': new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.5 }
      }).toDestination(),
      'Cello': new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 0.8 }
      }).toDestination(),
      'Harp': new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 1 }
      }).toDestination()
    };

    // Create brass instruments
    const brass = {
      'Trumpet': new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.2 }
      }).toDestination(),
      'Trombone': new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.1, decay: 0.4, sustain: 0.5, release: 0.3 }
      }).toDestination()
    };

    // Create woodwind instruments
    const woodwinds = {
      'Flute': new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.5 }
      }).toDestination(),
      'Clarinet': new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.3 }
      }).toDestination()
    };

    // Create synth instruments
    const synths = {
      'Pad': new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 1, decay: 0.5, sustain: 1, release: 2 }
      }).toDestination(),
      'Lead': new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 }
      }).toDestination()
    };

    // Create the main instruments object
    const instruments = {
      piano: new Tone.PolySynth(Tone.Synth).toDestination(),
      drums: drumKit,
      strings,
      brass,
      woodwinds,
      synths,
      setVolume: function(vol) {
        Tone.Destination.volume.value = Tone.gainToDb(vol);
      }
    };

    return instruments;
  };

  // Handle playing sounds with proper cleanup
  const playSound = (type, note) => {
    if (!instruments) return () => {};
    
    try {
      const noteStr = typeof note === 'string' ? note : `${note.note}${note.octave}`;
      
      switch(type) {
        case 'piano':
          if (instruments.piano) {
            instruments.piano.triggerAttack(noteStr);
            return () => instruments.piano.triggerRelease(noteStr);
          }
          break;
          
        case 'drums':
          if (instruments.drums && instruments.drums[note]) {
            const drum = instruments.drums[note];
            const now = Tone.now();
            
            if (note === 'Kick') {
              drum.triggerAttackRelease('C1', '8n', now);
            } else if (note === 'Snare' || note === 'Clap' || note === 'Rim') {
              drum.triggerAttack(now);
              drum.triggerRelease(now + 0.1);
            } else if (note === 'Hi-Hat' || note === 'Crash' || note === 'Perc') {
              drum.triggerAttackRelease('C6', '8n', now);
            } else {
              // Handle toms and other drums
              drum.triggerAttackRelease('A2', '8n', now);
            }
            
            // Visual feedback
            const padElement = document.querySelector(`.drum-pad[title*="${note}"]`);
            if (padElement) {
              padElement.classList.add('active-pad');
              setTimeout(() => padElement.classList.remove('active-pad'), 100);
            }
          }
          break;
          
        case 'horns':
        case 'brass':
          if (instruments.brass && selectedInstrument) {
            const synth = instruments.brass[selectedInstrument.name];
            if (synth) {
              synth.triggerAttack(note);
            }
          }
          break;
          
        default:
          console.warn('Unknown instrument type:', type);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
    
    return () => {}; // Return empty cleanup function by default
  };

  // Handle volume changes
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    Tone.Destination.volume.value = Tone.gainToDb(newVolume);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      Tone.Transport.pause();
    } else {
      Tone.Transport.start();
    }
    setIsPlaying(!isPlaying);
  };

  // Stop playback
  const stopPlayback = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
  };

  // Initialize audio on component mount with cleanup
  useEffect(() => {
    // Cleanup function for when component unmounts
    return () => {
      // Dispose instruments when component unmounts
      if (instruments) {
        Object.values(instruments).forEach(instrument => {
          if (instrument && instrument.dispose) {
            instrument.dispose()
          }
        })
      }
    }
  }, [])

  // Keyboard interaction support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent repeated triggers while key is held down
      if (e.repeat) return
      
      // For drum pads using QWERAS keys
      const drumKeyMap = {
        'q': 'Kick',
        'w': 'Snare',
        'e': 'Hi-Hat',
        'r': 'Crash',
        'a': 'Tom',
        's': 'Clap'
      }
      
      // Handle piano notes (Z,X,C,V,B,N,M for white keys, S,D,G,H,J for black keys)
      const pianoKeyMap = {
        'z': { note: 'C', octave: 3, type: 'white' },
        's': { note: 'C#', octave: 3, type: 'black' },
        'x': { note: 'D', octave: 3, type: 'white' },
        'd': { note: 'D#', octave: 3, type: 'black' },
        'c': { note: 'E', octave: 3, type: 'white' },
        'v': { note: 'F', octave: 3, type: 'white' },
        'g': { note: 'F#', octave: 3, type: 'black' },
        'b': { note: 'G', octave: 3, type: 'white' },
        'h': { note: 'G#', octave: 3, type: 'black' },
        'n': { note: 'A', octave: 3, type: 'white' },
        'j': { note: 'A#', octave: 3, type: 'black' },
        'm': { note: 'B', octave: 3, type: 'white' },
        ',': { note: 'C', octave: 4, type: 'white' }
      }

      // Sound FX keyboard shortcuts
      const fxKeyMap = {
        '1': 'Drip',
        '2': 'Hit',
        '3': 'Whoosh',
        '4': 'Pop',
        '5': 'Zap',
        '6': 'Beep'
      }
      
      const key = e.key.toLowerCase()
      
      // Play sound based on active tab and key pressed
      if (activeTab === 'drums' && key in drumKeyMap) {
        // Find the drum pad element and trigger visual feedback
        const drumPadIndex = DRUM_PADS.findIndex(pad => pad.name === drumKeyMap[key])
        if (drumPadIndex >= 0) {
          const drumPadElement = document.querySelectorAll('.drum-pad')[drumPadIndex]
          if (drumPadElement) {
            drumPadElement.classList.add('active-pad')
            setTimeout(() => drumPadElement.classList.remove('active-pad'), 100)
          }
          playSound('drums', drumKeyMap[key])
        }
      } else if (activeTab === 'piano' && key in pianoKeyMap) {
        // Find the piano key element and trigger visual feedback
        const pianoKey = pianoKeyMap[key]
        const pianoIndex = PIANO_KEYS.findIndex(k => 
          k.note === pianoKey.note && k.octave === pianoKey.octave)
        
        if (pianoIndex >= 0) {
          const keyElement = document.querySelectorAll('.piano-key')[pianoIndex]
          if (keyElement) {
            keyElement.classList.add(`active-${pianoKey.type}-key`)
            setTimeout(() => keyElement.classList.remove(`active-${pianoKey.type}-key`), 100)
          }
          playSound('piano', pianoKey)
        }
      } else if (activeTab === 'horns' && ['t', 'y', 'u'].includes(key)) {
        // Map to horn instruments
        const hornMap = {
          't': 'trumpet',
          'y': 'saxophone',
          'u': 'flute'
        }
        
        const hornIndex = ['trumpet', 'saxophone', 'flute'].indexOf(hornMap[key])
        if (hornIndex >= 0) {
          const hornElement = document.querySelectorAll('.horn-btn')[hornIndex]
          if (hornElement) {
            hornElement.classList.add('active-horn')
            setTimeout(() => hornElement.classList.remove('active-horn'), 300)
          }
          playSound('horn', hornMap[key])
        }
      } else if (activeTab === 'fx' && key in fxKeyMap) {
        // Find the sound FX pad element and trigger visual feedback
        const fxIndex = SOUND_FX.findIndex(fx => fx.name === fxKeyMap[key])
        if (fxIndex >= 0) {
          const fxElement = document.querySelectorAll('.fx-pad')[fxIndex]
          if (fxElement) {
            fxElement.classList.add('active-pad')
            setTimeout(() => fxElement.classList.remove('active-pad'), 100)
          }
          playSound('fx', fxKeyMap[key])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeTab, instruments])
  
  // Using the main playSound function defined earlier

  // Local music pattern generator
  const generateLocalMusicPattern = (prompt) => {
    // Simple pattern generation based on prompt
    const patterns = {
      'jazz': ['C4', 'E4', 'G4', 'B4', 'C5', 'B4', 'G4', 'E4'],
      'rock': ['E4', 'G4', 'A4', 'E4', 'G4', 'A4', 'B4', 'A4'],
      'classical': ['C4', 'D4', 'E4', 'C4', 'E4', 'F4', 'G4', 'C5'],
      'blues': ['C4', 'E4', 'G4', 'A4', 'B4', 'A4', 'G4', 'E4'],
      'electronic': ['C4', 'G3', 'E4', 'G3', 'C4', 'G3', 'E4', 'G3']
    };
    
    // Default pattern
    let pattern = patterns['jazz'];
    
    // Match prompt to a pattern
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes('rock')) pattern = patterns['rock'];
    else if (promptLower.includes('classic')) pattern = patterns['classical'];
    else if (promptLower.includes('blues')) pattern = patterns['blues'];
    else if (promptLower.includes('electr')) pattern = patterns['electronic'];
    
    return pattern;
  };

  // Poll job status
  const pollJobStatus = async (jobId, maxAttempts = 30, interval = 2000) => {
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/music-status/${jobId}`);
        if (!response.ok) throw new Error('Failed to check job status');
        
        const data = await response.json();
        
        if (data.status === 'completed') {
          // Play the generated audio
          const audio = new Audio(`${BACKEND_URL}${data.file_url}`);
          audio.play().catch(e => console.error('Error playing audio:', e));
          setAiResponse('AI music generated and playing!');
          return true;
        } else if (data.status === 'error') {
          throw new Error(data.message || 'Failed to generate music');
        }
        
        // Continue polling
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Music generation timed out');
        }
        
        return false;
      } catch (error) {
        console.error('Error checking job status:', error);
        throw error;
      }
    };
    
    // Initial check
    if (await checkStatus()) return;
    
    // Poll with interval
    return new Promise((resolve, reject) => {
      const poll = setInterval(async () => {
        try {
          if (await checkStatus()) {
            clearInterval(poll);
            resolve();
          }
        } catch (error) {
          clearInterval(poll);
          reject(error);
        }
      }, interval);
    });
  };

  // AI Music Generation
  const generateWithAI = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    
    // Ensure audio context is started
    try {
      await Tone.start();
    } catch (err) {
      console.log('Audio context already started');
    }
    
    setIsGenerating(true);
    setAiResponse('Starting music generation...');
    
    try {
      // Start the music generation job
      const response = await fetch(`${BACKEND_URL}/api/generate-music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': localStorage.getItem('apiKey') || ''
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          bpm,
          key: 'C',
          style: 'electronic',
          length: 16, // 16 bars
          duration: 30 // 30 seconds of audio
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to start music generation');
      }
      
      const data = await response.json();
      
      if (!data.job_id) {
        throw new Error('No job ID returned from server');
      }
      
      setAiResponse('Generating your music. This may take a moment...');
      
      // Start polling for job status
      await pollJobStatus(data.job_id);
      
    } catch (error) {
      console.error('Music generation failed:', error);
      
      // Fallback to local music generation
      try {
        setAiResponse('AI generation failed. Playing a local pattern instead...');
        const pattern = generateLocalMusicPattern(aiPrompt);
        
        if (instruments) {
          let delay = 0;
          pattern.forEach((note, index) => {
            setTimeout(() => {
              instruments.piano.triggerAttackRelease(note, '8n');
            }, delay);
            delay += 300;
            
            if (index % 2 === 0 && instruments.drums) {
              setTimeout(() => {
                instruments.drums['Hi-Hat'].triggerAttackRelease('16n');
              }, delay - 50);
            }
          });
          
          setTimeout(() => {
            instruments.piano.triggerAttackRelease('C2', '1n');
          }, 0);
        }
      } catch (localError) {
        console.error('Local music generation failed:', localError);
        setAiResponse('Music generation is currently unavailable. Try playing instruments manually!');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const renderPianoTab = () => {
    const playPianoKey = (key) => {
      const release = playSound('piano', key);
      return release;
    };

    return (
      <div className="instrument-panel">
        <div className="instrument-header">
          <GiPianoKeys size={32} />
          <h3>Piano</h3>
          <button 
            className="ai-play-btn"
            onClick={() => {
              setAiPrompt('Play a beautiful piano melody');
              generateWithAI();
            }}
          >
            🤖 AI Play
          </button>
        </div>
        <div className="piano-keys-container">
          <div className="piano-keys">
            {PIANO_KEYS.map((key, index) => {
              const isBlack = key.type === 'black';
              let releaseFunction = () => {};
              return (
                <div
                  key={index}
                  className={`piano-key ${key.type}-key`}
                  onMouseDown={() => {
                    releaseFunction = playPianoKey(key);
                  }}
                  onMouseUp={() => releaseFunction()}
                  onMouseLeave={() => releaseFunction()}
                  title={`${key.note}${key.octave} - Click to play`}
                  style={{
                    left: isBlack ? undefined : 'auto',
                    marginLeft: isBlack ? '-12px' : '0',
                    zIndex: isBlack ? 2 : 1
                  }}
                >
                  {!isBlack && (
                    <span className="key-label">
                      {key.note}<sub>{key.octave}</sub>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Utility function to adjust color brightness
  const adjustColor = (color, amount) => {
    // If the color is a hex value
    if (color[0] === '#') {
      color = color.slice(1);
      const num = parseInt(color, 16);
      let r = (num >> 16) + amount;
      let g = (num >> 8 & 0x00FF) + amount;
      let b = (num & 0x0000FF) + amount;
      
      // Clamp values between 0-255
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      
      return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    }
    return color; // Return as is if not a hex color
  };


  const renderDrumsTab = () => {
    return (
      <div className="instrument-panel">
        <div className="instrument-header">
          <FaDrum size={32} />
          <h3>Drums</h3>
          <button 
            className="ai-play-btn"
            onClick={() => {
              setAiPrompt('Create a sick drum beat');
              generateWithAI();
            }}
          >
            🤖 AI Beat
          </button>
        </div>
        <div className="drum-pads">
          {DRUM_PADS.map((pad, index) => (
            <button
              key={index}
              className="drum-pad"
              style={{ 
                backgroundColor: pad.color,
                boxShadow: `0 4px 0 ${adjustColor(pad.color, -20)}, 0 0 10px ${pad.color}40`
              }}
              title={`${pad.name} - Press ${pad.key} or click`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('active-pad');
                playSound('drums', pad.name);
              }}
              onMouseUp={(e) => {
                e.currentTarget.classList.remove('active-pad');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.classList.remove('active-pad');
              }}
            >
              <div className="pad-name">{pad.name}</div>
              <div className="pad-key">{pad.key}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const renderHornsTab = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <GiTrumpet size={32} />
        <h3>Horns & Winds</h3>
        <button 
          className="ai-play-btn"
          onClick={() => {
            setAiPrompt('Play a jazzy trumpet solo')
            generateWithAI()
          }}
        >
          🤖 AI Solo
        </button>
      </div>
      <div className="horn-instruments">
        <button 
          className="horn-btn"
          onClick={() => playSound('horn', 'trumpet')}
          onMouseDown={(e) => e.currentTarget.classList.add('active-horn')}
          onMouseUp={(e) => setTimeout(() => e.currentTarget.classList.remove('active-horn'), 300)}
        >
          <GiTrumpet size={24} />
          <span>Trumpet</span>
        </button>
        <button 
          className="horn-btn"
          onClick={() => playSound('horn', 'saxophone')}
          onMouseDown={(e) => e.currentTarget.classList.add('active-horn')}
          onMouseUp={(e) => setTimeout(() => e.currentTarget.classList.remove('active-horn'), 300)}
        >
          <GiSaxophone size={24} />
          <span>Saxophone</span>
        </button>
        <button 
          className="horn-btn"
          onClick={() => playSound('horn', 'flute')}
          onMouseDown={(e) => e.currentTarget.classList.add('active-horn')}
          onMouseUp={(e) => setTimeout(() => e.currentTarget.classList.remove('active-horn'), 300)}
        >
          <GiFlute size={24} />
          <span>Flute</span>
        </button>
      </div>
    </div>
  )

  const renderSoundFXTab = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <FaMusic size={32} />
        <h3>Sound Effects</h3>
        <button 
          className="ai-play-btn"
          onClick={() => {
            setAiPrompt('Add some cool sound effects')
            generateWithAI()
          }}
        >
          🤖 AI FX
        </button>
      </div>
      <div className="fx-pads">
        {SOUND_FX.map((fx, index) => (
          <button
            key={index}
            className="fx-pad"
            style={{ backgroundColor: fx.color }}
            onClick={() => playSound('fx', fx.name)}
            title={`${fx.name} - Click to play`}
            onMouseDown={(e) => e.currentTarget.classList.add('active-pad')}
            onMouseUp={(e) => setTimeout(() => e.currentTarget.classList.remove('active-pad'), 100)}
          >
            <div className="fx-name">{fx.name}</div>
          </button>
        ))}
      </div>
    </div>
  )

  // Debug log the current state
  console.log('Rendering MusicStudio:', { 
    showInitialization, 
    audioReady, 
    audioInitialized: audioInitializedRef.current,
    ToneAvailable: typeof Tone !== 'undefined' 
  });

  // Audio initialization overlay
  if (showInitialization) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#1a1a2e',
        color: 'white',
        textAlign: 'center',
        padding: '2rem',
        zIndex: 1000,
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '1rem',
          color: '#64ffda'
        }}>
          🎵 Welcome to Music Studio
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          marginBottom: '2rem',
          color: '#ccd6f6'
        }}>
          Click the button below to enable audio features
        </p>
        <button 
          onClick={initializeAudio}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            background: 'linear-gradient(90deg, #64ffda 0%, #00b4d8 100%)',
            color: '#0a192f',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            fontWeight: 'bold',
            letterSpacing: '0.5px'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(1px)'}
          onMouseUp={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          disabled={audioInitializedRef.current}
        >
          {audioInitializedRef.current ? 'Initializing...' : 'Start Audio'}
        </button>
        {audioError && (
          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(255, 0, 0, 0.1)',
            borderRadius: '4px',
            borderLeft: '4px solid #ff6b6b',
            maxWidth: '500px',
            textAlign: 'left'
          }}>
            <p style={{ 
              color: '#ff6b6b',
              margin: '0',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              Audio Initialization Error
            </p>
            <p style={{ 
              color: '#ccd6f6',
              margin: '0',
              fontSize: '0.9rem'
            }}>
              {audioError}
            </p>
            <p style={{ 
              color: '#8892b0',
              margin: '0.5rem 0 0 0',
              fontSize: '0.8rem'
            }}>
              Please ensure your browser allows audio and try again.
            </p>
          </div>
        )}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem',
          background: 'rgba(100, 255, 218, 0.1)',
          borderRadius: '4px',
          maxWidth: '500px'
        }}>
          <p style={{ 
            color: '#64ffda',
            margin: '0 0 0.5rem 0',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <span>ℹ️</span> Browser Audio Requirements
          </p>
          <p style={{ 
            color: '#ccd6f6',
            margin: '0',
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}>
            Most browsers require user interaction (like clicking this button) before playing audio.
            If you don't hear any sound after clicking, check your browser's audio settings or try a different browser.
          </p>
        </div>
      </div>
    );
  }

  if (!audioReady) {
    return (
      <div className="ai-music-studio">
        <div className="studio-header">
          <h2>Loading Audio Engine...</h2>
          {audioError && (
            <div className="error-message">
              <p>Error initializing audio: {audioError}</p>
              <button onClick={initializeAudio} className="retry-btn">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ai-music-studio">
      <div className="studio-header">
        <h2>AI Music Studio</h2>
      </div>
      
      <div className="tabs">
        {INSTRUMENT_CATEGORIES.map(category => (
          <button 
            key={category.id}
            className={`tab ${activeTab === category.id ? 'active' : ''}`}
            onClick={() => setActiveTab(category.id)}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>
      
      <div className="instrument-container">
        {activeTab === 'piano' && renderPianoTab()}
        {activeTab === 'drums' && renderDrumsTab()}
        {activeTab === 'horns' && renderHornsTab()}
        {activeTab === 'fx' && renderSoundFXTab()}
      </div>
      
      <div className="transport-controls">
        <div className="transport-buttons">
          <button 
            onClick={togglePlay}
            className={`play-btn ${isPlaying ? 'active' : ''}`}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button 
            onClick={stopPlayback}
            className="stop-btn"
          >
            <FaStop />
          </button>
        </div>
        
        <div className="bpm-control">
          <label>BPM</label>
          <input
            type="number"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => setBpm(Math.min(240, Math.max(40, parseInt(e.target.value) || 120)))}
          />
        </div>
        
        <div className="volume-control">
          <FaVolumeUp />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volumeState}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>
      
      <div className="ai-controls">
        <h3>AI Assistant</h3>
        <div className="ai-input">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe the music you want to create..."
            disabled={isGenerating}
            onKeyPress={(e) => e.key === 'Enter' && !isGenerating && aiPrompt.trim() && generateWithAI()}
          />
          <button 
            onClick={generateWithAI}
            disabled={isGenerating || !aiPrompt.trim()}
            className="generate-btn"
          >
            {isGenerating ? (
              <>
                <span className="spinner"></span> Generating...
              </>
            ) : (
              <>
                <FaRobot /> Generate
              </>
            )}
          </button>
        </div>
        
        {aiResponse && (
          <div className="ai-response">
            <h4>AI Suggestion:</h4>
            <p>{aiResponse}</p>
            <div className="ai-actions">
              <button className="apply-btn">Apply</button>
              <button className="dismiss-btn" onClick={() => setAiResponse('')}>
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="looper-section">
        <h3>Looper</h3>
        <div className="looper-controls">
          <button className="record-btn">
            <FaCircle /> Record
          </button>
          <button className="overdub-btn">
            <FaLayerGroup /> Overdub
          </button>
          <button className="clear-btn">
            <FaTrash /> Clear
          </button>
        </div>
        <div className="looper-tracks">
          <div className="looper-track">
            <div className="track-info">
              <span>Track 1</span>
              <div className="track-controls">
                <button><FaVolumeUp /></button>
                <button><FaTrash /></button>
              </div>
            </div>
            <div className="waveform"></div>
          </div>
        </div>
      </div>
    </div>
  );
}