import React, { useState, useRef, useEffect } from 'react'
import './BeatStudio.css'
import LoopBrowser from './LoopBrowser'
import * as Tone from 'tone'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';
const DIRECT_FILE_ACCESS = true; // Set to false if accessing files via backend API

const BeatStudio = () => {
  // State for BPM and track styling
  const [bpm, setBpm] = useState(90)
  const [style, setStyle] = useState('Hip-Hop')
  
  // Playback state
  const [generating, setGenerating] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  
  // Sequencer state
  const [loopClips, setLoopClips] = useState([])
  const PIXELS_PER_SECOND = 20
  const [padClips, setPadClips] = useState(Array(9).fill(null))
  const [playheadX, setPlayheadX] = useState(0)
  const [selectedClipId, setSelectedClipId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [tracks, setTracks] = useState([
    { id: 'track1', name: 'Drums', type: 'drums', clips: [], mute: false },
    { id: 'track2', name: 'Melody', type: 'melody', clips: [], mute: false },
    { id: 'track3', name: 'Bass', type: 'bass', clips: [], mute: false }
  ])
  
  // Refs for audio handling
  const playersRef = useRef({})
  const markerIntervalRef = useRef(null)
  const transportTimeRef = useRef(0)
  const sequencersRef = useRef([])

  // Play a single pad clip with enhanced error handling and buffer loading
  const playPadClip = async (clip) => {
    try {
      // Determine the audio source based on configuration
      const url = DIRECT_FILE_ACCESS 
        ? `/samples/${clip.filename}` 
        : `${BACKEND_URL}/api/loops/${clip.bpm}/${clip.filename}`;
      
      console.log('Playing pad clip:', url);
      
      // Initialize audio context if needed
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      // Create a player for one-shot playback
      const player = new Tone.Player({
        url: url,
        onload: () => {
          player.start();
        },
        onerror: (err) => {
          console.error('Failed to load audio file:', err);
          setErrorMessage(`Failed to load clip: ${clip.filename}`);
          setTimeout(() => setErrorMessage(''), 3000);
        }
      }).toDestination();
      
      // Clean up player when playback ends
      setTimeout(() => {
        if (player && player.dispose) {
          player.dispose();
        }
      }, 5000); // Dispose after 5 seconds to ensure playback completes
    } catch (err) {
      console.error('Audio playback error:', err);
      setErrorMessage('Failed to play clip. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };
  // Generate a new beat with AI and handle the job polling process
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
      setErrorMessage('Beat generation in progress...');
      
      // Poll for generated file with timeout
      let musicBlob;
      let pollAttempts = 0;
      const maxAttempts = 30; // 60 seconds total (2s * 30)
      
      while (pollAttempts < maxAttempts) {
        const pollRes = await fetch(`${BACKEND_URL}/api/music-file?jobId=${jobId}`);
        
        if (pollRes.status === 202) {
          await new Promise(r => setTimeout(r, 2000));
          pollAttempts++;
          setErrorMessage(`Generating beat... ${Math.round((pollAttempts/maxAttempts) * 100)}%`);
          continue;
        }
        
        if (!pollRes.ok) {
          const errorText = await pollRes.text();
          throw new Error(errorText || 'Failed to fetch generated beat');
        }
        
        musicBlob = await pollRes.blob();
        setErrorMessage('');
        break;
      }
      
      if (!musicBlob) {
        throw new Error('Beat generation timed out. Please try again.');
      }
      
      // Create audio URL and play
      const url = URL.createObjectURL(musicBlob);
      setAudioUrl(url);
      
      // Start audio playback through Tone.js for consistent experience
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      const player = new Tone.Player(url).toDestination();
      await player.load();
      player.start();
      
      // Auto-analyze the beat to create clips in the sequencer
      analyzeAndCreateClips(url);
      
    } catch (error) {
      console.error(error);
      setErrorMessage(`Error generating beat: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setGenerating(false);
    }
  }
  
  // Analyze beat audio and create sequencer clips automatically
  const analyzeAndCreateClips = async (audioUrl) => {
    try {
      // In a real implementation, this would use audio analysis
      // For now, we'll create some placeholder clips based on the style
      
      // Create a new drum track clip
      const drumClip = {
        id: `drum-${Date.now()}`,
        type: 'drums',
        start: 0,
        length: 8 * PIXELS_PER_SECOND,
        filename: style.toLowerCase() + '-drums.wav'
      };
      
      // Create a bass track clip
      const bassClip = {
        id: `bass-${Date.now()}`,
        type: 'bass',
        start: 0,
        length: 16 * PIXELS_PER_SECOND,
        filename: style.toLowerCase() + '-bass.wav'
      };
      
      // Create a melody track clip
      const melodyClip = {
        id: `melody-${Date.now()}`,
        type: 'melody',
        start: 4 * PIXELS_PER_SECOND,
        length: 12 * PIXELS_PER_SECOND,
        filename: style.toLowerCase() + '-melody.wav'
      };
      
      // Add the clips to the appropriate tracks
      setTracks(prev => {
        const newTracks = [...prev];
        
        // Find the drums track and add the drum clip
        const drumsTrackIndex = newTracks.findIndex(t => t.type === 'drums');
        if (drumsTrackIndex !== -1) {
          newTracks[drumsTrackIndex].clips.push(drumClip);
        }
        
        // Find the bass track and add the bass clip
        const bassTrackIndex = newTracks.findIndex(t => t.type === 'bass');
        if (bassTrackIndex !== -1) {
          newTracks[bassTrackIndex].clips.push(bassClip);
        }
        
        // Find the melody track and add the melody clip
        const melodyTrackIndex = newTracks.findIndex(t => t.type === 'melody');
        if (melodyTrackIndex !== -1) {
          newTracks[melodyTrackIndex].clips.push(melodyClip);
        }
        
        return newTracks;
      });
    } catch (error) {
      console.error('Error analyzing audio:', error);
    }
  }

  // Handle play button click with pause/resume support
  const handlePlayClick = async () => {
    // If already playing and not paused, pause playback
    if (playing && !paused) {
      pausePlayback();
      return;
    }
    
    // If paused, resume playback
    if (paused) {
      resumePlayback();
      return;
    }
    
    // Otherwise start fresh playback
    await Tone.start();
    startPlayback();
  };

  // Pause current playback
  const pausePlayback = () => {
    // Store current position for resuming later
    transportTimeRef.current = Tone.Transport.seconds;
    Tone.Transport.pause();
    setPaused(true);
    
    // Pause the playhead marker animation
    clearInterval(markerIntervalRef.current);
    console.log('Playback paused at', transportTimeRef.current);
  };
  
  // Resume playback from paused position
  const resumePlayback = () => {
    Tone.Transport.start();
    setPaused(false);
    
    // Resume playhead marker animation
    markerIntervalRef.current = setInterval(() => {
      setPlayheadX(x => x + PIXELS_PER_SECOND * 0.1);
    }, 100);
    console.log('Resuming playback from', transportTimeRef.current);
  };

  // Tone.js loop and track scheduler with enhanced functionality
  const startPlayback = async () => {
    if (playing) return;
    
    try {
      // Start audio context if needed
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      // Clear previous scheduling
      Tone.Transport.stop();
      Tone.Transport.cancel();
      
      // Dispose old players and sequencers
      Object.values(playersRef.current).forEach(p => {
        if (p && p.dispose) p.dispose();
      });
      playersRef.current = {};
      
      sequencersRef.current.forEach(seq => {
        if (seq && seq.dispose) seq.dispose();
      });
      sequencersRef.current = [];
      
      // Reset transport position
      Tone.Transport.seconds = 0;
      transportTimeRef.current = 0;
      
      // Set BPM
      Tone.Transport.bpm.value = bpm;
      
      // Schedule all loops
      loopClips.forEach(clip => {
        const url = DIRECT_FILE_ACCESS 
          ? `/samples/${clip.filename}` 
          : `${BACKEND_URL}/api/loops/${clip.bpm}/${clip.filename}`;
          
        const player = new Tone.Player();
        
        // Load and schedule the player
        player.load(url).then(() => {
          player.loop = true;
          const durationSec = clip.length / PIXELS_PER_SECOND;
          player.loopEnd = durationSec;
          player.toDestination();
          
          playersRef.current[clip.id] = player;
          const timeOffset = clip.start / PIXELS_PER_SECOND;
          
          Tone.Transport.schedule(time => {
            player.start(time);
          }, timeOffset);
        }).catch(err => {
          console.error('Failed to load loop:', clip.filename, err);
          setErrorMessage(`Failed to load loop: ${clip.filename}`);
          setTimeout(() => setErrorMessage(''), 3000);
        });
      });
      
      // Schedule track clips
      tracks.forEach((track, idx) => {
        // Skip muted tracks
        if (track.mute) return;
        
        track.clips.forEach(clip => {
          const url = DIRECT_FILE_ACCESS 
            ? `/samples/${clip.filename}` 
            : `${BACKEND_URL}/api/loops/${clip.bpm || bpm}/${clip.filename}`;
            
          const player = new Tone.Player();
          
          // Load and schedule the player
          player.load(url).then(() => {
            player.loop = clip.loop || false;
            if (clip.loop) {
              const durationSec = clip.length / PIXELS_PER_SECOND;
              player.loopEnd = durationSec;
            }
            player.toDestination();
            
            // Store player reference
            const clipId = clip.id;
            playersRef.current[clipId] = player;
            
            // Schedule clip playback
            const timeOffset = clip.start / PIXELS_PER_SECOND;
            Tone.Transport.schedule(time => {
              player.start(time);
            }, timeOffset);
            
            // Schedule clip end if not looping
            if (!clip.loop) {
              const endTime = (clip.start + clip.length) / PIXELS_PER_SECOND;
              Tone.Transport.schedule(time => {
                player.stop(time);
              }, endTime);
            }
          }).catch(err => {
            console.error('Failed to load clip:', clip.filename, err);
          });
        });
      });
      
      // Start transport and update UI state
      Tone.Transport.start();
      setPlaying(true);
      setPaused(false);
      
      // Start playhead marker animation
      if (markerIntervalRef.current) clearInterval(markerIntervalRef.current);
      setPlayheadX(0);
      markerIntervalRef.current = setInterval(() => {
        setPlayheadX(x => x + PIXELS_PER_SECOND * 0.1);
      }, 100);
      
      console.log('Playback started with BPM:', bpm);
    } catch (error) {
      console.error('Audio playback error:', error);
      setErrorMessage('Audio playback failed. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Stop playback completely
  const stopPlayback = () => {
    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      
      // Dispose all audio resources
      Object.values(playersRef.current).forEach(p => {
        if (p && p.dispose) p.dispose();
      });
      playersRef.current = {};
      
      sequencersRef.current.forEach(seq => {
        if (seq && seq.dispose) seq.dispose();
      });
      sequencersRef.current = [];
      
      // Update UI state
      setPlaying(false);
      setPaused(false);
      clearInterval(markerIntervalRef.current);
      setPlayheadX(0);
      transportTimeRef.current = 0;
      
      console.log('Playback stopped');
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };
  
  // Add a new clip to a track
  const addClipToTrack = (trackId, clipData) => {
    const newClip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...clipData,
      start: clipData.start || 0,
      length: clipData.length || (8 * PIXELS_PER_SECOND)
    };
    
    setTracks(prev => {
      return prev.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            clips: [...track.clips, newClip]
          };
        }
        return track;
      });
    });
    
    return newClip.id;
  };
  
  // Remove a clip from a track
  const removeClipFromTrack = (trackId, clipId) => {
    setTracks(prev => {
      return prev.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            clips: track.clips.filter(c => c.id !== clipId)
          };
        }
        return track;
      });
    });
  };
  
  // Handle clip selection
  const selectClip = (clipId) => {
    setSelectedClipId(clipId);
  };
  
  // Handle clip position change (drag and drop)
  const updateClipPosition = (trackId, clipId, newStart) => {
    // Ensure start is not negative
    const start = Math.max(0, newStart);
    
    setTracks(prev => {
      return prev.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            clips: track.clips.map(clip => {
              if (clip.id === clipId) {
                return { ...clip, start };
              }
              return clip;
            })
          };
        }
        return track;
      });
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all audio resources and intervals
      stopPlayback();
    };
  }, []);
  
  return (
    <div className="studio-page">
      <h1 className="studio-title">🎧 Beat Studio</h1>
      <p className="studio-description">
        Build custom beats powered by AI. Adjust BPM, choose your style, and create multi-track music.
      </p>

      {/* Error message display */}
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
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
            <option>Techno</option>
            <option>R&B</option>
            <option>Drum & Bass</option>
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
          const newClip = { 
            id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
            bpm: loopBpm, 
            filename, 
            start: 0, 
            length: 8 * PIXELS_PER_SECOND,
            loop: true
          };
          
          // Add to track based on filename
          let trackId = 'track1'; // Default to drums track
          if (filename.includes('bass')) trackId = 'track2';
          if (filename.includes('melody') || filename.includes('synth')) trackId = 'track3';
          
          addClipToTrack(trackId, newClip);
          
          // Also add to pads for quick preview
          setPadClips(prevPads => {
            const next = [...prevPads];
            const emptyIndex = next.findIndex(p => p === null);
            if (emptyIndex !== -1) next[emptyIndex] = newClip;
            return next;
          });
        }} />

        {/* Playback controls */}
        <div className="playback-controls">
          {!playing && !paused && (
            <button className="btn-secondary" onClick={handlePlayClick}>
              ▶️ Play
            </button>
          )}
          {playing && !paused && (
            <button className="btn-secondary" onClick={handlePlayClick}>
              ⏸️ Pause
            </button>
          )}
          {paused && (
            <button className="btn-secondary" onClick={handlePlayClick}>
              ▶️ Resume
            </button>
          )}
          {(playing || paused) && (
            <button className="btn-secondary" onClick={stopPlayback}>
              ⏹️ Stop
            </button>
          )}
        </div>
      </div>

      {/* Sound pad grid */}
      <div className="pad-grid">
        {padClips.map((clip, idx) => (
          <button
            key={idx}
            className={`pad ${clip ? 'pad-active' : 'pad-empty'}`}
            onClick={() => clip && playPadClip(clip)}
            disabled={!clip}
            title={clip ? `Play ${clip.filename}` : `Empty Pad ${idx+1}`}
          >
            {clip ? clip.filename.split('.')[0].substring(0, 10) : `Pad ${idx+1}`}
          </button>
        ))}
      </div>

      {/* Playback status */}
      {playing && !paused && (
        <p className="preview-note">Playing at {bpm} BPM ({style}).</p>
      )}
      {paused && (
        <p className="preview-note">Paused at {Math.round(transportTimeRef.current * 10) / 10}s.</p>
      )}
      
      {/* AI-generated audio player */}
      {audioUrl && (
        <div className="audio-player">
          <h3>Generated Beat</h3>
          <audio controls src={audioUrl} />
          <div className="audio-controls">
            <a href={audioUrl} download={`${style.toLowerCase()}-beat-${bpm}bpm.wav`} className="download-link">
              💾 Download Beat
            </a>
            <button 
              className="audio-btn"
              onClick={() => {
                // Send to sequencer as tracks
                analyzeAndCreateClips(audioUrl);
              }}
            >
              🔄 Add to Sequencer
            </button>
          </div>
        </div>
      )}
      
      {/* Multi-track sequencer */}
      <div className="enhanced-sequencer">
        <h2 className="sequencer-title">Multi-track Sequencer</h2>
        
        <div className="track-controls">
          {tracks.map(track => (
            <div key={track.id} className="track-control">
              <span className="track-name">{track.name}</span>
              <button 
                className={`mute-btn ${track.mute ? 'muted' : ''}`}
                onClick={() => {
                  setTracks(prev => prev.map(t => 
                    t.id === track.id ? {...t, mute: !t.mute} : t
                  ));
                }}
                title={track.mute ? 'Unmute track' : 'Mute track'}
              >
                {track.mute ? '🔇' : '🔊'}
              </button>
            </div>
          ))}
        </div>
        
        <div className="sequencer-grid">
          {/* Timeline markers */}
          <div className="timeline-markers">
            {Array(16).fill(0).map((_, i) => (
              <div key={`marker-${i}`} className="timeline-marker" style={{ left: i * PIXELS_PER_SECOND * 4 }}>
                {i * 4}s
              </div>
            ))}
          </div>
          
          {/* Playhead marker */}
          <div className="playhead-marker" style={{ left: playheadX }} />
          
          {/* Track rows */}
          {tracks.map((track, trackIndex) => (
            <div 
              key={track.id} 
              className={`track-row ${track.mute ? 'track-muted' : ''}`}
              style={{ top: trackIndex * 60, height: 50 }}
              onDragOver={(e) => {
                e.preventDefault();
                // Support for drag and drop positioning
              }}
            >
              {/* Track clips */}
              {track.clips.map(clip => (
                <div
                  key={clip.id}
                  className={`sequencer-clip ${selectedClipId === clip.id ? 'selected' : ''} ${clip.type || track.type}`}
                  style={{
                    position: 'absolute',
                    left: clip.start,
                    width: clip.length,
                    height: 40,
                    cursor: 'pointer',
                    borderRadius: 4,
                    padding: '4px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis'
                  }}
                  onClick={() => selectClip(clip.id)}
                  onDoubleClick={() => playPadClip(clip)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('clipId', clip.id);
                    e.dataTransfer.setData('trackId', track.id);
                  }}
                  title={`${clip.filename} (Double-click to preview)`}
                >
                  <div className="clip-content">
                    {clip.filename.split('.')[0]}
                    {clip.loop && <span className="loop-indicator">🔄</span>}
                  </div>
                  <button 
                    className="remove-clip" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeClipFromTrack(track.id, clip.id);
                    }}
                    title="Remove clip"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ))}
          
          {/* Empty state message */}
          {tracks.every(track => track.clips.length === 0) && (
            <div className="sequencer-placeholder">
              No clips in sequencer. Generate a beat or add loops to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { BeatStudio as default };