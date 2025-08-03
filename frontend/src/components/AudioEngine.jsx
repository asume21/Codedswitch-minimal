import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

const AudioEngine = ({ children, onAudioReady, onError }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const engineRef = useRef(null);

  const initializeAudio = async () => {
    if (isInitialized) return;
    
    setIsLoading(true);
    
    try {
      // Start Tone.js audio context
      await Tone.start();
      
      // Create master volume control
      const masterVol = new Tone.Volume(-10).toDestination();
      
      // Create audio engine instance
      const engine = {
        masterVolume: masterVol,
        synths: {},
        effects: {},
        isReady: true,
        
        // Create a synth with specified type
        createSynth: (type = 'basic', options = {}) => {
          let synth;
          
          switch (type) {
            case 'piano':
              synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
                ...options
              });
              break;
              
            case 'bass':
              synth = new Tone.MonoSynth({
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.2 },
                filter: { Q: 2, frequency: 400 },
                ...options
              });
              break;
              
            case 'lead':
              synth = new Tone.Synth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 },
                ...options
              });
              break;
              
            case 'pad':
              synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 1, decay: 0.5, sustain: 1, release: 2 },
                ...options
              });
              break;
              
            default:
              synth = new Tone.Synth(options);
          }
          
          return synth.connect(masterVol);
        },
        
        // Create drum kit
        createDrumKit: () => {
          return {
            kick: new Tone.MembraneSynth({
              pitchDecay: 0.05,
              octaves: 4,
              oscillator: { type: 'sine' },
              envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 1.4 }
            }).connect(masterVol),
            
            snare: new Tone.NoiseSynth({
              noise: { type: 'white' },
              envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 }
            }).connect(masterVol),
            
            hihat: new Tone.MetalSynth({
              frequency: 200,
              envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
              harmonicity: 5.1,
              modulationIndex: 32,
              resonance: 4000,
              octaves: 1.5
            }).connect(masterVol)
          };
        },
        
        // Create effects
        createEffect: (type, options = {}) => {
          let effect;
          
          switch (type) {
            case 'reverb':
              effect = new Tone.Reverb({ roomSize: 0.8, dampening: 3000, ...options });
              break;
            case 'delay':
              effect = new Tone.PingPongDelay({ delayTime: '8n', feedback: 0.3, ...options });
              break;
            case 'chorus':
              effect = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, ...options });
              break;
            case 'distortion':
              effect = new Tone.Distortion({ distortion: 0.8, ...options });
              break;
            case 'filter':
              effect = new Tone.Filter({ frequency: 1000, type: 'lowpass', ...options });
              break;
            default:
              effect = new Tone.Gain(1);
          }
          
          return effect;
        },
        
        // Set master volume
        setVolume: (volume) => {
          const dbValue = Tone.gainToDb(volume);
          masterVol.volume.rampTo(dbValue, 0.1);
        },
        
        // Dispose of all audio resources
        dispose: () => {
          Object.values(engine.synths).forEach(synth => {
            if (synth && synth.dispose) synth.dispose();
          });
          Object.values(engine.effects).forEach(effect => {
            if (effect && effect.dispose) effect.dispose();
          });
          if (masterVol && masterVol.dispose) masterVol.dispose();
        }
      };
      
      engineRef.current = engine;
      setAudioContext(Tone.context);
      setIsInitialized(true);
      onAudioReady?.(engine);
      
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolumeChange = (volume) => {
    setMasterVolume(volume);
    if (engineRef.current) {
      engineRef.current.setVolume(volume);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  if (!isInitialized) {
    return (
      <div className="audio-engine-init">
        <div className="init-content">
          <h3>🎵 Audio Engine</h3>
          <p>Click to initialize high-quality audio processing</p>
          <button 
            onClick={initializeAudio}
            disabled={isLoading}
            className="init-button"
          >
            {isLoading ? '🔄 Initializing...' : '🎵 Start Audio Engine'}
          </button>
        </div>
        
        <style jsx>{`
          .audio-engine-init {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            background: rgba(0, 0, 0, 0.2);
            border: 2px dashed rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            margin: 1rem 0;
          }
          
          .init-content {
            text-align: center;
            color: white;
          }
          
          .init-content h3 {
            margin-bottom: 0.5rem;
            color: #4ecdc4;
          }
          
          .init-content p {
            margin-bottom: 1rem;
            color: #ccc;
          }
          
          .init-button {
            background: linear-gradient(45deg, #4ecdc4, #45b7d1);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .init-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
          }
          
          .init-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="audio-engine">
      <div className="audio-controls">
        <div className="volume-control">
          <label>🔊 Master Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          />
          <span>{Math.round(masterVolume * 100)}%</span>
        </div>
        
        <div className="audio-status">
          <span className="status-indicator">🟢</span>
          <span>Audio Engine Ready</span>
        </div>
      </div>
      
      {children}
      
      <style jsx>{`
        .audio-engine {
          position: relative;
        }
        
        .audio-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .volume-control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
        }
        
        .volume-control label {
          font-size: 0.9rem;
          color: #ccc;
        }
        
        .volume-control input {
          width: 100px;
          accent-color: #4ecdc4;
        }
        
        .volume-control span {
          font-size: 0.8rem;
          color: #4ecdc4;
          min-width: 35px;
        }
        
        .audio-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #4ecdc4;
          font-size: 0.9rem;
        }
        
        .status-indicator {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AudioEngine;