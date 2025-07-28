import React, { useState, useRef, useEffect } from 'react'
import './BeatStudio.css'
import LoopBrowser from './LoopBrowser'
import * as Tone from 'tone'
import { FaPlay, FaPause, FaStop, FaTrash, FaPlus, FaVolumeUp, FaVolumeMute } from 'react-icons/fa'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://newnewwebsite.onrender.com'
const DIRECT_FILE_ACCESS = true // Set to false if accessing files via backend API

const BeatStudio = () => {
  // State for BPM and track styling
  const [bpm, setBpm] = useState(90)
  const [style, setStyle] = useState('Hip-Hop')
  const [generating, setGenerating] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Synth instances
  const [synths, setSynths] = useState(null)
  
  // Enhanced sequencer state
  const [tracks, setTracks] = useState([
    { id: 1, name: 'Drums', type: 'drums', clips: [], mute: false, color: '#ff6b6b' },
    { id: 2, name: 'Bass', type: 'bass', clips: [], mute: false, color: '#4ecdc4' },
    { id: 3, name: 'Melody', type: 'melody', clips: [], mute: false, color: '#45b7d1' },
    { id: 4, name: 'FX', type: 'fx', clips: [], mute: false, color: '#96ceb4' }
  ])
  
  const [selectedClip, setSelectedClip] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [playheadPosition, setPlayheadPosition] = useState(0)
  const [transportTime, setTransportTime] = useState(0)
  
  // Refs
  const playersRef = useRef({})
  const transportTimeRef = useRef(0)
  const animationFrameRef = useRef(null)
  const sequencerRef = useRef(null)
  
  const PIXELS_PER_SECOND = 50
  const GRID_SIZE = 25
  const TRACK_HEIGHT = 80

  // Initialize synths on component mount
  useEffect(() => {
    // Create synth instances
    const drumSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 1.4 }
    }).toDestination()
    
    const noiseSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 }
    }).toDestination()
    
    const bassSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 1.2 }
    }).toDestination()
    bassSynth.volume.value = -6
    
    const melodySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1 }
    }).toDestination()
    melodySynth.volume.value = -8
    
    const fxSynth = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination()
    fxSynth.volume.value = -20
    
    setSynths({
      drum: drumSynth,
      noise: noiseSynth,
      bass: bassSynth,
      melody: melodySynth,
      fx: fxSynth
    })
    
    // Clean up synths when component unmounts
    return () => {
      if (synths) {
        Object.values(synths).forEach(synth => {
          if (synth && synth.dispose) {
            synth.dispose()
          }
        })
      }
      
      // Dispose of any active players
      Object.values(playersRef.current).forEach(player => {
        if (player) {
          if (player.stop) player.stop()
          if (player.dispose) player.dispose()
        }
      })
      
      // Cancel any pending animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])
  
  // Enhanced audio clip playback 
  const playPadClip = (clip) => {
    try {
      Tone.start().then(() => {
        if (!clip) return
        
        if (clip.url) {
          // Use Player for clips with URLs
          const player = new Tone.Player({
            url: clip.url,
            onload: () => {
              player.start()
            },
            onerror: (err) => {
              console.error('Error loading audio:', err)
              setErrorMessage('Failed to load audio clip')
              setTimeout(() => setErrorMessage(''), 3000)
              
              // Fallback to synth if URL fails
              triggerSynthForType(clip.type || 'drum')
            }
          }).toDestination()
        } else {
          // Use appropriate synth based on clip type
          triggerSynthForType(clip.type)
        }
      }).catch(err => {
        console.error('Error playing clip:', err)
        setErrorMessage('Failed to play clip')
        setTimeout(() => setErrorMessage(''), 3000)
      })
    } catch (error) {
      console.error('Error in playPadClip:', error)
      setErrorMessage('Failed to play clip')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }
  
  // Helper to trigger synth based on clip type
  const triggerSynthForType = (type) => {
    if (!synths) return
    
    switch (type) {
      case 'drum':
        synths.drum.triggerAttackRelease('C1', '8n')
        break
      case 'bass':
        synths.bass.triggerAttackRelease('C2', '8n')
        break
      case 'melody':
        synths.melody.triggerAttackRelease(['C4', 'E4', 'G4'], '8n')
        break
      case 'fx':
        synths.fx.triggerAttackRelease('16n')
        break
      default:
        // Default to a simple drum hit
        synths.drum.triggerAttackRelease('C1', '8n')
    }
  }