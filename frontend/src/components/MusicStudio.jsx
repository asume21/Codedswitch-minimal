import React, { useState, useRef, useEffect } from 'react'
import './MusicStudio.css'
import { FaPlay, FaPause, FaStop, FaVolumeUp, FaVolumeMute, FaDrum, FaMusic, FaRobot } from 'react-icons/fa'
import { GiPianoKeys, GiTrumpet, GiFlute, GiSaxophone } from 'react-icons/gi'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://newnewwebsite.onrender.com'

// Piano keys (one octave)
const PIANO_KEYS = [
  { note: 'C', type: 'white', midi: 60 },
  { note: 'C#', type: 'black', midi: 61 },
  { note: 'D', type: 'white', midi: 62 },
  { note: 'D#', type: 'black', midi: 63 },
  { note: 'E', type: 'white', midi: 64 },
  { note: 'F', type: 'white', midi: 65 },
  { note: 'F#', type: 'black', midi: 66 },
  { note: 'G', type: 'white', midi: 67 },
  { note: 'G#', type: 'black', midi: 68 },
  { note: 'A', type: 'white', midi: 69 },
  { note: 'A#', type: 'black', midi: 70 },
  { note: 'B', type: 'white', midi: 71 }
]

// Drum pads
const DRUM_PADS = [
  { name: 'Kick', color: '#ff6b6b', key: 'Q' },
  { name: 'Snare', color: '#4ecdc4', key: 'W' },
  { name: 'Hi-Hat', color: '#45b7d1', key: 'E' },
  { name: 'Crash', color: '#f9ca24', key: 'R' },
  { name: 'Tom', color: '#6c5ce7', key: 'A' },
  { name: 'Clap', color: '#a29bfe', key: 'S' }
]

// Sound effects
const SOUND_FX = [
  { name: 'Drip', color: '#74b9ff' },
  { name: 'Hit', color: '#fd79a8' },
  { name: 'Whoosh', color: '#fdcb6e' },
  { name: 'Pop', color: '#6c5ce7' },
  { name: 'Zap', color: '#00b894' },
  { name: 'Beep', color: '#e17055' }
]

