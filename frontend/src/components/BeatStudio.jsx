import React, { useState, useRef, useEffect } from 'react'
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
  const [padClips, setPadClips] = useState(Array(9).fill(null));
  const [playheadX, setPlayheadX] = useState(0);
  const markerIntervalRef = useRef(null);

  const playPadClip = (clip) => {
    const url = `${BACKEND_URL}/api/loops/${clip.bpm}/${clip.filename}`;
    console.log('Playing pad clip:', url);
    const audio = new Audio(url);
    audio.play().catch(err => console.error('Audio playback error:', err));
  };
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Enqueue generation job
      const res = await fetch(`${BACKEND_URL}/api/generate-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${style} beat`, duration: 30 })
      });
      if (res.status !== 202) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to enqueue beat generation');
      }
      const { jobId } = await res.json();
      // Poll for generated file
      let musicBlob;
      while (true) {
        const pollRes = await fetch(`${BACKEND_URL}/api/music-file?jobId=${jobId}`);
        if (pollRes.status === 202) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        if (!pollRes.ok) {
          const errorText = await pollRes.text();
          throw new Error(errorText || 'Failed to fetch generated beat');
        }
        musicBlob = await pollRes.blob();
        break;
      }
      const url = URL.createObjectURL(musicBlob);
      setAudioUrl(url);
      const audio = new Audio(url);
      audio.play().catch(err => console.error('Audio playback error:', err));
      
    } catch (error) {
      console.error(error);
      alert('Error generating beat: ' + error.message);
    } finally {
      setGenerating(false);
    }
  }

  const handlePlayClick = async () => {
    await Tone.start();
    startPlayback();
  };

  // Tone.js loop scheduler
  const startPlayback = async () => {
    if (playing) return;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    // Dispose old players
    Object.values(playersRef.current).forEach(p => p.dispose());
    playersRef.current = {};
    // Schedule loops
    loopClips.forEach(clip => {
      const url = `${BACKEND_URL}/api/loops/${clip.bpm}/${clip.filename}`;
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
    // Playhead marker
    if (markerIntervalRef.current) clearInterval(markerIntervalRef.current);
    setPlayheadX(0);
    markerIntervalRef.current = setInterval(() => {
      setPlayheadX(x => x + PIXELS_PER_SECOND * 0.1);
    }, 100);
  };

  const stopPlayback = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Object.values(playersRef.current).forEach(p => p.dispose());
    playersRef.current = {};
    setPlaying(false);
    clearInterval(markerIntervalRef.current);
    setPlayheadX(0);
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
          const newClip = { id: Date.now() + Math.random(), bpm: loopBpm, filename, start: 0, length: 160 };
          setLoopClips(prev => [...prev, newClip]);
          setPadClips(prevPads => {
            const next = [...prevPads];
            const emptyIndex = next.findIndex(p => p == null);
            if (emptyIndex !== -1) next[emptyIndex] = newClip;
            return next;
          });
        }} />

        {!playing && (
          <button className="btn-secondary" onClick={handlePlayClick}>
            Play Preview
          </button>
        )}
        {playing && (
          <button className="btn-secondary" onClick={stopPlayback}>
            Stop Preview
          </button>
        )}
      </div>

      <div className="pad-grid">
        {padClips.map((clip, idx) => (
          <button
            key={idx}
            className="pad"
            onClick={() => clip && playPadClip(clip)}
            disabled={!clip}
          >
            {clip ? clip.filename : `Pad ${idx+1}`}
          </button>
        ))}
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
          <div className="playhead-marker" style={{ left: playheadX }} />

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
