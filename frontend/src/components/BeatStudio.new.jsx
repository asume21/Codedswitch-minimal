import React, { useState, useRef, useEffect } from 'react';
import './BeatStudio.css';
import * as Tone from 'tone';
import { FaPlay, FaStop, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

// Track configuration
const INITIAL_TRACKS = [
  { id: 'kick', name: 'Kick', color: '#ff6b6b', pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0] },
  { id: 'snare', name: 'Snare', color: '#4ecdc4', pattern: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0] },
  { id: 'hihat', name: 'Hi-Hat', color: '#45b7d1', pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { id: 'bass', name: 'Bass', color: '#96ceb4', pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1] },
];

const BeatStudio = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(-1);
  const [mutedTracks, setMutedTracks] = useState({});
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [needsInteraction, setNeedsInteraction] = useState(true);
  
  const synths = useRef({
    kick: null,
    snare: null,
    hihat: null,
    bass: null
  });

  // Initialize audio
  const initializeAudio = async () => {
    try {
      await Tone.start();
      const limiter = new Tone.Limiter(-6).toDestination();
      
      // Initialize synths
      synths.current.kick = new Tone.MembraneSynth({
        pitchDecay: 0.05, octaves: 4, oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 1.4 }
      }).connect(limiter);
      
      synths.current.snare = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 }
      }).connect(limiter);
      
      synths.current.hihat = new Tone.MetalSynth({
        frequency: 200, harmonicity: 5.1, modulationIndex: 32,
        resonance: 4000, octaves: 1.5,
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 }
      }).connect(limiter);
      
      synths.current.bass = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0.5, release: 0.5 }
      }).connect(limiter);
      
      Tone.Destination.volume.value = -5;
      setIsInitialized(true);
      setNeedsInteraction(false);
      return true;
    } catch (err) {
      console.error('Audio init error:', err);
      return false;
    }
  };

  // Play/stop functions
  const playBeat = async () => {
    if (needsInteraction) {
      await initializeAudio();
    }
    
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;
    setCurrentStep(-1);
    
    const stepRef = { current: 0 };
    
    const loop = new Tone.Loop((time) => {
      const step = stepRef.current % 16;
      setCurrentStep(step);
      
      tracks.forEach(track => {
        if (!mutedTracks[track.id] && track.pattern[step] && synths.current[track.id]) {
          try {
            if (track.id === 'kick') synths.current.kick.triggerAttackRelease('C1', '8n', time);
            else if (track.id === 'snare') synths.current.snare.triggerAttackRelease('8n', time);
            else if (track.id === 'hihat') synths.current.hihat.triggerAttackRelease('C6', '16n', time);
            else if (track.id === 'bass') synths.current.bass.triggerAttackRelease('C2', '8n', time);
          } catch (e) { console.error(e); }
        }
      });
      
      stepRef.current++;
    }, '16n');
    
    loop.start(0);
    Tone.Transport.start();
    setIsPlaying(true);
  };
  
  const stopBeat = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
    setCurrentStep(-1);
  };

  // UI handlers
  const toggleStep = (trackId, stepIndex) => {
    if (isPlaying) return;
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, pattern: track.pattern.map((v, i) => i === stepIndex ? (v ? 0 : 1) : v) }
        : track
    ));
  };

  const toggleMute = (trackId) => {
    setMutedTracks(prev => ({ ...prev, [trackId]: !prev[trackId] }));
  };

  const handleBpmChange = (e) => {
    const newBpm = Math.min(200, Math.max(40, parseInt(e.target.value) || 120));
    setBpm(newBpm);
    if (isPlaying) Tone.Transport.bpm.value = newBpm;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(synths.current).forEach(synth => synth?.dispose?.());
      if (Tone.Transport.state === 'started') Tone.Transport.stop();
    };
  }, []);

  return (
    <div className="beat-studio">
      <h2>Beat Studio</h2>
      
      <div className="controls">
        <div className="transport-controls">
          {!isPlaying ? (
            <button className="play-btn" onClick={playBeat}>
              <FaPlay /> Play
            </button>
          ) : (
            <button className="stop-btn" onClick={stopBeat}>
              <FaStop /> Stop
            </button>
          )}
          
          <div className="bpm-control">
            <label>BPM:</label>
            <input 
              type="number" 
              min="40" 
              max="200" 
              value={bpm} 
              onChange={handleBpmChange} 
              disabled={isPlaying}
            />
          </div>
        </div>
      </div>
      
      <div className="sequencer">
        <div className="tracks">
          {tracks.map(track => (
            <div key={track.id} className="track">
              <div className="track-header">
                <span className="track-name" style={{ color: track.color }}>
                  {track.name}
                </span>
                <button 
                  className={`mute-btn ${mutedTracks[track.id] ? 'muted' : ''}`}
                  onClick={() => toggleMute(track.id)}
                  style={{ color: track.color }}
                >
                  {mutedTracks[track.id] ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
              </div>
              
              <div className="sequencer-steps">
                {track.pattern.map((step, i) => (
                  <button
                    key={i}
                    className={`step ${step ? 'active' : ''} ${currentStep === i ? 'current' : ''}`}
                    style={{
                      backgroundColor: step ? track.color : 'transparent',
                      borderColor: track.color,
                      opacity: mutedTracks[track.id] ? 0.5 : 1
                    }}
                    onClick={() => toggleStep(track.id, i)}
                    disabled={isPlaying}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BeatStudio;
