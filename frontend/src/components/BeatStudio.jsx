import React, { useState, useRef, useEffect } from 'react'
import './BeatStudio.css'
import LoopBrowser from './LoopBrowser'
import * as Tone from 'tone'
import { FaPlay, FaPause, FaStop, FaTrash, FaPlus, FaVolumeUp, FaVolumeMute } from 'react-icons/fa'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://newnewwebsite.onrender.com'
const DIRECT_FILE_ACCESS = true // Set to false if accessing files via backend API

const BeatStudio = () => {
  // State for BPM and track styling
  const [bpm, setBpm] = useState(90)
  const [style, setStyle] = useState('Hip-Hop')
  const [generating, setGenerating] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Synth instances
  const [synths, setSynths] = useState(null)
  
  // Enhanced sequencer state
  const [tracks, setTracks] = useState([
    { id: 1, name: 'Drums', type: 'drums', clips: [], mute: false, color: '#ff6b6b' },
    { id: 2, name: 'Bass', type: 'bass', clips: [], mute: false, color: '#4ecdc4' },
    { id: 3, name: 'Melody', type: 'melody', clips: [], mute: false, color: '#45b7d1' },
    { id: 4, name: 'FX', type: 'fx', clips: [], mute: false, color: '#96ceb4' }
  ])
  
  const [selectedClip, setSelectedClip] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [playheadPosition, setPlayheadPosition] = useState(0)
  const [transportTime, setTransportTime] = useState(0)
  
  // Refs
  const playersRef = useRef({})
  const transportTimeRef = useRef(0)
  const animationFrameRef = useRef(null)
  const sequencerRef = useRef(null)
  
  const PIXELS_PER_SECOND = 50
  const GRID_SIZE = 25
  const TRACK_HEIGHT = 80

  // Initialize synths on component mount
  useEffect(() => {
    // Create synth instances
    const drumSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 1.4 }
    }).toDestination()
    
    const noiseSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 }
    }).toDestination()
    
    const bassSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 1.2 }
    }).toDestination()
    bassSynth.volume.value = -6
    
    const melodySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1 }
    }).toDestination()
    melodySynth.volume.value = -8
    
    const fxSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 0.5 }
    }).toDestination()
    
    setSynths({
      drum: drumSynth,
      noise: noiseSynth,
      bass: bassSynth,
      melody: melodySynth,
      fx: fxSynth
    })
    
    // Cleanup synths when component unmounts
    return () => {
      if (synths) {
        Object.values(synths).forEach(synth => {
          if (synth && synth.dispose) {
            synth.dispose()
          }
        })
      }
    }
  }, [])

  // Enhanced audio playback 
  const playPadClip = (clip) => {
    try {
      Tone.start().then(() => {
        if (!clip) return
        
        if (clip.url) {
          const player = new Tone.Player({
            url: clip.url,
            onload: () => {
              player.start()
            }
          }).toDestination()
        } else {
          switch (clip.type) {
            case 'drum':
              const drumSynth = new Tone.MembraneSynth().toDestination()
              drumSynth.triggerAttackRelease('C1', '8n')
              break
            case 'bass':
              const bassSynth = new Tone.Synth({
                oscillator: { type: 'triangle' }
              }).toDestination()
              bassSynth.triggerAttackRelease('C2', '8n')
              break
            case 'melody':
              const melodySynth = new Tone.PolySynth().toDestination()
              melodySynth.triggerAttackRelease(['C4', 'E4', 'G4'], '8n')
              break
            case 'fx':
              const fxSynth = new Tone.FMSynth().toDestination()
              fxSynth.triggerAttackRelease('C5', '16n')
              break
            default:
              const defaultSynth = new Tone.Synth().toDestination()
              defaultSynth.triggerAttackRelease('C4', '8n')
          }
        }
      })
    } catch (error) {
      console.error('Error playing clip:', error)
      setErrorMessage('Failed to play audio clip')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  // Enhanced beat generation with fallback for development
  const handleGenerate = async () => {
    setGenerating(true)
    setErrorMessage('')
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-music`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': localStorage.getItem('apiKey') || ''
        },
        body: JSON.stringify({ 
          prompt: `Generate a ${style} beat with drums, bass, and melody`, 
          provider: import.meta.env.VITE_DEFAULT_AI_PROVIDER || 'grok',
          duration: 30 
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data && data.audioUrl) {
          setAudioUrl(data.audioUrl)
          return
        }
      }
      
      throw new Error('Backend API failed, using fallback')
    } catch (apiError) {
      console.log('API error, using fallback:', apiError)
    }
    
    try {
      await Tone.start()
      
      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 1.4 }
      }).toDestination()
      kick.volume.value = -6
      
      const snare = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 }
      }).toDestination()
      snare.volume.value = -8
      
      const hihat = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.1, sustain: 0.003, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).toDestination()
      hihat.volume.value = -20
      
      let kickPattern, snarePattern, hihatPattern
      
      switch (style.toLowerCase()) {
        case 'hip-hop':
          kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
          snarePattern = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
          hihatPattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
          break
        case 'electronic':
          kickPattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
          snarePattern = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
          hihatPattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
          break
        case 'jazz':
          kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
          snarePattern = [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1]
          hihatPattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
          break
        default: // Pop
          kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
          snarePattern = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
          hihatPattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
      }
      
      const kickSeq = new Tone.Sequence((time, idx) => {
        if (kickPattern[idx] === 1) {
          kick.triggerAttackRelease('C1', '8n', time)
        }
      }, Array.from({length: 16}, (_, i) => i), "16n")
      
      const snareSeq = new Tone.Sequence((time, idx) => {
        if (snarePattern[idx] === 1) {
          snare.triggerAttackRelease('16n', time)
        }
      }, Array.from({length: 16}, (_, i) => i), "16n")
      
      const hihatSeq = new Tone.Sequence((time, idx) => {
        if (hihatPattern[idx] === 1) {
          hihat.triggerAttackRelease('32n', time)
        }
      }, Array.from({length: 16}, (_, i) => i), "16n")
      
      const recorder = new Tone.Recorder()
      kick.connect(recorder)
      snare.connect(recorder)
      hihat.connect(recorder)
      await recorder.start()
      
      Tone.Transport.bpm.value = bpm
      kickSeq.start(0)
      snareSeq.start(0)
      hihatSeq.start(0)
      
      Tone.Transport.start()
      
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      const recording = await recorder.stop()
      const url = URL.createObjectURL(recording)
      setAudioUrl(url)
      
      Tone.Transport.stop()
      kickSeq.dispose()
      snareSeq.dispose()
      hihatSeq.dispose()
      kick.dispose()
      snare.dispose()
      hihat.dispose()
      
      const drumTrack = tracks.find(t => t.name === 'Drums')
      if (drumTrack) {
        const newClip = {
          id: `generated-drums-${Date.now()}`,
          filename: `${style} Drums`,
          startTime: 0,
          duration: 10,
          color: '#ff6b6b',
          loop: true,
          url: url
        }
        
        addClipToTrack(drumTrack.id, newClip)
      }
      
    } catch (error) {
      console.error('Beat generation error:', error)
      setErrorMessage('Error generating beat: ' + error.message)
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setGenerating(false)
    }
  }

  const stopPlayback = () => {
    Tone.Transport.stop()
    Tone.Transport.cancel() // Clear all scheduled events
    
    Tone.Transport.seconds = 0
    transportTimeRef.current = 0
    setTransportTime(0)
    setPlayheadPosition(0)
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    Object.values(playersRef.current).forEach(player => {
      try {
        if (player) {
          if (player.stop) player.stop()
          if (player.disconnect) player.disconnect()
          if (player.dispose) player.dispose()
        }
      } catch (e) {
        console.error('Error disposing player:', e)
      }
    })
    
    playersRef.current = {}
    
    setPlaying(false)
    setPaused(false)
  }

  const handlePlayPause = async () => {
    try {
      await Tone.start()
      
      if (playing && !paused) {
        transportTimeRef.current = Tone.Transport.seconds
        Tone.Transport.pause()
        setPaused(true)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        return
      }
      
      if (paused) {
        Tone.Transport.start()
        setPaused(false)
        updatePlayhead()
        return
      }
      
      startPlayback()
      
    } catch (error) {
      console.error('Playback error:', error)
      setErrorMessage('Failed to start playback')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const startPlayback = async () => {
    try {
      await Tone.start()
      
      if (paused) {
        Tone.Transport.start()
        setPaused(false)
        setPlaying(true)
        animationFrameRef.current = requestAnimationFrame(updatePlayhead)
        return
      }
      
      Tone.Transport.stop()
      Tone.Transport.cancel()
      
      Object.values(playersRef.current).forEach(player => {
        if (player && player.dispose) player.dispose()
      })
      
      stopPlayback()
      
      Tone.Transport.bpm.value = bpm
      
      setPlayheadPosition(0)
      transportTimeRef.current = 0
      
      const newPlayers = {}
      
      if (tracks.every(track => track.clips.length === 0)) {
        console.log('No clips found, creating default patterns')
        
        const drumSequence = new Tone.Sequence((time, idx) => {
          if (idx === 0 || idx === 8) {
            if (!playersRef.current.kick) {
              playersRef.current.kick = new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 4,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 1.4 }
              }).toDestination()
            }
            playersRef.current.kick.triggerAttackRelease('C1', '8n', time)
          }
          if (idx === 4 || idx === 12) {
            if (!playersRef.current.snare) {
              playersRef.current.snare = new Tone.NoiseSynth({
                noise: { type: 'white' },
                envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 }
              }).toDestination()
            }
            playersRef.current.snare.triggerAttackRelease('16n', time)
          }
          if ([0, 2, 4, 6, 8, 10, 12, 14].includes(idx)) {
            if (!playersRef.current.hihat) {
              playersRef.current.hihat = new Tone.MetalSynth({
                frequency: 200,
                envelope: { attack: 0.001, decay: 0.1, sustain: 0.003, release: 0.01 },
                harmonicity: 5.1,
                modulationIndex: 32,
                resonance: 4000,
                octaves: 1.5
              }).toDestination()
              playersRef.current.hihat.volume.value = -20
            }
            playersRef.current.hihat.triggerAttackRelease('32n', time)
          }
        }, Array.from({length: 16}, (_, i) => i), "16n")
        
        drumSequence.start(0)
        playersRef.current.drumSequence = drumSequence
        
        const bassSequence = new Tone.Sequence((time, note) => {
          if (note) {
            if (!synths) return
            synths.bass.triggerAttackRelease(note, '8n', time)
          }
        }, ['C2', 'G1', 'A#1', 'F1'], '2n')
        
        bassSequence.start(0)
        playersRef.current.bassSequence = bassSequence
      } else {
        // Schedule all clips for playback
        tracks.forEach((track) => {
          if (track.mute) return
          
          track.clips.forEach((clip) => {
            try {
              const startOffset = clip.position / PIXELS_PER_SECOND
              const clipDuration = clip.duration || 2 // Default 2 seconds if not set
              
              // Handle clips with URLs - these should still work if user has custom clips
              if (clip.url) {
                try {
                  const player = new Tone.Player({
                    url: clip.url,
                    loop: clip.loop || false,
                    onload: () => {
                      console.log(`Loaded clip: ${clip.filename || 'unnamed'}`)
                    },
                    onerror: (e) => {
                      console.error(`Failed to load clip: ${clip.filename}`, e)
                      // If URL fails, fallback to synthesizer
                      scheduleLocalSynthClip(track, clip, startOffset, clipDuration)
                    }
                  }).toDestination()
                  
                  Tone.Transport.schedule(time => {
                    player.start(time)
                  }, startOffset)
                  
                  if (!clip.loop) {
                    Tone.Transport.schedule(time => {
                      player.stop(time)
                    }, startOffset + clipDuration)
                  }
                  
                  // Store player reference for cleanup
                  newPlayers[`${track.id}-${clip.id}`] = player
                } catch (urlError) {
                  console.error('Error loading URL clip, using synth fallback:', urlError)
                  // Fallback to synthesizer if URL loading fails
                  scheduleLocalSynthClip(track, clip, startOffset, clipDuration)
                }
              } else {
                // For local synth clips, schedule them directly
                scheduleLocalSynthClip(track, clip, startOffset, clipDuration)
              }
            } catch (error) {
              console.error('Error processing clip:', error)
            }
          })
        })
      }
      
      function scheduleLocalSynthClip(track, clip, startOffset, clipDuration) {
        if (!synths) return
        
        let clipSource
        let pattern
        
        // Choose appropriate synth based on track type
        if (track.name.toLowerCase().includes('drum')) {
          clipSource = synths.drum
          pattern = ['C1', null, 'E1', null]
        } else if (track.name.toLowerCase().includes('bass')) {
          clipSource = synths.bass
          pattern = ['C2', null, 'G1', null]
        } else if (track.name.toLowerCase().includes('melody')) {
          clipSource = synths.melody
          pattern = ['C4', 'E4', 'G4', 'B4']
        } else if (track.name.toLowerCase().includes('fx')) {
          clipSource = synths.fx
          pattern = ['C5', null, 'D5', null]
        } else {
          clipSource = synths.drum // Default to drum
          pattern = ['C1', null, 'E1', null]
        }
        
        if (clipSource) {
          // Create a sequence for this clip
          const sequence = new Tone.Sequence((time, note) => {
            if (note) {
              if (track.name.toLowerCase().includes('drum')) {
                clipSource.triggerAttackRelease(note, '8n', time)
              } else if (track.name.toLowerCase().includes('bass')) {
                clipSource.triggerAttackRelease(note, '8n', time)
              } else if (track.name.toLowerCase().includes('melody')) {
                clipSource.triggerAttackRelease(note, '8n', time)
              } else {
                clipSource.triggerAttackRelease(note, '16n', time)
              }
            }
          }, pattern, '8n')
          
          // Schedule sequence to start and stop
          Tone.Transport.schedule(time => {
            sequence.start(time)
          }, startOffset)
          
          if (!clip.loop) {
            Tone.Transport.schedule(time => {
              sequence.stop(time)
            }, startOffset + clipDuration)
          }
          
          // Store sequence reference for cleanup
          newPlayers[`${track.id}-${clip.id}`] = sequence
        }
      }
      
      playersRef.current = { ...playersRef.current, ...newPlayers }
      Tone.Transport.start()
      setPlaying(true)
      
      animationFrameRef.current = requestAnimationFrame(updatePlayhead)
    } catch (error) {
      console.error('Error starting playback:', error)
      setErrorMessage('Failed to start playback: ' + error.message)
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

const updatePlayhead = () => {
  if (!(playing && !paused)) return
  
  // Get current transport time
  const now = Tone.Transport.seconds
  transportTimeRef.current = now
  setTransportTime(now)
  
  // Update playhead position
  const pixelsPerSecond = PIXELS_PER_SECOND
  const newPosition = now * pixelsPerSecond
  setPlayheadPosition(newPosition)
  
  animationFrameRef.current = requestAnimationFrame(updatePlayhead)
}

// Clip management functions
const addClipToTrack = (trackId, clip) => {
  try {
    // If clip doesn't have an ID, add one
    if (!clip.id) clip.id = `clip-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    
    // Position the clip at the current playhead position if not specified
    if (clip.position === undefined) {
      clip.position = playheadPosition
    }
    
    // Set default duration if not provided
    if (!clip.duration) {
      clip.duration = 2 // 2 seconds default
    }
    
    // If clip references an external URL, create a local synthesized version instead
    // This avoids 404 errors when external URLs are unavailable
    if (clip.url && clip.url.includes('tonejs.github.io')) {
      console.log('Converting external URL clip to local synth-based clip:', clip.filename)
      
      // Remove external URL and set type based on filename
      const filename = clip.filename?.toLowerCase() || ''
      
      // Determine appropriate type based on filename
      if (filename.includes('kick') || filename.includes('bass') || filename.includes('bd')) {
        clip.type = 'drum'
        clip.note = 'C1' // Kick drum note
        delete clip.url
      } else if (filename.includes('snare') || filename.includes('clap') || filename.includes('sd')) {
        clip.type = 'drum'
        clip.note = 'E1' // Snare drum note
        delete clip.url
      } else if (filename.includes('hi-hat') || filename.includes('hihat') || filename.includes('hh')) {
        clip.type = 'drum'
        clip.note = 'G2' // Hi-hat note
        delete clip.url
      } else if (filename.includes('bass') || filename.includes('808')) {
        clip.type = 'bass'
        delete clip.url
      } else if (filename.includes('synth') || filename.includes('lead') || filename.includes('pad')) {
        clip.type = 'melody'
        delete clip.url
      } else {
        clip.type = 'fx'
        delete clip.url
      }
    }
    
    // Find the track to update
    const track = tracks.find(t => t.id === trackId)
    if (!track) {
      console.error('Track not found:', trackId)
      return
    }
    
    // Make sure clip type matches track type if not specified
    if (!clip.type) {
      if (track.name.toLowerCase().includes('drum')) {
        clip.type = 'drum'
      } else if (track.name.toLowerCase().includes('bass')) {
        clip.type = 'bass'
      } else if (track.name.toLowerCase().includes('melody')) {
        clip.type = 'melody'
      } else if (track.name.toLowerCase().includes('fx')) {
        clip.type = 'fx'
      } else {
        clip.type = 'drum' // Default
      }
    }
    
    setTracks(prevTracks => {
      return prevTracks.map(track => {
        if (track.id === trackId) {
          return { ...track, clips: [...track.clips, clip] }
        }
        return track
      })
    })
    
    return clip.id
  } catch (error) {
    console.error('Error adding clip to track:', error)
    setErrorMessage(`Failed to add clip: ${error.message}`)
    setTimeout(() => setErrorMessage(''), 3000)
    return null
  }
}

  const handleMouseMove = (e) => {
    if (!dragging) return
    
    const deltaX = e.clientX - dragging.startX
    const newStartTime = Math.max(0, (deltaX / PIXELS_PER_SECOND))
    
    setTracks(prev => prev.map(track => 
      track.id === dragging.trackId 
        ? {
            ...track,
            clips: track.clips.map(clip => 
              clip.id === dragging.clipId 
                ? { ...clip, startTime: newStartTime }
                : clip
            )
          }
        : track
    ))
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  // Add event listeners for drag and drop
  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="beat-studio">
      <h1 className="studio-title">🎧 Beat Studio</h1>
      <p className="studio-description">
        Professional beat sequencer with multi-track support, drag-and-drop editing, and AI-powered generation.
      </p>
      
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      
      <div className="beat-controls">
        <div className="control-group">
          <label>
            Style:
            <select 
              value={style} 
              onChange={(e) => setStyle(e.target.value)}
              className="style-selector"
            >
              <option value="Hip-Hop">Hip-Hop</option>
              <option value="Trap">Trap</option>
              <option value="Lo-Fi">Lo-Fi</option>
              <option value="House">House</option>
              <option value="Techno">Techno</option>
              <option value="Drum & Bass">Drum & Bass</option>
            </select>
          </label>

          <label>
            BPM: {bpm}
            <input
              type="range"
              min="60"
              max="180"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="bpm-slider"
            />
          </label>
        </div>

        <div className="playback-controls">
          <button 
            className={`control-btn ${playing && !paused ? 'active' : ''}`}
            onClick={handlePlayPause}
            title={playing && !paused ? 'Pause' : paused ? 'Resume' : 'Play'}
          >
            {playing && !paused ? <FaPause /> : <FaPlay />}
          </button>
          
          <button 
            className="control-btn"
            onClick={stopPlayback}
            title="Stop"
          >
            <FaStop />
          </button>
          
          <div className="transport-info">
            {Math.floor(transportTime / 60)}:{String(Math.floor(transportTime % 60)).padStart(2, '0')}
          </div>
        </div>

        <div className="generation-controls">
          <button 
            className="btn-primary generate-btn" 
            onClick={handleGenerate} 
            disabled={generating}
          >
            {generating ? 'Generating…' : 'Generate Beat'}
          </button>
          
          <LoopBrowser onAddLoop={(clip) => {
            // Add to first available track or drums track
            const targetTrack = tracks.find(t => t.type === 'drums') || tracks[0]
            addClipToTrack(targetTrack.id, clip)
          }} />
        </div>
      </div>

      {/* Multi-track Sequencer */}
      <div className="sequencer" ref={sequencerRef}>
        <div className="sequencer-header">
          <h3>Multi-Track Sequencer</h3>
          <div className="timeline-markers">
            {Array.from({ length: 20 }, (_, i) => (
              <div 
                key={i} 
                className="timeline-marker" 
                style={{ left: i * PIXELS_PER_SECOND * 4 }}
              >
                {i * 4}s
              </div>
            ))}
          </div>
        </div>

        <div className="tracks-container">
          {tracks.map((track, trackIndex) => (
            <div key={track.id} className="track">
              <div className="track-header">
                <div className="track-info">
                  <h4>{track.name}</h4>
                  <span className="track-type">{track.type}</span>
                </div>
                <div className="track-controls">
                  <button
                    className={`mute-btn ${track.mute ? 'muted' : ''}`}
                    onClick={() => toggleTrackMute(track.id)}
                    title={track.mute ? 'Unmute' : 'Mute'}
                  >
                    {track.mute ? <FaVolumeMute /> : <FaVolumeUp />}
                  </button>
                  <button
                    className="add-clip-btn"
                    onClick={() => {/* Open clip browser for this track */}}
                    title="Add Clip"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              
              <div 
                className="track-content"
                style={{ height: TRACK_HEIGHT }}
              >
                {/* Grid lines */}
                <div className="grid-lines">
                  {Array.from({ length: 80 }, (_, i) => (
                    <div 
                      key={i} 
                      className="grid-line" 
                      style={{ left: i * GRID_SIZE }}
                    />
                  ))}
                </div>
                
                {/* Track clips */}
                {track.clips.map((clip) => (
                  <div
                    key={clip.id}
                    className={`sequencer-clip ${selectedClip?.trackId === track.id && selectedClip?.clipId === clip.id ? 'selected' : ''}`}
                    style={{
                      left: clip.startTime * PIXELS_PER_SECOND,
                      width: clip.duration * PIXELS_PER_SECOND,
                      backgroundColor: clip.color || track.color,
                      opacity: track.mute ? 0.5 : 1
                    }}
                    onMouseDown={(e) => startDrag(e, track.id, clip.id)}
                    onClick={() => {
                      setSelectedClip({ trackId: track.id, clipId: clip.id });
                      // Preview clip when clicked
                      if (clip.url) {
                        playPadClip(clip);
                      }
                    }}
                  >
                    <div className="clip-content">
                      <span className="clip-name">{clip.filename}</span>
                      {clip.loop && <span className="loop-indicator">🔄</span>}
                    </div>
                    <div className="clip-controls">
                      <button
                        className="preview-clip-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          playPadClip(clip);
                        }}
                        title="Preview Clip"
                      >
                        ▶️
                      </button>
                      {selectedClip?.trackId === track.id && selectedClip?.clipId === clip.id && (
                        <button
                          className="remove-clip-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeClip(track.id, clip.id);
                          }}
                          title="Remove Clip"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Playhead */}
          <div 
            className="playhead" 
            style={{ left: `${playheadPosition}px` }} 
          />
        </div>
      </div>

      {/* Generated Audio Player */}
      {audioUrl && (
        <div className="audio-player">
          <h3>Generated Beat</h3>
          <audio controls src={audioUrl} />
          <div className="audio-actions">
            <a href={audioUrl} download="beat.wav" className="download-btn">
              Download Beat
            </a>
            <button 
              className="add-to-sequencer-btn"
              onClick={() => {
                const newClip = {
                  filename: 'Generated Beat',
                  bpm: bpm,
                  url: audioUrl
                }
                addClipToTrack(tracks[0].id, newClip)
              }}
            >
              Add to Sequencer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BeatStudio
