import React, { useState, useRef, useEffect } from 'react'
import './MusicStudio.css'
import { FaPlay, FaPause, FaStop, FaVolumeUp, FaVolumeMute, FaDrum, FaMusic, FaRobot } from 'react-icons/fa'
import { GiPianoKeys, GiTrumpet, GiFlute, GiSaxophone } from 'react-icons/gi'
import * as Tone from 'tone'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://newnewwebsite.onrender.com'

// Piano keys (extended two octaves)
const PIANO_KEYS = [
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
  { note: 'B', octave: 4, type: 'white', midi: 71 }
]

// Drum pads
const DRUM_PADS = [
  { name: 'Kick', color: '#ff6b6b', key: 'Q' },
  { name: 'Snare', color: '#4ecdc4', key: 'W' },
  { name: 'Hi-Hat', color: '#45b7d1', key: 'E' },
  { name: 'Crash', color: '#f9ca24', key: 'R' },
  { name: 'Tom', color: '#6c5ce7', key: 'A' },
  { name: 'Clap', color: '#a29bfe', key: 'S' }
]

// Sound effects
const SOUND_FX = [
  { name: 'Drip', color: '#74b9ff' },
  { name: 'Hit', color: '#fd79a8' },
  { name: 'Whoosh', color: '#fdcb6e' },
  { name: 'Pop', color: '#6c5ce7' },
  { name: 'Zap', color: '#00b894' },
  { name: 'Beep', color: '#e17055' }
]

