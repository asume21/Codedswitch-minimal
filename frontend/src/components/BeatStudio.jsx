import React, { useState, useEffect, useRef } from 'react'
import './BeatStudio.css'

const BeatStudio = () => {
  const [bpm, setBpm] = useState(90)
  const [style, setStyle] = useState('Hip-Hop')
  const [generating, setGenerating] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioCtxRef = useRef(null)
  const intervalRef = useRef(null)

  const playClick = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 800
    gain.gain.value = 0.15
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  }

  const startBeat = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const intervalMs = (60 / bpm) * 1000
    playClick() // immediate first beat
    intervalRef.current = setInterval(playClick, intervalMs)
    setPlaying(true)
  }

  const stopBeat = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setPlaying(false)
  }

  useEffect(() => () => stopBeat(), [])

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      startBeat()
    }, 1200)
  }
  return (
    <div className="studio-page">
      <h1 className="studio-title">🎧 Beat Studio</h1>
      <p className="studio-description">
        Build custom beats powered by AI. Adjust BPM, choose your style, and export stems directly to Music Studio.
      </p>

      <div className="beat-controls">
        <label>
          Style:
          <select 
            value={style} 
            onChange={(e) => setStyle(e.target.value)}
            id="beat-style-selector"
            name="beatStyle"
            aria-label="Select beat style"
            title="Choose a beat style"
          >
            <option>Hip-Hop</option>
            <option>Trap</option>
            <option>Lo-Fi</option>
            <option>House</option>
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
          />
        </label>

        <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating…' : 'Generate Beat'}
        </button>

        {playing && (
          <button className="btn-secondary" onClick={stopBeat}>
            Stop Preview
          </button>
        )}
      </div>

      {playing && (
        <p className="preview-note">Previewing a simple metronome at {bpm} BPM ({style}). AI-generated audio will replace this.</p>
      )}
    </div>
  )
}

export default BeatStudio
