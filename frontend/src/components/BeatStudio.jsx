import React, { useState, useRef, useEffect } from 'react';
import './BeatStudio.css';
import * as Tone from 'tone';
import { FaPlay, FaPause, FaStop, FaVolumeUp, FaVolumeMute, FaHeadphones, FaRobot, FaMusic, FaSync, FaFileImport } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Track configuration with initial patterns (16 steps)
const INITIAL_TRACKS = [
  { 
    id: 'kick', 
    name: 'Kick', 
    color: '#ff6b6b', 
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0] 
  },
  { 
    id: 'snare', 
    name: 'Snare', 
    color: '#4ecdc4', 
    pattern: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0] 
  },
  { 
    id: 'hihat', 
    name: 'Hi-Hat', 
    color: '#45b7d1', 
    pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] 
  },
  { 
    id: 'bass', 
    name: 'Bass', 
    color: '#96ceb4', 
    pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1] 
  },
];

const BeatStudio = () => {
  // ... existing state and refs ...
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(-1);
  const [mutedTracks, setMutedTracks] = useState({});
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [needsInteraction, setNeedsInteraction] = useState(true);
  const [lyrics, setLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [savedPatterns, setSavedPatterns] = useState(() => {
    // Load saved patterns from localStorage
    try {
      const saved = localStorage.getItem('beatPatterns');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load patterns:', e);
      return [];
    }
  });
  const [activePattern, setActivePattern] = useState('');
  
  // Refs
  const synths = useRef({
    kick: null,
    snare: null,
    hihat: null,
    bass: null,
    melody: null
  });

  // Initialize audio on first user interaction
  const initializeAudio = async () => {
    try {
      console.log('Initializing audio...');
      
      // Create a new audio context if needed
      if (!window.audioContext) {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Created new AudioContext');
      }
      
      // Set up Tone.js to use our audio context
      if (!Tone.context) {
        await Tone.setContext(window.audioContext);
        console.log('Set Tone.js context');
      }
      
      console.log('Initial Tone.context.state:', Tone.context.state);
      
      // First resume the audio context if it's suspended
      if (Tone.context.state === 'suspended') {
        console.log('Audio context is suspended, resuming...');
        await Tone.context.resume();
        console.log('After resume, Tone.context.state:', Tone.context.state);
      }
      
      // Start the Tone.js audio context
      console.log('Calling Tone.start()...');
      await Tone.start();
      console.log('After Tone.start(), Tone.context.state:', Tone.context.state);
      
      // Initialize synths with proper volume levels
      console.log('Initializing synths...');
      
      // Create a limiter to prevent clipping
      const limiter = new Tone.Limiter(-6).toDestination();
      
      // Initialize kick drum
      synths.current.kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 1.4 }
      }).connect(limiter);
      synths.current.kick.volume.value = -6;

      // Initialize snare
      synths.current.snare = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 }
      }).connect(limiter);
      synths.current.snare.volume.value = -12;
      
      // Initialize hi-hat
      synths.current.hihat = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).connect(limiter);
      synths.current.hihat.volume.value = -10;
      
      // Initialize bass
      synths.current.bass = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0.5, release: 0.5 }
      }).connect(limiter);
      synths.current.bass.volume.value = -8;
      
      console.log('All synths initialized');
      return true;

      // Set master volume to prevent clipping
      Tone.Destination.volume.value = -5;
      console.log('Synths initialized');
      
      setIsInitialized(true);
      setNeedsInteraction(false);
      
      // Play a test sound to verify audio is working
      console.log('Playing test sound...');
      try {
        synths.current.kick.triggerAttackRelease('C1', '8n');
        console.log('Test sound played successfully');
      } catch (testError) {
        console.error('Error playing test sound:', testError);
        // Don't fail initialization just because test sound failed
      }
      
      return true;
    } catch (err) {
      console.error('Audio initialization error:', err);
      setError('Failed to initialize audio. Please check browser permissions and ensure you\'re interacting with the page.');
      return false;
    }
  };

  // Play the beat pattern
  const playBeat = async () => {
    console.log('Starting playback...');
    
    try {
      // Initialize audio if needed
      if (needsInteraction || !isInitialized) {
        console.log('Audio not initialized, requesting user interaction...');
        setNeedsInteraction(true);
        setError('Please click the play button to start audio');
        return;
      }

      // Stop any existing sequences
      console.log('Stopping any existing transport...');
      Tone.Transport.cancel();
      Tone.Transport.stop();
      
      // Set tempo
      console.log('Setting BPM to:', bpm);
      Tone.Transport.bpm.value = bpm;
      
      // Ensure synths are properly connected
      if (!synths.current.kick || !synths.current.snare) {
        console.error('Synths not properly initialized');
        setError('Audio synths not initialized. Please try again.');
        return;
      }
      
      // Reset step counter
      setCurrentStep(-1);
      
      console.log('Creating sequencer loop...');
      
      // Track the current step with a ref to avoid closure issues
      const stepRef = { current: 0 };
      
      // Create a loop that runs every 16th note
      const loop = new Tone.Loop((time) => {
        try {
          // Update the step counter (0-15)
          const step = stepRef.current % 16;
          console.log('Step:', step);
          setCurrentStep(step);
          
          // Play sounds for active steps
          tracks.forEach(track => {
            if (mutedTracks[track.id]) return;
            
            if (track.pattern[step] === 1) {
              const synth = synths.current[track.id];
              if (synth) {
                console.log(`Playing ${track.id} at step ${step}`);
                
                try {
                  if (track.id === 'kick') {
                    synth.triggerAttackRelease('C1', '8n', time);
                  } else if (track.id === 'snare') {
                    // For NoiseSynth, use triggerAttackRelease without a note
                    synth.triggerAttackRelease('8n', time);
                  } else if (track.id === 'hihat') {
                    synth.triggerAttackRelease('C6', '16n', time);
                  } else if (track.id === 'bass') {
                    synth.triggerAttackRelease('C2', '8n', time);
                  }
                } catch (playError) {
                  console.error(`Error playing ${track.id}:`, playError);
                }
              }
            }
          });
          
          // Increment step for next iteration
          stepRef.current = (step + 1) % 16;
          
        } catch (loopErr) {
          console.error('Error in sequencer loop:', loopErr);
        }
      }, '16n');
      
      // Reset step counter when transport starts
      Tone.Transport.once('start', () => {
        stepRef.current = 0;
        setCurrentStep(-1);
      });
      
      // Start the loop and transport
      loop.start(0);
      Tone.Transport.start();
      setIsPlaying(true);
      console.log('Playback started');
    } catch (err) {
      console.error('Error in playBeat:', err);
      setError('Failed to start playback. Please try again.');
    }
  };
  
  const stopBeat = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
  };

  // Generate beat pattern using AI
  const generateBeatWithAI = async () => {
    if (!generationPrompt.trim()) {
      toast.error('Please enter a prompt for the AI');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      // Call your AI API endpoint
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/generate-music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: generationPrompt,
          bpm: bpm,
          style: 'hiphop', // Can be made configurable
          complexity: 'medium' // Can be made configurable
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate beat');
      }

      const data = await response.json();
      
      // Update tracks with AI-generated patterns
      if (data.patterns) {
        setTracks(prevTracks => 
          prevTracks.map(track => ({
            ...track,
            pattern: data.patterns[track.id] || track.pattern
          }))
        );
      }
      
      // Update BPM if provided by AI
      if (data.bpm) {
        setBpm(data.bpm);
      }
      
      toast.success('AI has generated a new beat pattern!');
      
    } catch (err) {
      console.error('Error generating beat:', err);
      setError('Failed to generate beat. Please try again.');
      toast.error('Failed to generate beat');
    } finally {
      setIsGenerating(false);
    }
  };

  // Import lyrics from LyricLab
  const importFromLyricLab = () => {
    // This would typically open a modal or navigate to LyricLab
    // For now, we'll use a prompt for testing
    const savedLyrics = localStorage.getItem('lyricLabLyrics');
    
    if (savedLyrics) {
      setLyrics(savedLyrics);
      toast.success('Lyrics imported from LyricLab!');
    } else {
      toast.info('No lyrics found in LyricLab. Create some lyrics there first!');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Tone.Transport.cancel();
      Object.values(synths.current).forEach(synth => {
        if (synth && synth.dispose) synth.dispose();
      });
    };
  }, []);

  // Toggle mute for a track
  const toggleMute = (trackId) => {
    setMutedTracks(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  };

  // Toggle a step in the sequencer with undo/redo support
  const toggleStep = (trackId, stepIndex) => {
    if (isPlaying) return; // Prevent toggling while playing
    
    setTracks(prevTracks => {
      const newTracks = prevTracks.map(track => {
        if (track.id === trackId) {
          const newPattern = [...track.pattern];
          newPattern[stepIndex] = newPattern[stepIndex] ? 0 : 1;
          return { ...track, pattern: newPattern };
        }
        return track;
      });
      
      // Clear active pattern since we're making manual changes
      if (activePattern) {
        setActivePattern('');
      }
      
      return newTracks;
    });
  };
  
  // Save current pattern
  const savePattern = (patternName) => {
    if (!patternName.trim()) return;
    
    const pattern = {
      id: Date.now().toString(),
      name: patternName,
      bpm,
      tracks: tracks.map(({ id, pattern }) => ({ id, pattern: [...pattern] })),
      date: new Date().toISOString()
    };
    
    setSavedPatterns(prev => {
      const updated = [...prev.filter(p => p.name !== patternName), pattern];
      localStorage.setItem('beatPatterns', JSON.stringify(updated));
      return updated;
    });
    
    toast.success(`Pattern "${patternName}" saved!`);
  };
  
  // Load a saved pattern
  const loadPattern = (patternId) => {
    const pattern = savedPatterns.find(p => p.id === patternId);
    if (!pattern) return;
    
    setBpm(pattern.bpm);
    setTracks(prevTracks => 
      prevTracks.map(track => {
        const savedTrack = pattern.tracks.find(t => t.id === track.id);
        return savedTrack ? { ...track, pattern: [...savedTrack.pattern] } : track;
      })
    );
    setActivePattern(patternId);
    toast.success(`Loaded pattern: ${pattern.name}`);
  };
  
  // Delete a saved pattern
  const deletePattern = (patternId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this pattern?')) {
      setSavedPatterns(prev => {
        const updated = prev.filter(p => p.id !== patternId);
        localStorage.setItem('beatPatterns', JSON.stringify(updated));
        return updated;
      });
      if (activePattern === patternId) {
        setActivePattern('');
      }
      toast.info('Pattern deleted');
    }
  };

  // Reset all tracks to initial patterns
  const resetPatterns = () => {
    if (isPlaying) return; // Prevent reset while playing
    setTracks(INITIAL_TRACKS);
  };

  // Handle user interaction to initialize audio
  const handleUserInteraction = async () => {
    if (needsInteraction) {
      const success = await initializeAudio();
      if (success) {
        setNeedsInteraction(false);
        
        // Play a welcome sound to confirm audio is working
        const welcomeSynth = new Tone.PolySynth(Tone.Synth).toDestination();
        welcomeSynth.volume.value = -10; // Lower volume for welcome sound
        
        // Play a pleasant arpeggio
        const now = Tone.now();
        welcomeSynth.triggerAttackRelease('C4', '8n', now);
        welcomeSynth.triggerAttackRelease('E4', '8n', now + 0.1);
        welcomeSynth.triggerAttackRelease('G4', '8n', now + 0.2);
        welcomeSynth.triggerAttackRelease('C5', '8n', now + 0.3);
        
        // Clean up
        setTimeout(() => {
          welcomeSynth.dispose();
        }, 2000);
      }
    }
  };

  return (
    <div className="beat-studio" onClick={handleUserInteraction}>
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      {needsInteraction ? (
        <div className="init-message">
          <FaHeadphones size={48} style={{ marginBottom: '1rem', opacity: 0.7 }} />
          <h3>Click anywhere to start the beat studio</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
            Audio requires user interaction due to browser policies
          </p>
        </div>
      ) : (
        <div className="beat-studio-content">
          <h2>Beat Studio</h2>
          
          {error && <div className="error">{error}</div>}
          
          <div className="controls">
            <div className="controls-row">
              <div className="bpm-control">
                <label>BPM: {bpm}</label>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  disabled={isPlaying}
                />
              </div>
            </div>
            
            <div className="pattern-controls">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const name = prompt('Enter pattern name:');
                  if (name) savePattern(name);
                }}
                disabled={isPlaying}
              >
                <FaMusic style={{ marginRight: '0.5rem' }} /> Save Pattern
              </button>
              
              {savedPatterns.length > 0 && (
                <div className="saved-patterns-dropdown">
                  <select 
                    value={activePattern} 
                    onChange={(e) => loadPattern(e.target.value)}
                    className="pattern-select"
                    disabled={isPlaying}
                  >
                    <option value="">Load Pattern...</option>
                    {savedPatterns.map(pattern => (
                      <option key={pattern.id} value={pattern.id}>
                        {pattern.name} ({pattern.bpm} BPM)
                      </option>
                    ))}
                  </select>
                  
                  <div className="saved-patterns-list">
                    {savedPatterns.map(pattern => (
                      <div 
                        key={pattern.id}
                        className={`saved-pattern ${activePattern === pattern.id ? 'active' : ''}`}
                        onClick={() => loadPattern(pattern.id)}
                      >
                        <span>{pattern.name}</span>
                        <span className="bpm-tag">{pattern.bpm} BPM</span>
                        <button 
                          className="delete-pattern"
                          onClick={(e) => deletePattern(pattern.id, e)}
                          title="Delete pattern"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button 
                className="btn btn-secondary"
                onClick={resetPatterns}
                disabled={isPlaying}
              >
                <FaSync style={{ marginRight: '0.5rem' }} /> Reset
              </button>
            </div>
          </div>
          
          <div className="ai-controls">
            <div className="ai-prompt-input">
              <input
                type="text"
                value={generationPrompt}
                onChange={(e) => setGenerationPrompt(e.target.value)}
                placeholder="Describe the beat you want to create..."
                disabled={isGenerating}
              />
              <div className="button-group">
                <button 
                  onClick={generateBeatWithAI} 
                  disabled={isGenerating || !generationPrompt.trim()}
                  className="ai-generate-btn"
                  title="Generate beat pattern with AI"
                >
                  {isGenerating ? (
                    <>
                      <FaSync className="spinning" /> Generating...
                    </>
                  ) : (
                    <>
                      <FaRobot /> Generate Beat
                    </>
                  )}
                </button>
                
                <button 
                  onClick={importFromLyricLab}
                  className="import-lyrics-btn"
                  title="Import lyrics from LyricLab"
                >
                  <FaFileImport /> Import Lyrics
                </button>
              </div>
            </div>
          </div>
          
          {needsInteraction && (
            <div className="interaction-prompt">
              <FaHeadphones className="headphones-icon" />
              <p>Click anywhere to enable audio</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
                Audio requires user interaction due to browser policies
              </p>
            </div>
          )}
          
          {error && <div className="error">{error}</div>}
          
          <div className="transport-controls">
            {!isPlaying ? (
              <>
                <button onClick={playBeat} className="play-btn">
                  <FaPlay /> Play
                </button>
                <button 
                  onClick={resetPatterns} 
                  className="reset-btn"
                  title="Reset patterns"
                >
                  Reset
                </button>
              </>
            ) : (
              <button onClick={stopBeat} className="stop-btn">
                <FaStop /> Stop
              </button>
            )}
          </div>
      
          {lyrics && (
            <div className="lyrics-section">
              <h3><FaMusic /> AI-Generated Lyrics</h3>
              <div className="lyrics-content">
                {lyrics}
              </div>
            </div>
          )}
          
          <div className="sequencer">
            {/* Header with step numbers */}
            <div className="track-name">
              <span>Track</span>
            </div>
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={`header-${i}`} className="step-number">
                {i + 1}
              </div>
            ))}
            
            {/* Tracks */}
            {tracks.map(track => (
              <div key={track.id} className="track">
                <div className="track-info">
                  <div className="track-name" style={{ color: track.color }}>
                    {track.name}
                  </div>
                  <button
                    className={`mute-btn ${mutedTracks[track.id] ? 'muted' : ''}`}
                    onClick={() => toggleMute(track.id)}
                    title={mutedTracks[track.id] ? 'Unmute' : 'Mute'}
                  >
                    {mutedTracks[track.id] ? <FaVolumeMute /> : <FaVolumeUp />}
                  </button>
                </div>
                
                <div className="steps">
                  {track.pattern.map((step, index) => {
                    const isActive = step === 1;
                    return (
                      <div
                        key={`${track.id}-${index}`}
                        className={`step ${isActive ? 'active' : ''} ${currentStep === index ? 'current' : ''}`}
                        style={{
                          backgroundColor: isActive ? track.color : 'transparent',
                          borderColor: track.color,
                          opacity: currentStep === index ? 1 : isActive ? 0.8 : 0.3
                        }}
                        onClick={() => toggleStep(track.id, index)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {!isInitialized && (
            <div className="init-message">
              Click Play to initialize audio
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BeatStudio;