const MusicStudio = () => {
  const [activeTab, setActiveTab] = useState('piano')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [audioReady, setAudioReady] = useState(false)
  const [audioError, setAudioError] = useState(null)
  
  // Tone.js instruments
  const [instruments, setInstruments] = useState(null)
  
  // Reference to track if audio is initialized
  const audioInitializedRef = useRef(false)
  
  // Initialize audio function - now called on user interaction
  const initializeAudio = async () => {
    if (audioInitializedRef.current) return;
    
    console.log('Initializing audio...')
    setAudioError(null);
    
    try {
      // Start audio context on user interaction
      await Tone.start();
      console.log('Audio context started');
      audioInitializedRef.current = true;
      
      // Set master volume
      Tone.Destination.volume.value = Tone.gainToDb(volume);
      
      // Create piano synth
      const pianoSynth = new Tone.PolySynth(Tone.Synth).toDestination();
      pianoSynth.set({
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 1
        }
      });
      
      // Create drums using local synthesizers instead of external samples
      const kickDrum = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 5,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      }).toDestination();
      
      const snareDrum = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.8 }
      }).toDestination();
      
      const hihatDrum = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.1, sustain: 0.003, release: 0.3 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000
      }).toDestination();
      
      const crashDrum = new Tone.MetalSynth({
        frequency: 800,
        envelope: { attack: 0.001, decay: 0.5, sustain: 0.01, release: 1.5 },
        harmonicity: 3.1,
        modulationIndex: 64,
        resonance: 2000
      }).toDestination();
      
      const tomDrum = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 2,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.8 }
      }).toDestination();
      
      const clapDrum = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.3 }
      }).toDestination();
      
      // Bundle drum sounds together
      const drumKit = {
        'Kick': kickDrum,
        'Snare': snareDrum,
        'Hi-Hat': hihatDrum,
        'Crash': crashDrum,
        'Tom': tomDrum,
        'Clap': clapDrum
      };
      
      // Horn instruments
      const hornSynth = new Tone.PolySynth(Tone.Synth).toDestination();
      hornSynth.set({
        oscillator: { type: 'sawtooth' },
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.6,
          release: 0.8
        }
      });
      
      // Sound FX synth
      const fxSynth = new Tone.PolySynth(Tone.Synth).toDestination();
      fxSynth.set({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.1,
          release: 0.5
        }
      });
      
      // Store all instruments in state
      setInstruments({
        piano: pianoSynth,
        drums: drumKit,
        horns: hornSynth,
        fx: fxSynth
      });
      setAudioReady(true);
    } catch (error) {
      console.error('Failed to start audio context:', error);
      setAudioError(error.message);
      audioInitializedRef.current = false;
    }
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
          playSound('drum', drumKeyMap[key])
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
  
  // Sound playback using Tone.js
  const playSound = (type, note) => {
    if (!instruments) return
    
    // Make sure Tone.js context is running
    if (Tone.context.state !== 'running') {
      Tone.start()
    }
    
    console.log(`Playing ${type}: ${note}`)
    
    try {
      switch (type) {
        case 'piano':
          // For piano we use the note with octave
          instruments.piano.triggerAttackRelease(`${note.note}${note.octave || 4}`, '4n')
          break
          
        case 'drum':
          // Play the appropriate drum synth
          if (instruments.drums[note]) {
            const drumDuration = note === 'Crash' ? '8n' : '16n'
            if (note === 'Snare' || note === 'Hi-Hat' || note === 'Clap') {
              instruments.drums[note].triggerAttackRelease(drumDuration)
            } else {
              const drumNotes = {
                'Kick': 'C1',
                'Tom': 'G2',
                'Crash': 'C4'
              }
              instruments.drums[note].triggerAttackRelease(drumNotes[note] || 'C1', drumDuration)
            }
          }
          break
          
        case 'horn':
          // Different settings for different horns
          const hornSettings = {
            'trumpet': { note: 'C4', duration: '2n', detune: 0 },
            'saxophone': { note: 'G3', duration: '2n', detune: -5 },
            'flute': { note: 'E5', duration: '2n', detune: 10 }
          }
          const settings = hornSettings[note]
          instruments.horns.triggerAttackRelease(settings.note, settings.duration)
          break
          
        case 'fx':
          // Different effects with different settings
          const fxSettings = {
            'Drip': { note: 'C6', duration: '16n' },
            'Hit': { note: 'G2', duration: '8n' },
            'Whoosh': { note: 'C5', duration: '4n', glide: true },
            'Pop': { note: 'G5', duration: '32n' },
            'Zap': { note: 'E7', duration: '16n' },
            'Beep': { note: 'A5', duration: '8n' }
          }
          const fx = fxSettings[note]
          instruments.fx.triggerAttackRelease(fx.note, fx.duration)
          break
          
        default:
          console.warn(`Unknown instrument type: ${type}`)
      }
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

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

  // AI Music Generation with RQ worker
  const generateAIMusic = async () => {
    if (!aiPrompt.trim()) return;
    
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
          duration: 15  // 15 seconds of audio
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start music generation');
      }
      
      const { job_id } = await response.json();
      setAiResponse('Generating your music... This may take a minute.');
      
      // Start polling for job completion
      await pollJobStatus(job_id);
      
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

  const renderPianoTab = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <GiPianoKeys size={32} />
        <h3>Piano</h3>
        <button 
          className="ai-play-btn"
          onClick={() => {
            setAiPrompt('Play a beautiful piano melody')
            generateAIMusic()
          }}
        >
          🤖 AI Play
        </button>
      </div>
      <div className="piano-keys">
        {PIANO_KEYS.map((key, index) => (
          <button
            key={index}
            className={`piano-key ${key.type}-key`}
            onClick={() => playSound('piano', key)}
            title={`${key.note}${key.octave} - Click to play`}
            onMouseDown={(e) => e.currentTarget.classList.add(`active-${key.type}-key`)}
            onMouseUp={(e) => setTimeout(() => e.currentTarget.classList.remove(`active-${key.type}-key`), 100)}
            onMouseLeave={(e) => e.currentTarget.classList.remove(`active-${key.type}-key`)}
          >
            {key.type === 'white' && <span className="key-label">{key.note}{key.octave}</span>}
          </button>
        ))}
      </div>
    </div>
  )

  const renderDrumsTab = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <FaDrum size={32} />
        <h3>Drums</h3>
        <button 
          className="ai-play-btn"
          onClick={() => {
            setAiPrompt('Create a sick drum beat')
            generateAIMusic()
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
            style={{ backgroundColor: pad.color }}
            onClick={() => playSound('drum', pad.name)}
            title={`${pad.name} - Press ${pad.key} or click`}
            onMouseDown={(e) => e.currentTarget.classList.add('active-pad')}
            onMouseUp={(e) => setTimeout(() => e.currentTarget.classList.remove('active-pad'), 100)}
            onMouseLeave={(e) => e.currentTarget.classList.remove('active-pad')}
          >
            <div className="pad-name">{pad.name}</div>
            <div className="pad-key">{pad.key}</div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderHornsTab = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <GiTrumpet size={32} />
        <h3>Horns & Winds</h3>
        <button 
          className="ai-play-btn"
          onClick={() => {
            setAiPrompt('Play a jazzy trumpet solo')
            generateAIMusic()
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
            generateAIMusic()
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

  // Audio initialization overlay
  if (!audioReady) {
    return (
      <div className="audio-init-overlay" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h1>🎵 Welcome to Music Studio</h1>
        <p>Click the button below to enable audio features</p>
        <button 
          onClick={initializeAudio}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem',
            transition: 'transform 0.2s',
            ':hover': {
              transform: 'scale(1.05)'
            },
            ':active': {
              transform: 'scale(0.98)'
            }
          }}
          disabled={audioInitializedRef.current}
        >
          {audioInitializedRef.current ? 'Initializing...' : 'Start Audio'}
        </button>
        {audioError && (
          <p style={{ color: '#ff6b6b', marginTop: '1rem' }}>
            Error: {audioError}. Please try again or check your browser's audio settings.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="ai-music-studio">
      <div className="studio-header">
        <h1>🎵 AI-Powered Music Studio</h1>
        <p>Click instruments to play them, or ask the AI to create music for you!</p>
        <div className="keyboard-tips">
          <p><strong>Keyboard Shortcuts:</strong></p>
          <p>🎹 Piano: <span className="key-tip">Z</span> through <span className="key-tip">,</span> for white keys, <span className="key-tip">S,D,G,H,J</span> for black keys</p>
          <p>🥁 Drums: <span className="key-tip">Q,W,E,R,A,S</span> for drum pads</p>
          <p>🎺 Horns: <span className="key-tip">T</span> (trumpet), <span className="key-tip">Y</span> (saxophone), <span className="key-tip">U</span> (flute)</p>
          <p>📯 Sound FX: <span className="key-tip">1-6</span> for effect pads</p>
        </div>
      </div>

      {/* AI Control Panel */}
      <div className="ai-control-panel">
        <div className="ai-prompt-section">
          <div className="ai-icon">
            <FaRobot size={24} />
            <span>AI Musician</span>
          </div>
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ask AI: 'Play a jazz piano melody' or 'Create a drum beat' or 'Add some sound effects'"
            className="ai-prompt-input"
            onKeyPress={(e) => e.key === 'Enter' && generateAIMusic()}
          />
          <button 
            onClick={generateAIMusic}
            disabled={isGenerating}
            className="ai-generate-btn"
          >
            {isGenerating ? '🎵 Creating...' : '🎵 Generate'}
          </button>
        </div>
        {aiResponse && (
          <div className="ai-response">
            <strong>AI:</strong> {aiResponse}
          </div>
        )}
      </div>

      {/* Instrument Tabs */}
      <div className="instrument-tabs">
        <button 
          className={`tab-btn ${activeTab === 'piano' ? 'active' : ''}`}
          onClick={() => setActiveTab('piano')}
        >
          <GiPianoKeys size={20} />
          Piano
        </button>
        <button 
          className={`tab-btn ${activeTab === 'drums' ? 'active' : ''}`}
          onClick={() => setActiveTab('drums')}
        >
          <FaDrum size={20} />
          Drums
        </button>
        <button 
          className={`tab-btn ${activeTab === 'horns' ? 'active' : ''}`}
          onClick={() => setActiveTab('horns')}
        >
          <GiTrumpet size={20} />
          Horns
        </button>
        <button 
          className={`tab-btn ${activeTab === 'fx' ? 'active' : ''}`}
          onClick={() => setActiveTab('fx')}
        >
          <FaMusic size={20} />
          Sound FX
        </button>
      </div>

      {/* Active Instrument Panel */}
      <div className="active-instrument">
        {activeTab === 'piano' && renderPianoTab()}
        {activeTab === 'drums' && renderDrumsTab()}
        {activeTab === 'horns' && renderHornsTab()}
        {activeTab === 'fx' && renderSoundFXTab()}
      </div>

      {/* Transport Controls */}
      <div className="transport-controls">
        <button 
          className={`transport-btn ${isPlaying ? 'active' : ''}`}
          onClick={() => {
            // Initialize audio context if needed
            if (Tone.context.state !== 'running') {
              Tone.start()
            }
            setIsPlaying(!isPlaying)
            if (!isPlaying) {
              Tone.Transport.start()
            } else {
              Tone.Transport.pause()
            }
          }}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button 
          className="transport-btn"
          onClick={() => {
            setIsPlaying(false)
            Tone.Transport.stop()
          }}
        >
          <FaStop />
          Stop
        </button>
        <div className="volume-control">
          <FaVolumeUp />
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            defaultValue="0.7" 
            onChange={(e) => {
              if (instruments) {
                Tone.Destination.volume.value = Tone.gainToDb(parseFloat(e.target.value))
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default MusicStudio
