import React, { useState, useEffect, useRef } from 'react'
import './MusicStudio.css'
import * as Tone from 'tone'
import { FaPlay, FaPause, FaStop, FaTrash, FaPlus, FaInfo, FaVolumeUp, FaVolumeMute } from 'react-icons/fa'

// Backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://newnewwebsite.onrender.com'

// Configuration for direct file access vs API
const DIRECT_FILE_ACCESS = true // Set to false to use API endpoints instead

// Generate a new empty track object with track type
const createTrack = (type = 'drums', name = '') => ({
  id: Date.now() + Math.random(),
  clips: [],
  type: type, // 'drums', 'melody', 'bass', 'chord', 'fx'
  name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Track`,
  mute: false,
  solo: false,
  volume: 0, // in dB
  pan: 0,
  notes: [] // For melody/chord tracks
})

const COLORS = {
  drums: '#667eea',
  melody: '#ff6b6b',
  bass: '#10b981',
  chord: '#facc15',
  fx: '#ec4899',
  loop: '#d946ef'
}

// Default drum kit sounds
const SAMPLE_URLS = {
  kick: '/samples/kick.mp3',
  snare: '/samples/snare.mp3',
  hat: '/samples/hihat.mp3',
  clap: '/samples/clap.mp3',
  tom: '/samples/tom.mp3'
}

// Musical scales for melody generation
const SCALES = {
  'major': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  'minor': ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
  'pentatonic': ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
  'blues': ['C4', 'Eb4', 'F4', 'Gb4', 'G4', 'Bb4', 'C5'],
  'chromatic': ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']
}

// Common chord progressions
const CHORD_PROGRESSIONS = {
  'pop': ['C', 'G', 'Am', 'F'],
  'jazz': ['Cmaj7', 'Dm7', 'G7', 'Cmaj7'],
  'blues': ['C7', 'F7', 'C7', 'G7', 'F7', 'C7'],
  'rock': ['C', 'G', 'F', 'G']
}

// For melodic instruments we'll use different synth configurations
const INSTRUMENT_LIST = [
  'Piano',
  'Guitar',
  'Bass',
  'Flute',
  'Violin',
  'Saxophone',
  'Trumpet',
  'Synth',
  'Drum Kit',
  'Strings',
  'Orchestra',
  'Electric Guitar',
  'Ambient',
  'Pluck'
];

const MusicStudio = () => {
  // Initial tracks: drums, melody, bass
  const [tracks, setTracks] = useState([
    createTrack('drums', 'Drum Track'),
    createTrack('melody', 'Melody Track'),
    createTrack('bass', 'Bass Track')
  ])
  const [loopClips, setLoopClips] = useState([]) // {id, bpm, filename, start, length}
  const [dragging, setDragging] = useState(null) // {trackIdx, clipIdx, offsetX}
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [currentScale, setCurrentScale] = useState('pentatonic')
  const [currentKey, setCurrentKey] = useState('C')
  const [bpm, setBpm] = useState(120)
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0)
  const [selectedClip, setSelectedClip] = useState(null)
  const [instrument, setInstrument] = useState('Piano')
  const [prompt, setPrompt] = useState('')
  const [lyrics, setLyrics] = useState(localStorage.getItem('generatedLyrics') || '')
  const [generating, setGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [availableLoops, setAvailableLoops] = useState([])
  const [showLoopInfo, setShowLoopInfo] = useState(false)
  const [selectedLoopInfo, setSelectedLoopInfo] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingLoops, setLoadingLoops] = useState(false)
  const [previewingLoop, setPreviewingLoop] = useState(false)
  const [loopPreviewPlayer, setLoopPreviewPlayer] = useState(null)
  const timelineWidth = 1200 // px
  const PIXELS_PER_SECOND = 20 // 20px = 1s
  const synthsRef = useRef([])
  const playersRef = useRef({})
  const loopPlayersRef = useRef({})
  const patternRef = useRef(null)
  const sequencersRef = useRef([])
  const transportTimeRef = useRef(0) // Store current playback position
  
  // Hardcoded fallback loop list in case the API fails
  const FALLBACK_LOOPS = [
    { id: 'drum_loop_1', name: 'Drum Loop 1', type: 'drums', bpm: 120, length: 4, filename: '/samples/drum_loop_1.mp3' },
    { id: 'drum_loop_2', name: 'Drum Loop 2', type: 'drums', bpm: 110, length: 2, filename: '/samples/drum_loop_2.mp3' },
    { id: 'bass_loop_1', name: 'Bass Loop 1', type: 'bass', bpm: 120, length: 4, filename: '/samples/bass_loop_1.mp3' },
    { id: 'melody_loop_1', name: 'Melody Loop 1', type: 'melody', bpm: 120, length: 8, filename: '/samples/melody_loop_1.mp3' },
    { id: 'chord_loop_1', name: 'Chord Loop 1', type: 'chord', bpm: 120, length: 4, filename: '/samples/chord_loop_1.mp3' },
  ]
  
  // Fetch available loops from API or use fallbacks
  useEffect(() => {
    const fetchLoops = async () => {
      setLoadingLoops(true);
      setErrorMessage('');
      try {
        const response = await fetchWithRetry(`${BACKEND_URL}/api/loops`, {
          headers: {
            'X-API-Key': localStorage.getItem('apiKey') || ''
          }
        }, 2);
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setAvailableLoops(data);
          } else {
            console.log('API returned empty loops array, using fallbacks');
            setAvailableLoops(FALLBACK_LOOPS);
          }
        } else {
          console.log('Failed to fetch loops, using fallbacks');
          setAvailableLoops(FALLBACK_LOOPS);
        }
      } catch (error) {
        console.error('Error fetching loops:', error);
        setAvailableLoops(FALLBACK_LOOPS);
      } finally {
        setLoadingLoops(false);
      }
    };
    
    fetchLoops();
  }, []);
  
  // Stop any playing loop preview
  const stopLoopPreview = () => {
    if (previewAudio) {
      previewAudio.stop();
      previewAudio.dispose();
      setPreviewAudio(null);
    }
  };
  
  // Add a loop to a track
  const addLoopToTrack = (loop, trackIdx) => {
    if (!loop || trackIdx === undefined) return;
    
    const trackType = tracks[trackIdx].type;
    
    // Only add loops to matching track types
    if (loop.category && loop.category !== trackType) {
      setErrorMessage(`This loop is for ${loop.category} tracks. Can't add to ${trackType} track.`);
      return;
    }
    
    // Calculate clip length based on loop length (or default to 4 seconds)
    const clipLengthSecs = loop.length || 4;
    const clipLengthPx = clipLengthSecs * PIXELS_PER_SECOND;
    
    const newClip = {
      id: Date.now() + Math.random(),
      start: 0, // Default start position
      length: clipLengthPx,
      color: COLORS[trackType] || COLORS.loop,
      loop: loop,
      trackType: trackType
    };
    
    setTracks(prev => {
      const copy = prev.map(t => ({ ...t, clips: [...t.clips] }));
      copy[trackIdx].clips.push(newClip);
      return copy;
    });
    
    setSelectedClip(newClip);
    setShowLoopInfo(true);
  }

  const addTrack = (trackType = 'melody') => {
    setTracks(prev => [...prev, createTrack(trackType)])
  }

  const addClip = (trackIdx, x) => {
    const track = tracks[trackIdx];
    const trackType = track.type;
    let clipLength = trackType === 'melody' || trackType === 'bass' ? 200 : 140;
    
    // Generate melodic pattern for melody or bass clips
    let pattern = [];
    if (trackType === 'melody' || trackType === 'bass') {
      // Generate a simple melodic pattern based on the current scale
      const scale = SCALES[currentScale];
      const clipLengthInBeats = 4; // A standard 4-beat clip
      const notesPerBeat = trackType === 'melody' ? 2 : 1; // Melody gets 8th notes, bass gets quarter notes
      
      for (let i = 0; i < clipLengthInBeats * notesPerBeat; i++) {
        // For melody: use random notes from the scale
        // For bass: use more root notes (first note of scale)
        const noteIndex = trackType === 'melody' ? 
          Math.floor(Math.random() * scale.length) : 
          (i % 4 === 0 ? 0 : Math.floor(Math.random() * 3)); // Bass: root note on beat 1, variations elsewhere
        
        pattern.push({
          note: scale[noteIndex],
          time: i * (1/notesPerBeat), // Convert to beat timing (0, 0.5, 1, 1.5, etc.)
          duration: trackType === 'melody' ? '8n' : '4n'
        });
      }
    }
    
    const newClip = {
      id: Date.now() + Math.random(),
      start: x,
      length: clipLength,
      color: COLORS[trackType] || COLORS.melody,
      pattern: pattern,
      trackType: trackType
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
    
    // If this is a melodic clip with a pattern, schedule each note
    if (clip.pattern && clip.pattern.length > 0) {
      // Convert our clip start position to beats based on BPM
      const startInBeats = (clip.start / PIXELS_PER_SECOND) * (bpm / 60);
      
      // Schedule each note in the pattern
      clip.pattern.forEach(note => {
        const noteTime = ((startInBeats + note.time) / (bpm / 60)); // Convert from beats to seconds
        Tone.Transport.schedule((time) => {
          synth.triggerAttackRelease(note.note, note.duration, time);
        }, noteTime);
      });
    } else {
      // Fallback for clips without patterns - just play a single note
      Tone.Transport.schedule((time) => {
        synth.triggerAttackRelease('C4', durationSec, time);
      }, offsetSec);
    }
  }
  
  // Create a melodic sequence for a track
  const createMelodicSequence = (trackType, patternLength = 8) => {
    const scale = SCALES[currentScale];
    const pattern = [];
    const notesPerBeat = trackType === 'melody' ? 2 : 1; // Melody: 8th notes, Bass: quarter notes
    
    for (let i = 0; i < patternLength * notesPerBeat; i++) {
      // Skip some notes to create rhythmic variation (more likely for melody)
      if (trackType === 'melody' && Math.random() < 0.3) {
        continue; // Skip this note
      }
      
      // Different note selection strategy based on track type
      let noteIndex;
      if (trackType === 'bass') {
        // Bass tends to follow root notes with occasional variation
        noteIndex = (i % 4 === 0) ? 0 : Math.floor(Math.random() * 3);
      } else if (trackType === 'melody') {
        // Melody uses full scale range
        noteIndex = Math.floor(Math.random() * scale.length);
      } else {
        // Default for other types
        noteIndex = Math.floor(Math.random() * scale.length);
      }
      
      pattern.push({
        note: scale[noteIndex],
        time: i * (1/notesPerBeat),
        duration: trackType === 'melody' ? '8n' : '4n'
      });
    }
    
    return pattern;
  }

  // Load available loops from server or local storage
  useEffect(() => {
    const fetchAvailableLoops = async () => {
      setIsLoading(true);
      try {
        // Fetch all available loops
        const response = await fetch(`${BACKEND_URL}/api/loops`);
        if (!response.ok) {
          throw new Error('Failed to fetch loops');
        }
        const data = await response.json();
        setAvailableLoops(data.loops || []);
      } catch (error) {
        console.error('Error loading loops:', error);
        // Fallback to local sample list
        setAvailableLoops([
          { id: 'kick', filename: 'kick.mp3', title: 'Kick Drum', category: 'drums' },
          { id: 'snare', filename: 'snare.mp3', title: 'Snare Drum', category: 'drums' },
          { id: 'hihat', filename: 'hihat.mp3', title: 'Hi-Hat', category: 'drums' },
          { id: 'clap', filename: 'clap.mp3', title: 'Clap', category: 'drums' },
          { id: 'tom', filename: 'tom.mp3', title: 'Tom', category: 'drums' },
          { id: 'bass_loop1', filename: 'bass_loop1.mp3', title: 'Bass Loop 1', category: 'bass' },
          { id: 'bass_loop2', filename: 'bass_loop2.mp3', title: 'Bass Loop 2', category: 'bass' },
          { id: 'melody_loop1', filename: 'melody_loop1.mp3', title: 'Melody Loop 1', category: 'melody' },
          { id: 'melody_loop2', filename: 'melody_loop2.mp3', title: 'Melody Loop 2', category: 'melody' },
          { id: 'chord_loop1', filename: 'chord_loop1.mp3', title: 'Chord Loop 1', category: 'chord' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableLoops();
  }, []);

  // Preview loop audio
  const previewLoop = async (filename) => {
    try {
      // Stop any currently playing preview
      if (previewAudio) {
        previewAudio.stop();
      }
      
      // Create a new player for preview
      const player = new Tone.Player().toDestination();
      
      // Different loading strategy based on configuration
      if (DIRECT_FILE_ACCESS) {
        await player.load(`/samples/${filename}`);
      } else {
        const response = await fetch(`${BACKEND_URL}/api/loops/${filename}`);
        if (!response.ok) throw new Error('Could not load audio file');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        await player.load(url);
      }
      
      // Play the preview
      player.start();
      setPreviewAudio(player);
      
      // Clean up when done
      player.onstop = () => {
        setPreviewAudio(null);
      };
    } catch (error) {
      console.error('Error previewing loop:', error);
      setErrorMessage('Failed to preview loop');
    }
  };

  // Delete a clip from a track
  const deleteClip = (trackIdx, clipId) => {
    setTracks(prev => {
      const newTracks = [...prev];
      const track = {...newTracks[trackIdx]};
      track.clips = track.clips.filter(clip => clip.id !== clipId);
      newTracks[trackIdx] = track;
      return newTracks;
    });
    
    // Clear selection if needed
    if (selectedClip && selectedClip.id === clipId) {
      setSelectedClip(null);
      setShowLoopInfo(false);
  };
  
  // Initialize synths for playback
  const initializeSynths = () => {
    // Clean up previous synths
    synthsRef.current.forEach(s => s.dispose());
    synthsRef.current = [];
    sequencersRef.current.forEach(seq => seq.dispose());
    sequencersRef.current = [];
    
    const synthTypes = {
      drums: {
        kick: new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 10,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
          volume: -2
        }).toDestination(),
        snare: new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.0 },
          volume: -4
        }).toDestination(), 
        hat: new Tone.MetalSynth({
          frequency: 200,
          envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1.5,
          volume: -10
        }).toDestination(),
        clap: new Tone.NoiseSynth({
          noise: { type: 'pink' },
          envelope: { attack: 0.001, decay: 0.3, sustain: 0.0 },
          volume: -6
        }).toDestination(),
        tom: new Tone.MembraneSynth({
          pitchDecay: 0.2,
          octaves: 4,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.6, sustain: 0.01, release: 1.0 },
          volume: -5
        }).toDestination()
      },
      melody: new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
        volume: -6
      }).toDestination(),
      bass: new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 1.5 },
        volume: -4
      }).toDestination(),
      chord: new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
        volume: -8
      }).toDestination(),
      fx: new Tone.FMSynth({
        modulationIndex: 10,
        harmonicity: 3.4,
        volume: -10
      }).toDestination(),
      flute: new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.9 },
        volume: -8
      }).toDestination(),
      strings: new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 5,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 1.5 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.5, decay: 0.1, sustain: 0.2, release: 0.5 },
        volume: -12
      }).toDestination()
    };
    
    // Add synths to refs for tracking/cleanup
    Object.values(synthTypes.drums).forEach(drum => {
      synthsRef.current.push(drum);
    });
    
    Object.entries(synthTypes).forEach(([key, synth]) => {
      if (key !== 'drums') {
        synthsRef.current.push(synth);
      }
    });
    
    return synthTypes;
  };

  const removeClipFromTrack = (trackId, clipId) => {
    // Find track by ID
    const trackIndex = tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) return;
    
    // Filter out the clip with the given ID
    const updatedTracks = [...tracks];
    updatedTracks[trackIndex] = {
      ...updatedTracks[trackIndex],
      clips: updatedTracks[trackIndex].clips.filter(clip => clip.id !== clipId)
    };
    
    setTracks(updatedTracks);
    
    // Clear selection if this was the selected clip
    if (selectedClip && selectedClip.id === clipId) {
      setSelectedClip(null);
      setShowLoopInfo(false);
    }
  };

  // Handle play button with pause/resume support
  const play = async () => {
    // If already playing and not paused, pause playback
    if (playing && !paused) {
      // Store current position for resuming later
      transportTimeRef.current = Tone.Transport.seconds;
      Tone.Transport.pause();
      setPaused(true);
      console.log('Playback paused at', transportTimeRef.current);
      return;
    }
    
    // If paused, resume from saved position
    if (paused) {
      Tone.Transport.start();
      setPaused(false);
      setPlaying(true);
      console.log('Resuming playback from', transportTimeRef.current);
      return;
    }
    
    try {
      // Start audio context if needed
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      // Clear previous scheduling
      Tone.Transport.stop();
      Tone.Transport.cancel();
      
      // Dispose of previous synths and sequencers
      synthsRef.current.forEach(s => {
        if (s && s.dispose) s.dispose();
      });
      synthsRef.current = [];
      
      sequencersRef.current.forEach(seq => {
        if (seq && seq.dispose) seq.dispose();
      });
      sequencersRef.current = [];
      
      // Reset transport position
      Tone.Transport.seconds = 0;
      transportTimeRef.current = 0;
      
      // Set BPM
      Tone.Transport.bpm.value = bpm;
      
      // Initialize synths
      playersRef.current = initializeSynths();
      
      // Load and schedule loop clips
      for (const clip of loopClips) {
        if (!loopPlayersRef.current[clip.id]) {
          const player = new Tone.Player(`/samples/${clip.filename}`).toDestination();
          
          try {
            await player.load();
            player.loop = true;
            player.loopStart = 0;
            player.loopEnd = clip.length / PIXELS_PER_SECOND;
            loopPlayersRef.current[clip.id] = player;
          } catch (err) {
            console.error('Failed to load sample:', clip.filename, err);
            continue;
          }
        }
        
        // Schedule loop playback
        const offsetSec = clip.start / PIXELS_PER_SECOND;
        Tone.Transport.schedule((time) => {
          loopPlayersRef.current[clip.id].start(time);
        }, offsetSec);
      }
      
      // Play all tracks
      tracks.forEach((track, idx) => {
        // Skip muted tracks
        if (track.mute) return;
        
        const trackType = track.type;
        
        if (trackType === 'drums') {
          // Drum tracks - handle drum synths
          const drums = playersRef.current.drums;
          
          track.clips.forEach(clip => {
            if (clip.loop) {
              // Handle drum loop clips
              scheduleClipSynth(null, clip);
            } else {
              // Handle drum pattern clips
              const offsetSec = clip.start / PIXELS_PER_SECOND;
              const durationSec = clip.length / PIXELS_PER_SECOND;
              
              // Simple drum pattern if no specific one provided
              const pattern = clip.pattern || [
                { time: 0, drum: 'kick' },
                { time: 0.5, drum: 'hat' },
                { time: 1, drum: 'snare' },
                { time: 1.5, drum: 'hat' },
                { time: 2, drum: 'kick' },
                { time: 2.5, drum: 'hat' },
                { time: 3, drum: 'snare' },
                { time: 3.5, drum: 'hat' }
              ];
              
              // Create a sequence for the drum pattern
              const seq = new Tone.Sequence((time, event) => {
                if (!event || !event.drum) return;
                
                const drum = event.drum;
                if (drums[drum]) {
                  drums[drum].triggerAttackRelease('C2', '8n', time);
                }
              }, pattern, '8n');
              
              // Schedule the sequence
              Tone.Transport.schedule(time => {
                seq.start(time);
              }, offsetSec);
              
              Tone.Transport.schedule(time => {
                seq.stop(time);
              }, offsetSec + durationSec);
              
              sequencersRef.current.push(seq);
            }
          });
        } else if (trackType === 'melody' || trackType === 'bass') {
          // Melodic tracks
          const synth = trackType === 'melody' ? 
            playersRef.current.melody : 
            playersRef.current.bass;
          
          track.clips.forEach(clip => {
            if (clip.pattern && clip.pattern.length > 0) {
              // Use the clip's pattern
              scheduleClipSynth(synth, clip);
            } else {
              // Generate a new melodic pattern if the clip doesn't have one
              const newPattern = createMelodicSequence(trackType);
              const clipWithPattern = { ...clip, pattern: newPattern };
              scheduleClipSynth(synth, clipWithPattern);
              
              // Update the clip in state with the new pattern
              const updatedTracks = [...tracks];
              const clipIndex = updatedTracks[idx].clips.findIndex(c => c.id === clip.id);
              if (clipIndex !== -1) {
                updatedTracks[idx].clips[clipIndex].pattern = newPattern;
                setTracks(updatedTracks);
              }
            }
          });
        } else if (trackType === 'chord') {
          // Chord track
          const chordSynth = playersRef.current.chord;
          
          track.clips.forEach(clip => {
            if (clip.loop) {
              scheduleClipSynth(null, clip);
            } else if (clip.pattern && clip.pattern.length > 0) {
              scheduleClipSynth(chordSynth, clip);
            } else {
              // Play default chord progression if no pattern
              const offsetSec = clip.start / PIXELS_PER_SECOND;
              const durationSec = clip.length / PIXELS_PER_SECOND;
              
              Tone.Transport.schedule((time) => {
                // Play a C major chord as default
                chordSynth.triggerAttackRelease(['C3', 'E3', 'G3'], '2n', time);
                
                // After 1 second play F major
                chordSynth.triggerAttackRelease(['F3', 'A3', 'C4'], '2n', time + 1);
                
                // After 2 seconds play G major
                chordSynth.triggerAttackRelease(['G3', 'B3', 'D4'], '2n', time + 2);
                
                // After 3 seconds play C major again
                chordSynth.triggerAttackRelease(['C3', 'E3', 'G3'], '2n', time + 3);
              }, offsetSec);
            }
          });
        } else if (trackType === 'flute') {
          // Flute track - higher register, more continuous playing
          const fluteSynth = playersRef.current.flute;
          track.clips.forEach(clip => scheduleClipSynth(fluteSynth, clip));
        } else if (trackType === 'strings') {
          // Strings track - smooth, sustained sound
          const stringsSynth = playersRef.current.strings;
          track.clips.forEach(clip => scheduleClipSynth(stringsSynth, clip));
        } else {
          // Any other track types use basic synth
          const fallbackSynth = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.8 }
          }).toDestination();
          
          synthsRef.current.push(fallbackSynth);
          track.clips.forEach(clip => scheduleClipSynth(fallbackSynth, clip));
        }
      });
      
      // Start playback
      Tone.Transport.start();
      setPlaying(true);
      setPaused(false);
      console.log('Playback started with BPM:', bpm);
    } catch (error) {
      console.error('Audio playback error:', error);
      setErrorMessage('Audio playback failed. Please try again.');
    }
  };

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

  // Improved fetch with retry logic for API calls
  const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
    let retries = 0;
    let lastError;

    while (retries < maxRetries) {
      try {
        // Create abort controller with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Return response directly, handle status codes in calling function
        return response;
      } catch (error) {
        lastError = error;
        retries++;
        console.log(`Attempt ${retries} failed. Retrying...`);
        
        // Exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
      }
    }
    
    throw lastError;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMessage('');
    
    try {
      const fullPrompt = lyrics
        ? `${instrument} instrumental with melody inspired by lyrics: ${lyrics}`
        : `${instrument} instrumental: ${prompt}`;
      
      // Enqueue generation job with improved error handling
      const response = await fetchWithRetry(`${BACKEND_URL}/api/generate-music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': localStorage.getItem('apiKey') || ''
        },
        body: JSON.stringify({
          instrument,
          prompt,
          lyrics
        })
      });
      
      if (!response.ok && response.status !== 202) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to enqueue music generation (Status: ${response.status})`);
      }
      
      let jobId;
      try {
        const data = await response.json();
        jobId = data.jobId;
      } catch (parseError) {
        throw new Error('Invalid response from server');
      }
      
      if (!jobId) {
        throw new Error('No job ID returned from server');
      }
      
      // Poll for generated file with improved handling
      let musicBlob;
      let attempts = 0;
      const maxAttempts = 30; // 30 × 2sec = 60sec max wait
      
      while (attempts < maxAttempts) {
        attempts++;
        
        try {
          // Try both endpoint formats to handle potential API differences
          const pollRes = await fetchWithRetry(`${BACKEND_URL}/api/music-file/${jobId}`, {
            headers: {
              'X-API-Key': localStorage.getItem('apiKey') || ''
            }
          });
          
          // Accepted means still processing
          if (pollRes.status === 202) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          
          if (pollRes.ok) {
            musicBlob = await pollRes.blob();
            break;
          } else {
            // Try alternate endpoint format if the first fails
            const altPollRes = await fetchWithRetry(`${BACKEND_URL}/api/music-file?jobId=${jobId}`, {
              headers: {
                'X-API-Key': localStorage.getItem('apiKey') || ''
              }
            });
            
            if (altPollRes.status === 202) {
              await new Promise(r => setTimeout(r, 2000));
              continue;
            }
            
            if (altPollRes.ok) {
              musicBlob = await altPollRes.blob();
              break;
            } else {
              console.warn(`Music generation poll failed: ${altPollRes.status}`);
              await new Promise(r => setTimeout(r, 2000));
            }
          }
        } catch (pollError) {
          console.warn('Error polling for music file:', pollError);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      
      if (!musicBlob) {
        throw new Error('Failed to generate music file after multiple attempts');
      }
      
      const url = URL.createObjectURL(musicBlob);
      setAudioUrl(url);
      
      // Auto-play the generated music
      const audio = new Audio(url);
      audio.play().catch(err => console.error('Audio playback error:', err));
      
    } catch (error) {
      console.error('Music generation error:', error);
      // Prevent showing network errors directly to users
      if (error.name === 'AbortError') {
        setErrorMessage('Request timed out. Please try again.');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setErrorMessage('Network connection issue. Please check your internet connection.');
      } else {
        setErrorMessage(`Error generating instrumental: ${error.message}`);
      }
    } finally {
      setGenerating(false);
    }
  }

  // Handle creating a new clip with melody pattern
  const handleCreateMelodicClip = (trackIdx) => {
    // Generate a melody pattern based on current scale
    const pattern = createMelodicSequence(tracks[trackIdx].type);
    const newClip = {
      id: Date.now() + Math.random(),
      start: 200, // Position at 10 seconds (200px)
      length: 200,
      color: COLORS[tracks[trackIdx].type] || COLORS.melody,
      pattern: pattern,
      trackType: tracks[trackIdx].type
    };
    
    setTracks(prev => {
      const copy = prev.map(t => ({ ...t, clips: [...t.clips] }));
      copy[trackIdx].clips.push(newClip);
      return copy;
    });
  };
  
  // Select a track
  const handleSelectTrack = (idx) => {
    setSelectedTrackIndex(idx);
  };
  
  return (
    <div className="studio-page">
      <h1 className="studio-title">🎵 Music Studio</h1>
      <p className="studio-description">
        Create melodic patterns, mix tracks, and generate full instrumentals. Double-click to add clips!
      </p>

      <div className="studio-controls">
        <div className="controls-row">
          <div className="studio-toolbar">
            <div className="control-group">
              <label>BPM:</label>
              <input 
                type="number" 
                min="60" 
                max="200" 
                value={bpm} 
                onChange={(e) => setBpm(parseInt(e.target.value) || 120)} 
                className="bpm-input"
              />
            </div>
            
            <div className="control-group">
              <label>Scale:</label>
              <select value={currentScale} onChange={e => setCurrentScale(e.target.value)}>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="pentatonic">Pentatonic</option>
                <option value="blues">Blues</option>
                <option value="chromatic">Chromatic</option>
              </select>
            </div>
            
            <div className="control-group">
              <label>Key:</label>
              <select value={currentKey} onChange={e => setCurrentKey(e.target.value)}>
                <option value="C">C</option>
                <option value="C#">C#</option>
                <option value="D">D</option>
                <option value="D#">D#</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="F#">F#</option>
                <option value="G">G</option>
                <option value="G#">G#</option>
                <option value="A">A</option>
                <option value="A#">A#</option>
                <option value="B">B</option>
              </select>
            </div>
            
            <button className="play-btn" onClick={play} disabled={playing}>▶ Play</button>
            <button className="stop-btn" onClick={stop} disabled={!playing}>■ Stop</button>
          </div>
          
          <div className="track-controls">
            <button className="add-btn" onClick={() => addTrack('drums')}>+ Drum Track</button>
            <button className="add-btn" onClick={() => addTrack('melody')}>+ Melody Track</button>
            <button className="add-btn" onClick={() => addTrack('bass')}>+ Bass Track</button>
            <button className="add-btn" onClick={() => addTrack('chord')}>+ Chord Track</button>
          </div>
        </div>
        
        <div className="melody-controls">
          <h3>Pattern Generator</h3>
          <p>Create melodic patterns for the selected track:</p>
          {selectedTrackIndex !== null && tracks[selectedTrackIndex] && (
            <div className="pattern-actions">
              <span className="selected-track">
                Selected: {tracks[selectedTrackIndex].name} (Track {selectedTrackIndex + 1})
              </span>
              <button 
                className="pattern-btn" 
                onClick={() => handleCreateMelodicClip(selectedTrackIndex)}
                disabled={!['melody', 'bass', 'chord'].includes(tracks[selectedTrackIndex]?.type)}
              >
                Generate Pattern
              </button>
              <span className="track-type">Type: {tracks[selectedTrackIndex].type}</span>
            </div>
          )}
        </div>
      </div>

      <div className="generation-controls">
        <h3>Generate Full Instrumental</h3>
        <div className="generation-inputs">
          <label>
            Instrument:
            <select value={instrument} onChange={e => setInstrument(e.target.value)}>
              <option>Piano</option>
              <option>Guitar</option>
              <option>Synth</option>
              <option>Drums</option>
              <option>Bass</option>
              <option>Orchestra</option>
              <option>Electronic</option>
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
              placeholder="Describe style, mood, tempo, genre..."
            />
          </label>
          <button className="generate-btn" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : 'Generate Instrumental'}
          </button>
        </div>
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
            <div 
              className={`track-row ${selectedTrackIndex === tIdx ? 'selected-track' : ''}`} 
              key={track.id}
              onClick={() => handleSelectTrack(tIdx)}
            >
              <div className="track-label" style={{ backgroundColor: COLORS[track.type] || '#ccc' }}>
                {track.name}
                <div className="track-controls">
                  <button className="track-btn mute" onClick={(e) => {
                    e.stopPropagation();
                    setTracks(prev => {
                      const copy = [...prev];
                      copy[tIdx] = { ...copy[tIdx], mute: !copy[tIdx].mute };
                      return copy;
                    });
                  }}>{track.mute ? '🔇' : '🔊'}</button>
                </div>
              </div>
              <div
                className="track-content"
                data-type="track-content"
                onDoubleClick={e => handleTrackDoubleClick(e, tIdx)}
              >
                {track.clips.map((clip, cIdx) => (
                  <div
                    key={clip.id}
                    className={`clip ${dragging && dragging.trackIdx === tIdx && dragging.clipIdx === cIdx ? 'dragging' : ''} ${clip.pattern ? 'melodic-clip' : ''}`}
                    style={{ 
                      left: clip.start, 
                      width: clip.length, 
                      backgroundColor: clip.color,
                      backgroundImage: clip.pattern ? 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)' : 'none',
                      backgroundSize: clip.pattern ? '20px 20px' : 'auto'
                    }}
                    onMouseDown={e => startDrag(e, tIdx, cIdx)}
                    title={clip.pattern ? `Melodic pattern with ${clip.pattern.length} notes` : 'Clip'}
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
