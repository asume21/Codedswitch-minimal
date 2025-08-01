import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import './BeatStudio.css';
import * as Tone from 'tone';
import { FaPlay, FaStop, FaVolumeUp, FaVolumeMute, FaRobot } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Initial track configuration
const INITIAL_TRACKS = [
    { id: 'kick', name: 'Kick', color: '#ff6b6b', pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0] },
    { id: 'snare', name: 'Snare', color: '#4ecdc4', pattern: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0] },
    { id: 'hihat', name: 'Hi-Hat', color: '#45b7d1', pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { id: 'bass', name: 'Bass', color: '#96ceb4', pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1] }
];

// Memoized Step component
const Step = memo(({ isActive, isCurrent, color, onClick, isDisabled }) => (
    <button
        className={`step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
        style={{ backgroundColor: isActive ? color : 'transparent', borderColor: color }}
        onClick={onClick}
        disabled={isDisabled}
    />
));

// Memoized Track component
const Track = memo(({ track, isPlaying, isGenerating, currentStep, mutedTracks, onToggleStep, onToggleMute }) => (
    <div className="track">
        <div className="track-header">
            <span className="track-name" style={{ color: track.color }}>{track.name}</span>
            <button
                className={`mute-btn ${mutedTracks[track.id] ? 'muted' : ''}`}
                onClick={() => onToggleMute(track.id)}
                style={{ color: track.color }}
                title={mutedTracks[track.id] ? 'Unmute' : 'Mute'}
                disabled={isPlaying || isGenerating}
            >
                {mutedTracks[track.id] ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
        </div>
        <div className="sequencer-steps" style={{ opacity: mutedTracks[track.id] ? 0.5 : 1 }}>
            {track.pattern.map((step, i) => (
                <Step
                    key={i}
                    isActive={step === 1}
                    isCurrent={currentStep === i}
                    color={track.color}
                    onClick={() => onToggleStep(track.id, i)}
                    isDisabled={isPlaying || isGenerating}
                />
            ))}
        </div>
    </div>
));

const BeatStudio = () => {
    // Core state
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpm] = useState(120);
    const [currentStep, setCurrentStep] = useState(-1);
    const [mutedTracks, setMutedTracks] = useState({});
    const [tracks, setTracks] = useState(JSON.parse(JSON.stringify(INITIAL_TRACKS)));
    const [audioContextStarted, setAudioContextStarted] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationPrompt, setGenerationPrompt] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [needsInteraction, setNeedsInteraction] = useState(true);

    // Refs
    const loopRef = useRef(null);
    const synths = useRef({
        kick: null,
        snare: null,
        hihat: null,
        bass: null
    });

    // Initialize audio
    const initializeAudio = useCallback(async () => {
        if (!audioContextStarted) {
            try {
                await Tone.start();
                setAudioContextStarted(true);
                toast.success('Audio context started!');
                
                // Initialize synths
                const limiter = new Tone.Limiter(-6).toDestination();
                
                synths.current.kick = new Tone.MembraneSynth({
                    pitchDecay: 0.05,
                    octaves: 4,
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 1.4 }
                }).connect(limiter);
                
                synths.current.snare = new Tone.NoiseSynth({
                    noise: { type: 'white' },
                    envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 }
                }).connect(limiter);
                
                synths.current.hihat = new Tone.MetalSynth({
                    frequency: 200,
                    harmonicity: 5.1,
                    modulationIndex: 32,
                    resonance: 4000,
                    octaves: 1.5,
                    envelope: { attack: 0.001, decay: 0.1, release: 0.01 }
                }).connect(limiter);
                
                synths.current.bass = new Tone.MonoSynth({
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.001, decay: 0.1, sustain: 0.5, release: 0.5 }
                }).connect(limiter);
                
                Tone.Destination.volume.value = -5;
                setNeedsInteraction(false);
                return true;
            } catch (err) {
                console.error('Audio init error:', err);
                toast.error('Failed to initialize audio');
                return false;
            }
        }
        return true;
    }, [audioContextStarted]);

    // Play/stop functions
    const playBeat = useCallback(async () => {
        if (needsInteraction) {
            const initialized = await initializeAudio();
            if (!initialized) return;
        }
        
        if (!isPlaying) {
            Tone.Transport.bpm.value = bpm;
            Tone.Transport.start();
            setIsPlaying(true);
        }
    }, [bpm, initializeAudio, isPlaying, needsInteraction]);

    const stopBeat = useCallback(() => {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        setIsPlaying(false);
        setCurrentStep(-1);
    }, []);

    // UI handlers
    const toggleStep = useCallback((trackId, stepIndex) => {
        setTracks(prevTracks =>
            prevTracks.map(track =>
                track.id === trackId
                    ? {
                          ...track,
                          pattern: track.pattern.map((step, i) =>
                              i === stepIndex ? (step === 1 ? 0 : 1) : step
                          )
                      }
                    : track
            )
        );
    }, []);

    const toggleMute = useCallback((trackId) => {
        setMutedTracks(prev => ({
            ...prev,
            [trackId]: !prev[trackId]
        }));
    }, []);

    const handleBpmChange = useCallback((e) => {
        const newBpm = Math.min(200, Math.max(40, parseInt(e.target.value) || 120));
        setBpm(newBpm);
        if (isPlaying) {
            Tone.Transport.bpm.value = newBpm;
        }
    }, [isPlaying]);

    // Generate beat with AI
    const generateBeatWithAI = useCallback(async () => {
        if (!generationPrompt.trim()) {
            toast.error('Please enter a prompt for the AI');
            return;
        }

        if (!audioContextStarted) {
            const initialized = await initializeAudio();
            if (!initialized) return;
        }

        setIsGenerating(true);
        
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000'}/api/ai/generate-beat`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: generationPrompt,
                        bpm,
                        style: 'electronic',
                        duration: 16
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.patterns) {
                setTracks(prevTracks => 
                    prevTracks.map(track => ({
                        ...track,
                        pattern: data.patterns[track.id]?.slice(0, 16) || track.pattern
                    }))
                );
            }

            if (data.lyrics) {
                setLyrics(data.lyrics);
            }

            toast.success('AI beat generated successfully!');
        } catch (error) {
            console.error('Error generating beat:', error);
            toast.error(`Failed to generate beat: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    }, [audioContextStarted, bpm, generationPrompt, initializeAudio]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Tone.Transport.stop();
            Tone.Transport.cancel();
            Object.values(synths.current).forEach(synth => synth?.dispose());
        };
    }, []);

    // Update Tone.js loop when tracks or muted state changes while playing
    useEffect(() => {
        if (!isPlaying) return;

        loopRef.current?.dispose();
        
        loopRef.current = new Tone.Loop((time) => {
            const step = Math.floor(Tone.Transport.getTicksAtTime(time) / (Tone.Transport.PPQ / 4)) % 16;
            
            // Schedule UI update
            Tone.Draw.schedule(() => {
                setCurrentStep(step);
            }, time);

            // Play sounds for active steps
            tracks.forEach(track => {
                if (!mutedTracks[track.id] && track.pattern[step]) {
                    const synth = synths.current[track.id];
                    if (!synth) return;
                    
                    try {
                        if (track.id === 'kick') {
                            synth.triggerAttackRelease('C1', '8n', time);
                        } else if (track.id === 'snare') {
                            synth.triggerAttackRelease('8n', time);
                        } else if (track.id === 'hihat') {
                            synth.triggerAttackRelease('C6', '16n', time);
                        } else if (track.id === 'bass') {
                            synth.triggerAttackRelease('C2', '8n', time);
                        }
                    } catch (e) {
                        console.error(`Error triggering ${track.id}:`, e);
                    }
                }
            });
        }, '16n').start(0);

        return () => loopRef.current?.dispose();
    }, [isPlaying, tracks, mutedTracks]);

    return (
        <div className="beat-studio">
            <ToastContainer position="bottom-right" autoClose={3000} />
            <h2>Beat Studio</h2>
            
            <div className="controls">
                {!audioContextStarted ? (
                    <div className="audio-activation">
                        <button 
                            className="activate-audio-btn"
                            onClick={initializeAudio}
                        >
                            🔈 Activate Audio
                        </button>
                        <p className="audio-note">Click to enable audio before playing</p>
                    </div>
                ) : (
                    <div className="transport-controls">
                        {!isPlaying ? (
                            <button 
                                className="play-btn" 
                                onClick={playBeat} 
                                disabled={isGenerating}
                            >
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
                                disabled={isPlaying || isGenerating}
                            />
                        </div>
                        
                        <div className="ai-controls">
                            <input
                                type="text"
                                value={generationPrompt}
                                onChange={(e) => setGenerationPrompt(e.target.value)}
                                placeholder="Describe your beat..."
                                disabled={isGenerating || isPlaying}
                            />
                            <button 
                                className="generate-btn"
                                onClick={generateBeatWithAI}
                                disabled={isGenerating || isPlaying || !audioContextStarted}
                            >
                                <FaRobot /> {isGenerating ? 'Generating...' : 'Generate Beat'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="sequencer">
                {tracks.map(track => (
                    <div key={track.id} className="track">
                        <div className="track-header">
                            <span className="track-name" style={{ color: track.color }}>{track.name}</span>
                            <button
                                className={`mute-btn ${mutedTracks[track.id] ? 'muted' : ''}`}
                                onClick={() => toggleMute(track.id)}
                                style={{ color: track.color }}
                                title={mutedTracks[track.id] ? 'Unmute' : 'Mute'}
                                disabled={isPlaying || isGenerating}
                            >
                                {mutedTracks[track.id] ? <FaVolumeMute /> : <FaVolumeUp />}
                            </button>
                        </div>
                        <div className="sequencer-steps" style={{ opacity: mutedTracks[track.id] ? 0.5 : 1 }}>
                            {track.pattern.map((step, i) => (
                                <button
                                    key={i}
                                    className={`step ${step ? 'active' : ''} ${currentStep === i ? 'current' : ''}`}
                                    style={{ 
                                        backgroundColor: step ? track.color : 'transparent',
                                        borderColor: track.color
                                    }}
                                    onClick={() => toggleStep(track.id, i)}
                                    disabled={isPlaying || isGenerating}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            
            {lyrics && (
                <div className="lyrics-container">
                    <h3>Lyrics</h3>
                    <div className="lyrics-content">{lyrics}</div>
                </div>
            )}
        </div>
    );
};

export default BeatStudio;