const MusicStudio = () => {
  const [activeTab, setActiveTab] = useState('piano')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Simple sound generation (placeholder)
  const playSound = (type, note) => {
    console.log(`Playing ${type}: ${note}`)
    // Here you would integrate with Tone.js or Web Audio API
  }

  // AI Music Generation
  const generateAIMusic = async () => {
    if (!aiPrompt.trim()) return
    
    setIsGenerating(true)
    setAiResponse('')
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Generate music: ${aiPrompt}`,
          context: 'music_studio'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAiResponse(data.response)
      } else {
        setAiResponse('AI music generation is currently unavailable. Try playing instruments manually!')
      }
    } catch (error) {
      console.error('AI Generation Error:', error)
      setAiResponse('AI music generation is currently unavailable. Try playing instruments manually!')
    } finally {
      setIsGenerating(false)
    }
  }

  const renderPianoTab = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <GiPianoKeys size={32} />
        <h3>Piano</h3>
        <button 
          className="ai-play-btn"
          onClick={() => {
            setAiPrompt('Play a beautiful piano melody')
            generateAIMusic()
          }}
        >
          🤖 AI Play
        </button>
      </div>
      <div className="piano-keys">
        {PIANO_KEYS.map((key, index) => (
          <button
            key={index}
            className={`piano-key ${key.type}-key`}
            onClick={() => playSound('piano', key.note)}
            title={`${key.note} - Click to play`}
          >
            {key.type === 'white' && <span className="key-label">{key.note}</span>}
          </button>
        ))}
      </div>
    </div>
  )

  const renderDrumsTab = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <FaDrum size={32} />
        <h3>Drums</h3>
        <button 
          className="ai-play-btn"
          onClick={() => {
            setAiPrompt('Create a sick drum beat')
            generateAIMusic()
          }}
        >
          🤖 AI Beat
        </button>
      </div>
      <div className="drum-pads">
        {DRUM_PADS.map((pad, index) => (
          <button
            key={index}
            className="drum-pad"
            style={{ backgroundColor: pad.color }}
            onClick={() => playSound('drum', pad.name)}
            title={`${pad.name} - Press ${pad.key} or click`}
          >
            <div className="pad-name">{pad.name}</div>
            <div className="pad-key">{pad.key}</div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderHornsTab = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <GiTrumpet size={32} />
        <h3>Horns & Winds</h3>
        <button 
          className="ai-play-btn"
          onClick={() => {
            setAiPrompt('Play a jazzy trumpet solo')
            generateAIMusic()
          }}
        >
          🤖 AI Solo
        </button>
      </div>
      <div className="horn-instruments">
        <button className="horn-btn" onClick={() => playSound('horn', 'trumpet')}>
          <GiTrumpet size={24} />
          <span>Trumpet</span>
        </button>
        <button className="horn-btn" onClick={() => playSound('horn', 'saxophone')}>
          <GiSaxophone size={24} />
          <span>Saxophone</span>
        </button>
        <button className="horn-btn" onClick={() => playSound('horn', 'flute')}>
          <GiFlute size={24} />
          <span>Flute</span>
        </button>
      </div>
    </div>
  )

  const renderSoundFXTab = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <FaMusic size={32} />
        <h3>Sound Effects</h3>
        <button 
          className="ai-play-btn"
          onClick={() => {
            setAiPrompt('Add some cool sound effects')
            generateAIMusic()
          }}
        >
          🤖 AI FX
        </button>
      </div>
      <div className="fx-pads">
        {SOUND_FX.map((fx, index) => (
          <button
            key={index}
            className="fx-pad"
            style={{ backgroundColor: fx.color }}
            onClick={() => playSound('fx', fx.name)}
            title={`${fx.name} - Click to play`}
          >
            <div className="fx-name">{fx.name}</div>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="ai-music-studio">
      <div className="studio-header">
        <h1>🎵 AI-Powered Music Studio</h1>
        <p>Click instruments to play them, or ask the AI to create music for you!</p>
      </div>

      {/* AI Control Panel */}
      <div className="ai-control-panel">
        <div className="ai-prompt-section">
          <div className="ai-icon">
            <FaRobot size={24} />
            <span>AI Musician</span>
          </div>
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ask AI: 'Play a jazz piano melody' or 'Create a drum beat' or 'Add some sound effects'"
            className="ai-prompt-input"
            onKeyPress={(e) => e.key === 'Enter' && generateAIMusic()}
          />
          <button 
            onClick={generateAIMusic}
            disabled={isGenerating}
            className="ai-generate-btn"
          >
            {isGenerating ? '🎵 Creating...' : '🎵 Generate'}
          </button>
        </div>
        {aiResponse && (
          <div className="ai-response">
            <strong>AI:</strong> {aiResponse}
          </div>
        )}
      </div>

      {/* Instrument Tabs */}
      <div className="instrument-tabs">
        <button 
          className={`tab-btn ${activeTab === 'piano' ? 'active' : ''}`}
          onClick={() => setActiveTab('piano')}
        >
          <GiPianoKeys size={20} />
          Piano
        </button>
        <button 
          className={`tab-btn ${activeTab === 'drums' ? 'active' : ''}`}
          onClick={() => setActiveTab('drums')}
        >
          <FaDrum size={20} />
          Drums
        </button>
        <button 
          className={`tab-btn ${activeTab === 'horns' ? 'active' : ''}`}
          onClick={() => setActiveTab('horns')}
        >
          <GiTrumpet size={20} />
          Horns
        </button>
        <button 
          className={`tab-btn ${activeTab === 'fx' ? 'active' : ''}`}
          onClick={() => setActiveTab('fx')}
        >
          <FaMusic size={20} />
          Sound FX
        </button>
      </div>

      {/* Active Instrument Panel */}
      <div className="active-instrument">
        {activeTab === 'piano' && renderPianoTab()}
        {activeTab === 'drums' && renderDrumsTab()}
        {activeTab === 'horns' && renderHornsTab()}
        {activeTab === 'fx' && renderSoundFXTab()}
      </div>

      {/* Transport Controls */}
      <div className="transport-controls">
        <button 
          className={`transport-btn ${isPlaying ? 'active' : ''}`}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button 
          className="transport-btn"
          onClick={() => setIsPlaying(false)}
        >
          <FaStop />
          Stop
        </button>
      </div>
    </div>
  )
}

export default MusicStudio
