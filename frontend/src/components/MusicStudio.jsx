import React, { useState, useRef, useEffect } from 'react'
import * as Tone from 'tone'
import LoopBrowser from './LoopBrowser'
import './MusicStudio.css'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';

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
  const [instrument, setInstrument] = useState('Piano')
  const [prompt, setPrompt] = useState('')
  const [lyrics, setLyrics] = useState(localStorage.getItem('generatedLyrics') || '')
  const [generating, setGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
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

  const startDrag = (e, trackIdx, clipIdx) => {
    e.preventDefault()
    const clip = tracks[trackIdx].clips[clipIdx]
    setDragging({ trackIdx, clipIdx, offsetX: e.clientX - clip.start })
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
    Tone.Transport.schedule((time) => {
      synth.triggerAttackRelease('C4', durationSec, time)
    }, offsetSec)
  }

  const play = async () => {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, lyrics, duration: 30 })
      })
      if (response.status !== 202) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to enqueue music generation')
      }
      const { jobId } = await response.json()
      
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
        Arrange tracks, add clips with a double-click, and drag to reposition. Now add loops below!
      </p>

      <div className="studio-toolbar">
        <button className="add-btn" onClick={addTrack}>+ Track</button>
        <button className="play-btn" onClick={play} disabled={playing}>▶ Play</button>
        <button className="stop-btn" onClick={stop} disabled={!playing}>■ Stop</button>
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
                {track.clips.map((clip, cIdx) => (
                  <div
                    key={clip.id}
                    className={`clip ${dragging && dragging.trackIdx === tIdx && dragging.clipIdx === cIdx ? 'dragging' : ''}`}
                    style={{ left: clip.start, width: clip.length, backgroundColor: clip.color }}
                    onMouseDown={e => startDrag(e, tIdx, cIdx)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MusicStudio
