import React, { useState, useEffect } from 'react';
import { codeToNotes, translateSampleFunction, translateDataAnalyzerClass } from '../utils/CodeHarmonyTranslator';
import PianoRoll from './PianoRoll';
import './CodeHarmonyChat.css';

const CodeHarmonyChat = ({ onSendToMusicStudio }) => {
  const [code, setCode] = useState('');
  const [notes, setNotes] = useState([]);
  const [translated, setTranslated] = useState(false);
  const [codeTitle, setCodeTitle] = useState('');
  const [showPianoRoll, setShowPianoRoll] = useState(false);
  const [demoOption, setDemoOption] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Load demo options
  const demoOptions = [
    { value: '', label: 'Custom Code' },
    { value: 'calculateAverage', label: 'Calculate Average Function' },
    { value: 'dataAnalyzer', label: 'Data Analyzer Class' }
  ];

  // Sample code for demos
  const sampleCodes = {
    calculateAverage: `// Function to calculate average of numbers
function calculate_average(numbers) {
  const total = sum(numbers);
  const count = len(numbers);
  if (count == 0) {
    return 0;
  }
  return total / count;
}`,
    dataAnalyzer: `// Data analysis class
class DataAnalyzer {
  constructor(data) {
    this.data = data;
  }
  
  get_stats() {
    const avg = calculate_average(this.data);
    return {
      "average": avg,
      "min": min(this.data),
      "max": max(this.data)
    };
  }
}`
  };

  // Handle demo selection changes
  useEffect(() => {
    if (demoOption) {
      setCode(sampleCodes[demoOption]);
      setCodeTitle(demoOption === 'calculateAverage' ? 'Calculate Average Function' : 'Data Analyzer Class');
      
      // Set the pre-made notes for the demos
      if (demoOption === 'calculateAverage') {
        setNotes(translateSampleFunction());
        setTranslated(true);
      } else if (demoOption === 'dataAnalyzer') {
        setNotes(translateDataAnalyzerClass());
        setTranslated(true);
      }
      setShowPianoRoll(true);
    } else {
      setTranslated(false);
      setShowPianoRoll(false);
    }
  }, [demoOption]);

  // Handle translation of custom code
  const handleTranslate = () => {
    if (!code.trim()) return;
    
    // Use the CodeHarmonyTranslator to convert code to notes
    const generatedNotes = codeToNotes(code);
    setNotes(generatedNotes);
    setTranslated(true);
    setShowPianoRoll(true);
    
    // Generate a title if none exists
    if (!codeTitle) {
      // Try to extract a meaningful name from the code
      const functionMatch = code.match(/function\s+(\w+)/);
      const classMatch = code.match(/class\s+(\w+)/);
      const varMatch = code.match(/(const|let|var)\s+(\w+)/);
      
      if (functionMatch) {
        setCodeTitle(`${functionMatch[1]} Function`);
      } else if (classMatch) {
        setCodeTitle(`${classMatch[1]} Class`);
      } else if (varMatch) {
        setCodeTitle(`${varMatch[2]} Declaration`);
      } else {
        setCodeTitle(`Code Snippet ${new Date().toLocaleTimeString()}`);
      }
    }
  };

  // Send the notes to the MusicStudio component
  const handleSendToMusicStudio = () => {
    if (notes.length > 0) {
      // Use the prop method if provided
      if (typeof onSendToMusicStudio === 'function') {
        onSendToMusicStudio(notes, codeTitle);
      }
      
      // Also use the global integration method if available
      if (typeof window.importCodeHarmonyToMusicStudio === 'function') {
        window.importCodeHarmonyToMusicStudio(notes, codeTitle || 'Code Harmony');
        // Show a success message
        setStatusMessage('✅ Music sent to MusicStudio for editing and playback!');
        
        // Clear the status message after 5 seconds
        setTimeout(() => {
          setStatusMessage('');
        }, 5000);
      }
    }
  };

  return (
    <div className="code-harmony-container">
      <div className="code-harmony-header">
        <h2>CodeHarmony: Hear Your Code</h2>
        <p>Convert code structures into musical patterns</p>
      </div>
      
      <div className="code-input-section">
        <div className="code-options">
          <label htmlFor="demoSelect">Choose a demo or enter your own code:</label>
          <select 
            id="demoSelect" 
            value={demoOption} 
            onChange={(e) => setDemoOption(e.target.value)}
          >
            {demoOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {!demoOption && (
            <div className="code-title-input">
              <label htmlFor="codeTitle">Title for your code:</label>
              <input 
                type="text" 
                id="codeTitle"
                value={codeTitle}
                onChange={(e) => setCodeTitle(e.target.value)}
                placeholder="Optional title for your code"
              />
            </div>
          )}
        </div>
        
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Enter code to translate into music"
          disabled={!!demoOption}
          className="code-editor"
        />
        
        {!demoOption && (
          <button 
            onClick={handleTranslate} 
            className="translate-button" 
            disabled={!code.trim()}
          >
            Translate to Music
          </button>
        )}
      </div>
      
      {showPianoRoll && (
        <div className="piano-roll-section">
          <h3>{codeTitle || 'Translated Code'}</h3>
          <PianoRoll 
            notes={notes} 
            setNotes={setNotes} 
            width={800}
            height={300}
          />
          <div className="piano-roll-actions">
            <button 
              onClick={handleSendToMusicStudio}
              className="send-to-studio-button"
              disabled={!translated || notes.length === 0}
            >
              🎹 Send to Music Studio
            </button>
          </div>
          {statusMessage && (
            <div className="status-message success">{statusMessage}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeHarmonyChat;
