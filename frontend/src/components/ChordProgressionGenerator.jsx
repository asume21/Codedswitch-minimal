import React, { useState, useMemo } from 'react'
import { getScaleNotes, getChordNotes, CHORD_TYPES, SCALES } from '../utils/MusicTheory'

const ChordProgressionGenerator = ({ 
  currentKey = 'C', 
  currentScale = 'major', 
  onChordSelect,
  selectedChords = [],
  className = ''
}) => {
  const [selectedProgression, setSelectedProgression] = useState('')
  const [customChords, setCustomChords] = useState([])

  // Common chord progressions with roman numerals
  const PROGRESSIONS = {
    'I-V-vi-IV': ['I', 'V', 'vi', 'IV'],
    'I-vi-IV-V': ['I', 'vi', 'IV', 'V'],
    'ii-V-I': ['ii', 'V', 'I'],
    'I-IV-V': ['I', 'IV', 'V'],
    'vi-IV-I-V': ['vi', 'IV', 'I', 'V'],
    'I-V-vi-iii-IV': ['I', 'V', 'vi', 'iii', 'IV'],
    '12-bar-blues': ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V']
  }

  // Generate chord suggestions based on current key and scale
  const chordSuggestions = useMemo(() => {
    const scaleNotes = getScaleNotes(currentKey, currentScale)
    const chords = []
    
    // Generate triads for each scale degree
    scaleNotes.forEach((rootNote, degree) => {
      // Major/minor based on scale position
      const chordType = getChordTypeForDegree(degree, currentScale)
      const chordNotes = getChordNotes(rootNote, chordType)
      
      chords.push({
        name: getRomanNumeral(degree + 1, chordType),
        root: rootNote,
        type: chordType,
        notes: chordNotes,
        degree: degree + 1
      })
    })
    
    return chords
  }, [currentKey, currentScale])

  // Generate chord from roman numeral
  const generateChordFromRoman = (roman) => {
    const degree = getDegreeFromRoman(roman)
    const rootNote = getScaleNotes(currentKey, currentScale)[degree - 1]
    const chordType = getChordTypeFromRoman(roman)
    
    return {
      name: roman,
      root: rootNote,
      type: chordType,
      notes: getChordNotes(rootNote, chordType)
    }
  }

  // Handle chord selection
  const handleChordSelect = (chord) => {
    const chordData = {
      ...chord,
      id: Date.now() + Math.random(),
      timestamp: Date.now()
    }
    
    onChordSelect?.(chordData)
    setCustomChords(prev => [...prev, chordData])
  }

  // Handle progression selection
  const handleProgressionSelect = (progressionName) => {
    setSelectedProgression(progressionName)
    const chords = PROGRESSIONS[progressionName].map(roman => 
      generateChordFromRoman(roman)
    )
    
    chords.forEach(chord => handleChordSelect(chord))
  }

  // Render chord visualization
  const ChordVisualization = ({ chord, onClick }) => {
    const pianoKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    return (
      <div 
        className="chord-card"
        onClick={() => onClick?.(chord)}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          padding: '12px',
          margin: '8px',
          cursor: 'pointer',
          minWidth: '120px',
          textAlign: 'center',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
      >
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          {currentKey} {chord.name}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          {chord.type}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
          {chord.notes.join(' - ')}
        </div>
      </div>
    )
  }

  return (
    <div className={`chord-progression-generator ${className}`}>
      <div style={{ 
        background: '#1a1a1a', 
        borderRadius: '12px', 
        padding: '20px',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#667eea' }}>
          Chord Progression Generator
        </h3>
        
        {/* Scale Display */}
        <div style={{ marginBottom: '16px', fontSize: '14px' }}>
          <strong>Key:</strong> {currentKey} {currentScale}
        </div>

        {/* Progression Templates */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Popular Progressions</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(PROGRESSIONS).map(([name, chords]) => (
              <button
                key={name}
                onClick={() => handleProgressionSelect(name)}
                style={{
                  background: selectedProgression === name ? '#667eea' : '#333',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Chord Suggestions */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Available Chords</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '8px'
          }}>
            {chordSuggestions.map((chord, index) => (
              <ChordVisualization
                key={index}
                chord={chord}
                onClick={handleChordSelect}
              />
            ))}
          </div>
        </div>

        {/* Selected Chords */}
        {selectedChords.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Current Progression</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedChords.map((chord, index) => (
                <div key={index} style={{
                  background: '#333',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}>
                  {chord.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper functions
const getRomanNumeral = (degree, chordType) => {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
  const numeral = numerals[degree - 1] || 'I'
  return chordType.includes('minor') ? numeral.toLowerCase() : numeral
}

const getDegreeFromRoman = (roman) => {
  const mapping = {
    'I': 1, 'i': 1, 'II': 2, 'ii': 2, 'III': 3, 'iii': 3,
    'IV': 4, 'iv': 4, 'V': 5, 'v': 5, 'VI': 6, 'vi': 6, 'VII': 7, 'vii': 7
  }
  return mapping[roman] || 1
}

const getChordTypeFromRoman = (roman) => {
  return roman === roman.toLowerCase() ? 'minor' : 'major'
}

const getChordTypeForDegree = (degree, scale) => {
  // Basic chord type mapping based on scale degree
  const majorChords = [1, 4, 5]
  const minorChords = [2, 3, 6]
  const diminishedChords = [7]
  
  if (majorChords.includes(degree + 1)) return 'major'
  if (minorChords.includes(degree + 1)) return 'minor'
  if (diminishedChords.includes(degree + 1)) return 'diminished'
  
  return 'major'
}

export default ChordProgressionGenerator
