import React, { useState, useRef, useEffect } from 'react'
import './MusicStudio.css'
import { FaPlay, FaPause, FaStop, FaVolumeUp, FaVolumeMute, FaDrum, FaMusic, FaRobot } from 'react-icons/fa'
import { GiPianoKeys, GiTrumpet, GiFlute, GiSaxophone } from 'react-icons/gi'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://newnewwebsite.onrender.com'

// Piano keys (one octave)
const PIANO_KEYS = [
  { note: 'C', type: 'white', midi: 60 },
  { note: 'C#', type: 'black', midi: 61 },
  { note: 'D', type: 'white', midi: 62 },
  { note: 'D#', type: 'black', midi: 63 },
  { note: 'E', type: 'white', midi: 64 },
  { note: 'F', type: 'white', midi: 65 },
  { note: 'F#', type: 'black', midi: 66 },
  { note: 'G', type: 'white', midi: 67 },
  { note: 'G#', type: 'black', midi: 68 },
  { note: 'A', type: 'white', midi: 69 },
  { note: 'A#', type: 'black', midi: 70 },
  { note: 'B', type: 'white', midi: 71 }
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

  // Simple sound generation (placeholder)
  const playSound = (type, note) => {
    console.log(`Playing ${type}: ${note}`)
    // Here you would integrate with Tone.js or Web Audio API
  }

  // AI Music Generation
  const generateAIMusic = async () => {
    if (!aiPrompt.trim()) return
    
    setIsGenerating(true)
    setAiResponse('')
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Generate music: ${aiPrompt}`,
          context: 'music_studio'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAiResponse(data.response)
      } else {
        setAiResponse('AI music generation is currently unavailable. Try playing instruments manually!')
      }
    } catch (error) {
      console.error('AI Generation Error:', error)
      setAiResponse('AI music generation is currently unavailable. Try playing instruments manually!')
    } finally {
      setIsGenerating(false)
    }
  }

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
            onClick={() => playSound('piano', key.note)}
            title={`${key.note} - Click to play`}
          >
            {key.type === 'white' && <span className="key-label">{key.note}</span>}
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
        <button className="horn-btn" onClick={() => playSound('horn', 'trumpet')}>
          <GiTrumpet size={24} />
          <span>Trumpet</span>
        </button>
        <button className="horn-btn" onClick={() => playSound('horn', 'saxophone')}>
          <GiSaxophone size={24} />
          <span>Saxophone</span>
        </button>
        <button className="horn-btn" onClick={() => playSound('horn', 'flute')}>
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
          >
            <div className="fx-name">{fx.name}</div>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="ai-music-studio">
      <div className="studio-header">
        <h1>🎵 AI-Powered Music Studio</h1>
        <p>Click instruments to play them, or ask the AI to create music for you!</p>
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
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button 
          className="transport-btn"
          onClick={() => setIsPlaying(false)}
        >
          <FaStop />
          Stop
        </button>
      </div>
    </div>
  )
}

export default MusicStudio
  const [pianoNotes, setPianoNotes] = useState([])
  const [drumPads, setDrumPads] = useState(DRUM_PADS)
  const [soundFx, setSoundFx] = useState(SOUND_FX)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [transportTime, setTransportTime] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const transportTimeRef = useRef(0)
  const [instrument, setInstrument] = useState('Piano')
  const [prompt, setPrompt] = useState('')
  const [lyrics, setLyrics] = useState(localStorage.getItem('generatedLyrics') || '')
  const [generating, setGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [showPianoRoll, setShowPianoRoll] = useState(true)
  const [selectedClip, setSelectedClip] = useState(null) // {trackIdx, clipIdx}
  const [pianoRollNotes, setPianoRollNotes] = useState([])
  const timelineWidth = 1200 // px
  const PIXELS_PER_SECOND = 20 // 20px = 1s
  const synthsRef = useRef([])
  const playersRef = useRef(null)
  const loopPlayersRef = useRef({})

  const addTrack = () => setTracks(prev => [...prev, createTrack()])

  const addClip = (trackIdx, x) => {
    const newClip = {
      id: Date.now() + Math.random(),
      start: x,
      length: 140,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }
    setTracks(prev => {
      const copy = prev.map(t => ({ ...t, clips: [...t.clips] }))
      copy[trackIdx].clips.push(newClip)
      return copy
    })
  }

  const handleTrackDoubleClick = (e, trackIdx) => {
    // only respond to double click on empty track-content area
    if (e.target.dataset.type !== 'track-content') return
    const rect = e.target.getBoundingClientRect()
    const x = e.clientX - rect.left
    addClip(trackIdx, x)
  }
  
  // Handle piano roll note changes
  const handlePianoRollChange = (notes) => {
    if (selectedClip) {
      const { trackIdx, clipIdx } = selectedClip
      
      // Update the clip's notes
      setTracks(prev => {
        const copy = JSON.parse(JSON.stringify(prev))
        copy[trackIdx].clips[clipIdx].notes = notes
        return copy
      })
      
      // Also update the local piano roll state
      setPianoRollNotes(notes)
    }
  }

  const startDrag = (e, trackIdx, clipIdx) => {
    e.preventDefault()
    const clip = tracks[trackIdx].clips[clipIdx]
    setDragging({ trackIdx, clipIdx, offsetX: e.clientX - clip.start })
  }
  
  // Handle clicking on a clip to edit in piano roll
  const handleClipClick = (e, trackIdx, clipIdx) => {
    e.stopPropagation()
    // If not already dragging, select this clip for piano roll editing
    if (!dragging) {
      const clip = tracks[trackIdx].clips[clipIdx]
      setSelectedClip({ trackIdx, clipIdx })
      
      // Show the piano roll editor when a clip is selected
      setShowPianoRoll(true)
      
      // If the clip doesn't have notes yet, initialize with empty array
      if (!clip.notes) {
        setTracks(prev => {
          const copy = JSON.parse(JSON.stringify(prev))
          if (!copy[trackIdx].clips[clipIdx].notes) {
            copy[trackIdx].clips[clipIdx].notes = []
          }
          return copy
        })
      }
      
      // Set the piano roll notes from the clip
      setPianoRollNotes(clip.notes || [])
      
      // Show the piano roll
      setShowPianoRoll(true)
    }
  }

  useEffect(() => {
    const move = e => {
      if (!dragging) return
      const { trackIdx, clipIdx, offsetX } = dragging
      const newX = Math.max(0, e.clientX - offsetX)
      setTracks(prev => {
        const copy = prev.map(t => ({ ...t, clips: [...t.clips] }))
        copy[trackIdx].clips[clipIdx].start = newX
        return copy
      })
    }
    const up = () => setDragging(null)

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [dragging])

  useEffect(() => {
    // Initialize Tone.js
    const initialized = Tone.context.state !== 'suspended';
    if (!initialized) {
      document.addEventListener('mousedown', function onFirstClick() {
        Tone.start();
        document.removeEventListener('mousedown', onFirstClick);
      });
    }

    // Initialize default tracks if none exist
    if (tracks.length === 0) {
      initializeDefaultTracks();
    }
    
    // Set up global function for CodeHarmony integration
    window.importCodeHarmonyToMusicStudio = (notes, title) => {
      importCodeMelody(notes, title);
    };
  }, []);

  // Helper to initialize default tracks
  const initializeDefaultTracks = () => {
    setTracks([
      {
        id: Date.now() + Math.random(),
        name: 'Track 1',
        instrument: 'piano',
        color: '#4a90e2',
        clips: [
          {
            id: Date.now() + Math.random(),
            start: 0,
            length: 140,
            notes: [],
            color: '#4a90e2'
          }
        ],
        muted: false
      }
    ]);
  };
  
  // Import code melody from CodeHarmony
  const importCodeMelody = (notes, title = 'Code Melody') => {
    // Stop any current playback
    if (playing) {
      stop();
    }
    
    // Create a new clip with the provided notes
    const newClip = {
      id: Date.now() + Math.random(),
      name: title || 'Code Melody',
      start: 0,
      length: 16, // Default length
      notes: notes.map(note => ({
        ...note,
        id: Date.now() + Math.random() // Ensure each note has a unique ID
      }))
    };
    
    // Find the piano track or create one if it doesn't exist
    const pianoTrackIndex = tracks.findIndex(track => track.instrument === 'piano');
    
    if (pianoTrackIndex >= 0) {
      // Add to existing piano track
      const updatedTracks = [...tracks];
      updatedTracks[pianoTrackIndex] = {
        ...updatedTracks[pianoTrackIndex],
        clips: [...updatedTracks[pianoTrackIndex].clips, newClip]
      };
      setTracks(updatedTracks);
      
      // Select the new clip
      setSelectedClip({
        trackIdx: pianoTrackIndex,
        clipIdx: updatedTracks[pianoTrackIndex].clips.length - 1
      });
      
      // Set piano roll notes
      setPianoRollNotes(newClip.notes);
    } else {
      // Create a new piano track with the clip
      const newTrack = {
        id: Date.now() + Math.random(),
        name: 'Code Harmony',
        instrument: 'piano',
        color: '#6c5ce7', // Purple color for code harmony
        clips: [newClip],
        muted: false
      };
      
      setTracks(prev => [...prev, newTrack]);
      
      // Select the new clip
      setTimeout(() => {
        setSelectedClip({
          trackIdx: tracks.length,
          clipIdx: 0
        });
        setPianoRollNotes(newClip.notes);
      }, 100);
    }
    
    // Show a notification
    setErrorMessage(`Imported "${title}" from CodeHarmony`);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  // --- Playback helpers using Tone.js ---
  const scheduleClipSample = (synth, clip) => {
    const offsetSec = clip.start / PIXELS_PER_SECOND
    Tone.Transport.schedule((time) => {
      synth.triggerAttackRelease('C2', '8n', time)
    }, offsetSec)
  }

  const scheduleClipSynth = (synth, clip) => {
    const offsetSec = clip.start / PIXELS_PER_SECOND
    const durationSec = clip.length / PIXELS_PER_SECOND
    
    // If the clip has piano roll notes, schedule them individually
    if (clip.notes && clip.notes.length > 0) {
      clip.notes.forEach(note => {
        const noteStartSec = offsetSec + (note.start * 4) // Convert beat to seconds
        const noteDurationSec = note.duration * 4 // Convert beat to seconds
        const noteName = Tone.Frequency(note.midiNote, "midi").toNote()
        
        Tone.Transport.schedule((time) => {
          synth.triggerAttackRelease(noteName, noteDurationSec, time, note.velocity / 127)
        }, noteStartSec)
      })
    } else {
      // Default behavior for clips without notes
      Tone.Transport.schedule((time) => {
        synth.triggerAttackRelease('C4', durationSec, time)
      }, offsetSec)
    }
  }

  const play = async () => {
    if (playing && !paused) {
      // Pause
      transportTimeRef.current = Tone.Transport.seconds
      Tone.Transport.pause()
      setPaused(true)
      return
    }
    
    if (paused) {
      // Resume
      Tone.Transport.start()
      setPaused(false)
      setPlaying(true)
      return
    }
    
    if (playing) return
    
    try {
      // Ensure audio context is started
      if (Tone.context.state !== 'running') {
        await Tone.start()
        console.log('Audio context started')
      }

      // Clean previous scheduling
      Tone.Transport.stop()
      Tone.Transport.cancel()
      synthsRef.current.forEach(s => s.dispose())
      synthsRef.current = []

      // Create synthesized drum sounds with better settings
      if (!playersRef.current) {
        playersRef.current = {
          kick: new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 10,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
          }).toDestination(),
          snare: new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.0 }
          }).toDestination(), 
          hat: new Tone.MetalSynth({
            frequency: 200,
            envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
          }).toDestination()
        }
        console.log('Drum synthesizers created')
      }

      // Load and schedule loop clips
      for (const clip of loopClips) {
        if (!loopPlayersRef.current[clip.id]) {
          const player = new Tone.Player(`/samples/${clip.filename}`).toDestination()
          await player.load()
          player.loop = true
          player.loopStart = 0
          player.loopEnd = clip.length / PIXELS_PER_SECOND
          loopPlayersRef.current[clip.id] = player
        }
        // Schedule loop playback
        scheduleClipSample(loopPlayersRef.current[clip.id], clip)
      }

      tracks.forEach((track, idx) => {
        if (idx === 0) {
          // Kick
          track.clips.forEach(clip => scheduleClipSample(playersRef.current.kick, clip))
        } else if (idx === 1) {
          // Snare
          track.clips.forEach(clip => scheduleClipSample(playersRef.current.snare, clip))
        } else if (idx === 2) {
          // Hi-hat
          track.clips.forEach(clip => scheduleClipSample(playersRef.current.hat, clip))
        } else {
          // Extra tracks fall back to synth tone
          const synth = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination()
          synthsRef.current.push(synth)
          track.clips.forEach(clip => scheduleClipSynth(synth, clip))
        }
      })

      Tone.Transport.start()
      setPlaying(true)
      console.log('Playback started')
    } catch (error) {
      console.error('Audio playback error:', error)
      alert('Audio playback failed. Please try again.')
    }
  }

  const stop = () => {
    if (!playing) return
    Tone.Transport.stop()
    Tone.Transport.cancel()
    synthsRef.current.forEach(s => s.dispose())
    synthsRef.current = []
    setPlaying(false)
  }

  useEffect(() => () => {
    // cleanup on unmount
    stop()
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const fullPrompt = lyrics
        ? `${instrument} instrumental with melody inspired by lyrics: ${lyrics}`
        : `${instrument} instrumental: ${prompt}`
      
      // Enqueue generation job
      const response = await fetch(`${BACKEND_URL}/api/generate-music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': localStorage.getItem('apiKey') || ''
        },
        body: JSON.stringify({
          instrument,
          prompt,
          lyrics
        })
      })
      if (response.status !== 202) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to enqueue music generation')
      }
      const { jobId } = await response.json()
      
      // Poll for generated file
      let musicBlob
      while (true) {
        const pollRes = await fetch(`${BACKEND_URL}/api/music-file?jobId=${jobId}`, {
          headers: {
            'X-API-Key': localStorage.getItem('apiKey') || ''
          }
        })
        if (pollRes.status === 202) {
          await new Promise(r => setTimeout(r, 2000))
          continue
        }
        if (!pollRes.ok) {
          const errorText = await pollRes.text()
          throw new Error(errorText || 'Failed to fetch generated music')
        }
        musicBlob = await pollRes.blob()
        break
      }
      
      const url = URL.createObjectURL(musicBlob)
      setAudioUrl(url)
      
      // Auto-play the generated music
      const audio = new Audio(url)
      audio.play().catch(err => console.error('Audio playback error:', err))
      
    } catch (error) {
      console.error(error)
      alert('Error generating instrumental: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="studio-page">
      <h1 className="studio-title">🎵 Music Studio</h1>
      <p className="studio-description">
        <strong>Quick Start:</strong> Use the Piano Roll below to create music! Click and drag to add notes, or switch to Sequencer view to arrange clips.
      </p>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <div className="studio-toolbar">
        <button className="add-btn" onClick={addTrack}><FaPlus /> Track</button>
        <div className="mode-selector">
          <label>Mode:</label>
          <select 
            value={showPianoRoll ? 'piano' : 'sequencer'} 
            onChange={(e) => setShowPianoRoll(e.target.value === 'piano')}
            className="mode-dropdown"
          >
            <option value="piano">🎹 Piano Roll - Create melodies note by note</option>
            <option value="sequencer">🎵 Sequencer - Arrange clips and tracks</option>
          </select>
        </div>
        <div className="playback-controls">
          <button 
            className={`control-btn ${playing && !paused ? 'active' : ''}`}
            onClick={play}
            title={playing && !paused ? 'Pause' : paused ? 'Resume' : 'Play'}
          >
            {playing && !paused ? <FaPause /> : <FaPlay />}
          </button>
          <button 
            className="control-btn"
            onClick={stop}
            title="Stop"
          >
            <FaStop />
          </button>
          <div className="transport-info">
            {Math.floor(transportTime / 60)}:{String(Math.floor(transportTime % 60)).padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="generation-controls">
        <label>
          Instrument:
          <select value={instrument} onChange={e => setInstrument(e.target.value)}>
            <option>Piano</option>
            <option>Guitar</option>
            <option>Synth</option>
            <option>Drums</option>
            <option>Bass</option>
          </select>
        </label>
        <label>
          Lyrics:
          <textarea
            value={lyrics}
            onChange={e => {
              setLyrics(e.target.value)
              localStorage.setItem('generatedLyrics', e.target.value)
            }}
            placeholder="Paste lyrics from Lyric Lab"
          />
        </label>
        <label>
          Prompt:
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe instrumental details..."
          />
        </label>
        <button className="generate-btn" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating…' : 'Generate Instrumental'}
        </button>
        {audioUrl && (
          <div className="audio-player">
            <audio controls src={audioUrl} />
            <a href={audioUrl} download="instrumental.wav" className="download-link">Download Instrumental</a>
          </div>
        )}
      </div>



      {!showPianoRoll ? (
        <div className="timeline-wrapper">
          <div className="timeline" style={{ width: timelineWidth }}>
            {tracks.map((track, tIdx) => (
              <div className="track-row" key={track.id}>
                <div className="track-label">Track {tIdx + 1}</div>
                <div
                  className="track-content"
                  data-type="track-content"
                  onDoubleClick={e => handleTrackDoubleClick(e, tIdx)}
                >
                  {track.clips.length === 0 && (
                    <div className="track-placeholder">
                      Double-click here to create a clip
                    </div>
                  )}
                  {track.clips.map((clip, cIdx) => (
                    <div
                      key={clip.id}
                      className={`clip ${dragging && dragging.trackIdx === tIdx && dragging.clipIdx === cIdx ? 'dragging' : ''} ${selectedClip && selectedClip.trackIdx === tIdx && selectedClip.clipIdx === cIdx ? 'selected' : ''} ${clip.notes && clip.notes.length ? 'has-notes' : ''}`}
                      style={{ left: clip.start, width: clip.length, backgroundColor: clip.color }}
                      onMouseDown={e => startDrag(e, tIdx, cIdx)}
                      onClick={e => handleClipClick(e, tIdx, cIdx)}
                      title="Click to edit in Piano Roll"
                    >
                      {clip.notes && clip.notes.length > 0 && (
                        <div className="note-preview">{clip.notes.length} notes</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="piano-roll-container">
          <div className="piano-roll-header">
            <h3>🎹 Piano Roll Editor {selectedClip ? `- Editing Track ${selectedClip.trackIdx + 1}, Clip ${selectedClip.clipIdx + 1}` : '- Create Music!'}</h3>
            <button 
              className="back-btn"
              onClick={() => setShowPianoRoll(false)}
            >
              Back to Sequencer
            </button>
          </div>
          <PianoRoll 
            notes={pianoRollNotes} 
            setNotes={handlePianoRollChange} 
            width={timelineWidth - 100}
            height={500}
          />
        </div>
      )}
    </div>
  )
}

export default MusicStudio
