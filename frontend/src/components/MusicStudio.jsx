import React, { useState, useRef, useEffect } from 'react'
import * as Tone from 'tone'
import LoopBrowser from './LoopBrowser'
import './MusicStudio.css'

// Generate a new empty track object
const createTrack = () => ({ id: Date.now() + Math.random(), clips: [] })

const COLORS = ['#667eea', '#ff6b6b', '#10b981', '#facc15', '#ec4899']

// Remote open-source drum samples (small files)
// Local drum samples served from /public/samples (add files there)
const SAMPLE_URLS = {
  kick: '/samples/E808_BD[short]-01.wav',
  snare: '/samples/E808_SD-01.wav',
  hat:  '/samples/E808_CH-01.wav'
}

// For up to three tracks we map kick, snare, hat; extra tracks fall back to a synth.

const MusicStudio = () => {
  const [tracks, setTracks] = useState([createTrack()])
  const [loopClips, setLoopClips] = useState([]) // {id, bpm, filename, start, length}
  const [dragging, setDragging] = useState(null) // {trackIdx, clipIdx, offsetX}
  const [playing, setPlaying] = useState(false)
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
  const scheduleClipSample = (player, clip) => {
    const offsetSec = clip.start / PIXELS_PER_SECOND
    Tone.Transport.schedule((time) => {
      player.start(time)
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
    await Tone.start() // Resume AudioContext after user gesture

    // Clean previous scheduling
    Tone.Transport.stop()
    Tone.Transport.cancel()
    synthsRef.current.forEach(s => s.dispose())
    synthsRef.current = []

    // Load sample players once
    if (!playersRef.current) {
      playersRef.current = new Tone.Players(SAMPLE_URLS).toDestination()
      await playersRef.current.load()

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
        track.clips.forEach(clip => scheduleClipSample(playersRef.current.get('kick'), clip))
      } else if (idx === 1) {
        // Snare
        track.clips.forEach(clip => scheduleClipSample(playersRef.current.get('snare'), clip))
      } else if (idx === 2) {
        // Hi-hat
        track.clips.forEach(clip => scheduleClipSample(playersRef.current.get('hat'), clip))
      } else {
        // Extra tracks fall back to synth tone
        const synth = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination()
        synthsRef.current.push(synth)
        track.clips.forEach(clip => scheduleClipSynth(synth, clip))
      }
    })

    Tone.Transport.start()
    setPlaying(true)
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

      {/* Loop Machine Section */}
      <div style={{margin: '24px 0', padding: '16px', background: '#181818', borderRadius: '8px'}}>
        <h2 style={{marginBottom: 8}}>Loop Machine</h2>
        <LoopBrowser onAddLoop={({ bpm, filename }) => {
          // Place loop at start of timeline, length = 8s (adjust as needed)
          setLoopClips(prev => [...prev, {
            id: Date.now() + Math.random(),
            bpm,
            filename,
            start: 0,
            length: 160, // px, adjust for loop duration
          }])
        }} />
        <div className="track-row loop-track-row">
          <div className="track-label">Loops</div>
          <div className="track-content loop-content" style={{minHeight: 60}}>
            {loopClips.map((clip, idx) => (
              <div
                key={clip.id}
                className="clip loop-clip"
                style={{ left: clip.start, width: clip.length, backgroundColor: '#3b82f6', opacity: 0.7 }}
                title={`${clip.bpm}/${clip.filename}`}
              >{clip.filename}</div>
            ))}
          </div>
        </div>
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
