import React, { useState, useRef } from 'react'
import './BeatStudio.css'
import LoopBrowser from './LoopBrowser'
import * as Tone from 'tone'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';

const BeatStudio = () => {
  const [bpm, setBpm] = useState(90)
  const [style, setStyle] = useState('Hip-Hop')
  const [generating, setGenerating] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [loopClips, setLoopClips] = useState([])
  const PIXELS_PER_SECOND = 20
  const playersRef = useRef({})
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${style} beat`, duration: 30 })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate beat');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error(error);
      alert('Error generating beat: ' + error.message);
    } finally {
      setGenerating(false);
    }
  }

  // Tone.js loop scheduler
  const startPlayback = async () => {
    if (playing) return;
    await Tone.start();
    Tone.Transport.stop();
    Tone.Transport.cancel();
    // Dispose old players
    Object.values(playersRef.current).forEach(p => p.dispose());
    playersRef.current = {};
    // Schedule loops
    loopClips.forEach(clip => {
      const url = `/loops/${clip.bpm}/${clip.filename}`;
      const player = new Tone.Player(url).toDestination();
      player.loop = true;
      const durationSec = clip.length / PIXELS_PER_SECOND;
      player.loopEnd = durationSec;
      playersRef.current[clip.id] = player;
      const timeOffset = clip.start / PIXELS_PER_SECOND;
      Tone.Transport.schedule(time => player.start(time), timeOffset);
    });
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.start();
    setPlaying(true);
  };

  const stopPlayback = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Object.values(playersRef.current).forEach(p => p.dispose());
    playersRef.current = {};
    setPlaying(false);
  };

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
        <LoopBrowser onAddLoop={({ bpm: loopBpm, filename }) => {
          setLoopClips(prev => [...prev, { id: Date.now() + Math.random(), bpm: loopBpm, filename, start: 0, length: 160 }]);
        }} />

        {!playing && (
          <button className="btn-secondary" onClick={startPlayback}>
            Play Preview
          </button>
        )}
        {playing && (
          <button className="btn-secondary" onClick={stopPlayback}>
            Stop Preview
          </button>
        )}
      </div>

      {playing && (
        <p className="preview-note">Previewing loops at {bpm} BPM ({style}).</p>
      )}
      {audioUrl && (
        <div className="audio-player">
          <audio controls src={audioUrl} />
          <a href={audioUrl} download="beat.wav" className="download-link">Download Beat</a>
        </div>
      )}
      <div className="sequencer">
        <h2 className="sequencer-title">Sequencer</h2>
        <div className="sequencer-grid">
          {loopClips.length === 0 && (
            <div className="sequencer-placeholder">No loops in sequencer. Add a loop to track to visualize the sequencer.</div>
          )}

          {loopClips.map((clip, index) => (
            <div
  key={clip.id}
  className="sequencer-clip"
  style={{
    position: 'absolute',
    top: index * 50,
    left: clip.start * PIXELS_PER_SECOND,
    width: clip.length * PIXELS_PER_SECOND,
    height: 40,
    backgroundColor: '#1db954',
    borderRadius: 4,
    color: '#fff',
    padding: '4px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis'
  }}
>
  {clip.filename}
</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BeatStudio
