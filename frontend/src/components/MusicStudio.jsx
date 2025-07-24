import React, { useState, useRef, useEffect } from 'react'
import * as Tone from 'tone'
import LoopBrowser from './LoopBrowser'
import PianoRoll from './PianoRoll'
import './MusicStudio.css'
import { FaPlay, FaPause, FaStop, FaTrash, FaPlus, FaVolumeUp, FaVolumeMute, FaPiano, FaMusic } from 'react-icons/fa'
import { MdPiano } from 'react-icons/md'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://newnewwebsite.onrender.com'
const DIRECT_FILE_ACCESS = true

// Generate a new empty track object
const createTrack = () => ({ id: Date.now() + Math.random(), clips: [] })

const COLORS = ['#667eea', '#ff6b6b', '#10b981', '#facc15', '#ec4899']

// Fallback to synthesized sounds since sample files don't exist yet
// TODO: Add actual drum samples to /public/samples/
const SAMPLE_URLS = {
  kick: null,  // Will use synthesized kick
  snare: null, // Will use synthesized snare
  hat: null    // Will use synthesized hat
}

// For up to three tracks we map kick, snare, hat; extra tracks fall back to a synth.

const MusicStudio = () => {
  const [tracks, setTracks] = useState([createTrack()])
  const [loopClips, setLoopClips] = useState([]) // {id, bpm, filename, start, length}
  const [dragging, setDragging] = useState(null) // {trackIdx, clipIdx, offsetX}
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
