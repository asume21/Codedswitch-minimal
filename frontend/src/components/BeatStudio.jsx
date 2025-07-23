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

  // Enhanced audio playback with error handling
  const playPadClip = async (clip) => {
    try {
      await Tone.start()
      
      if (DIRECT_FILE_ACCESS) {
        // Direct file access for local development
        const audioPath = `/sounds/loops/${clip.bpm}/${clip.filename}`
        const player = new Tone.Player(audioPath).toDestination()
        await player.load()
        player.start()
      } else {
        // API access for production
        const url = `${BACKEND_URL}/api/loops/${clip.bpm}/${clip.filename}`
        const player = new Tone.Player(url).toDestination()
        await player.load()
        player.start()
      }
    } catch (error) {
      console.error('Error playing clip:', error)
      setErrorMessage('Failed to play audio clip')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  // Enhanced beat generation
  const handleGenerate = async () => {
    setGenerating(true)
    setErrorMessage('')
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${style} beat`, duration: 30 })
      })
      
      if (res.status !== 202) {
        const errorText = await res.text()
        throw new Error(errorText || 'Failed to enqueue beat generation')
      }
      
      const { jobId } = await res.json()
      
      // Poll for generated file
      let musicBlob
      while (true) {
        const pollRes = await fetch(`${BACKEND_URL}/api/music-file?jobId=${jobId}`)
        if (pollRes.status === 202) {
          await new Promise(r => setTimeout(r, 2000))
          continue
        }
        if (!pollRes.ok) {
          const errorText = await pollRes.text()
          throw new Error(errorText || 'Failed to fetch generated beat')
        }
        musicBlob = await pollRes.blob()
        break
      }
      
      const url = URL.createObjectURL(musicBlob)
      setAudioUrl(url)
      
    } catch (error) {
      console.error('Beat generation error:', error)
      setErrorMessage('Error generating beat: ' + error.message)
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setGenerating(false)
    }
  }

  // Enhanced playback with pause/resume support
  const handlePlayPause = async () => {
    try {
      await Tone.start()
      
      if (playing && !paused) {
        // Pause
        transportTimeRef.current = Tone.Transport.seconds
        Tone.Transport.pause()
        setPaused(true)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        return
      }
      
      if (paused) {
        // Resume
        Tone.Transport.start()
        setPaused(false)
        updatePlayhead()
        return
      }
      
      // Start from beginning
      startPlayback()
      
    } catch (error) {
      console.error('Playback error:', error)
      setErrorMessage('Failed to start playback')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const startPlayback = async () => {
    if (playing && !paused) return
    
    try {
      // Stop and clean up previous playback
      Tone.Transport.stop()
      Tone.Transport.cancel()
      
      // Dispose old players
      Object.values(playersRef.current).forEach(player => {
        if (player && player.dispose) player.dispose()
      })
      playersRef.current = {}
      
      // Reset transport
      Tone.Transport.seconds = 0
      transportTimeRef.current = 0
      setTransportTime(0)
      setPlayheadPosition(0)
      
      // Set BPM
      Tone.Transport.bpm.value = bpm
      
      // Schedule all clips from all tracks
      tracks.forEach(track => {
        if (track.mute) return
        
        track.clips.forEach(clip => {
          const clipId = `${track.id}-${clip.id}`
          
          try {
            let audioPath
            if (DIRECT_FILE_ACCESS) {
              audioPath = `/sounds/loops/${clip.bpm || bpm}/${clip.filename}`
            } else {
              audioPath = `${BACKEND_URL}/api/loops/${clip.bpm || bpm}/${clip.filename}`
            }
            
            const player = new Tone.Player(audioPath).toDestination()
            player.loop = clip.loop || false
            
            playersRef.current[clipId] = player
            
            const startTime = clip.startTime || 0
            Tone.Transport.schedule((time) => {
              if (playersRef.current[clipId]) {
                playersRef.current[clipId].start(time)
              }
            }, startTime)
            
          } catch (error) {
            console.error(`Error scheduling clip ${clip.filename}:`, error)
          }
        })
      })
      
      // Start transport and update state
      Tone.Transport.start()
      setPlaying(true)
      setPaused(false)
      
      // Start playhead animation
      updatePlayhead()
      
    } catch (error) {
      console.error('Error starting playback:', error)
      setErrorMessage('Failed to start playback')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const stopPlayback = () => {
    Tone.Transport.stop()
    Tone.Transport.cancel()
    
    // Dispose all players
    Object.values(playersRef.current).forEach(player => {
      if (player && player.dispose) player.dispose()
    })
    playersRef.current = {}
    
    setPlaying(false)
    setPaused(false)
    setTransportTime(0)
    setPlayheadPosition(0)
    transportTimeRef.current = 0
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const updatePlayhead = () => {
    if (playing && !paused) {
      const currentTime = Tone.Transport.seconds
      setTransportTime(currentTime)
      setPlayheadPosition(currentTime * PIXELS_PER_SECOND)
      
      animationFrameRef.current = requestAnimationFrame(updatePlayhead)
    }
  }

  // Clip management functions
  const addClipToTrack = (trackId, clip) => {
    const newClip = {
      id: Date.now() + Math.random(),
      filename: clip.filename,
      bpm: clip.bpm,
      startTime: 0,
      duration: 4, // Default 4 seconds
      loop: false,
      color: tracks.find(t => t.id === trackId)?.color || '#666'
    }
    
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, clips: [...track.clips, newClip] }
        : track
    ))
  }

  const removeClip = (trackId, clipId) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, clips: track.clips.filter(c => c.id !== clipId) }
        : track
    ))
    setSelectedClip(null)
  }

  const toggleTrackMute = (trackId) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, mute: !track.mute } : track
    ))
  }

  // Drag and drop functionality
  const startDrag = (e, trackId, clipId) => {
    e.preventDefault()
    const clip = tracks.find(t => t.id === trackId)?.clips.find(c => c.id === clipId)
    if (!clip) return
    
    setDragging({ trackId, clipId, startX: e.clientX })
    setSelectedClip({ trackId, clipId })
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
    <div className="studio-page">
      <h1 className="studio-title">🎧 Beat Studio</h1>
      <p className="studio-description">
        Professional beat sequencer with multi-track support, drag-and-drop editing, and AI-powered generation.
      </p>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <div className="beat-controls">
        <div className="control-group">
          <label>
            Style:
            <select 
              value={style} 
              onChange={(e) => setStyle(e.target.value)}
              className="style-selector"
            >
              <option>Hip-Hop</option>
              <option>Trap</option>
              <option>Lo-Fi</option>
              <option>House</option>
              <option>Techno</option>
              <option>Drum & Bass</option>
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
                      backgroundColor: clip.color,
                      opacity: track.mute ? 0.5 : 1
                    }}
                    onMouseDown={(e) => startDrag(e, track.id, clip.id)}
                    onClick={() => setSelectedClip({ trackId: track.id, clipId: clip.id })}
                  >
                    <div className="clip-content">
                      <span className="clip-name">{clip.filename}</span>
                      {clip.loop && <span className="loop-indicator">🔄</span>}
                    </div>
                    {selectedClip?.trackId === track.id && selectedClip?.clipId === clip.id && (
                      <button
                        className="remove-clip-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeClip(track.id, clip.id)
                        }}
                        title="Remove Clip"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Playhead */}
          <div 
            className="playhead" 
            style={{ left: playheadPosition }}
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
