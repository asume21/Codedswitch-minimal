import React, { useState, useEffect } from 'react';
import './CodeTranslator.css';
import PianoRoll from './PianoRoll';
import { codeToNotes, translateSampleFunction, translateDataAnalyzerClass } from '../utils/CodeHarmonyTranslator';

const CodeTranslator = ({ userSubscription }) => {
  const [sourceCode, setSourceCode] = useState('');
  const [translatedCode, setTranslatedCode] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('python');
  const [targetLanguage, setTargetLanguage] = useState('javascript');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationHistory, setTranslationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // CodeHarmony music translation states
  const [pianoRollNotes, setPianoRollNotes] = useState([]);
  const [showPianoRoll, setShowPianoRoll] = useState(false);

  const supportedLanguages = [
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'javascript', name: 'JavaScript', icon: '⚡' },
    { id: 'java', name: 'Java', icon: '☕' },
    { id: 'cpp', name: 'C++', icon: '⚙️' },
    { id: 'php', name: 'PHP', icon: '🐘' },
    { id: 'csharp', name: 'C#', icon: '🎯' },
    { id: 'ruby', name: 'Ruby', icon: '💎' },
    { id: 'go', name: 'Go', icon: '🚀' },
    { id: 'rust', name: 'Rust', icon: '🦀' },
    { id: 'swift', name: 'Swift', icon: '🍎' },
    { id: 'music', name: 'Music', icon: '🎵' } // CodeHarmony option
  ];

  const codeExamples = {
    python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Calculate first 10 Fibonacci numbers
for i in range(10):
    print(fibonacci(i))`,
    
    javascript: `function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Calculate first 10 Fibonacci numbers
for (let i = 0; i < 10; i++) {
    console.log(fibonacci(i));
}`,
    
    java: `public class Fibonacci {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    public static void main(String[] args) {
        // Calculate first 10 Fibonacci numbers
        for (int i = 0; i < 10; i++) {
            System.out.println(fibonacci(i));
        }
    }
}`
  };

  useEffect(() => {
    // Load example code when language changes
    if (codeExamples[sourceLanguage]) {
      setSourceCode(codeExamples[sourceLanguage]);
    }
  }, [sourceLanguage]);

  const handleMusicRefresh = () => {
    if (sourceLanguage && sourceCode) {
      const notes = codeToNotes(sourceCode);
      setPianoRollNotes(notes);
    }
  };

  // Send the current music notes to MusicStudio
  const sendToMusicStudio = () => {
    if (pianoRollNotes && pianoRollNotes.length > 0 && typeof window.importCodeHarmonyToMusicStudio === 'function') {
      window.importCodeHarmonyToMusicStudio(pianoRollNotes, 'Code from Translator');
      setStatusMessage('✅ Music successfully sent to MusicStudio for editing and playback!');
      
      // Clear the status message after 5 seconds
      setTimeout(() => {
        setStatusMessage('');
      }, 5000);
    }
  };

  const translateCode = async () => {
    if (!sourceCode.trim()) {
      alert('Please enter some code to translate!');
      return;
    }

    setIsTranslating(true);
    setShowPianoRoll(false); // Reset piano roll visibility
    
    // Handle music translation (CodeHarmony)
    if (targetLanguage === 'music') {
      try {
        // Use the local CodeHarmonyTranslator to convert code to notes
        const musicNotes = codeToNotes(sourceCode);
        setPianoRollNotes(musicNotes);
        
        // Set a message in the text area
        setTranslatedCode('Your code has been translated to music! \n\nSee the piano roll below to view and play the musical representation of your code structure.');
        
        // Show the piano roll
        setShowPianoRoll(true);
        
        // Add to history
        const newEntry = {
          id: Date.now(),
          sourceLanguage,
          targetLanguage: 'music',
          sourceCode,
          translatedCode: 'Music Translation',
          timestamp: new Date().toISOString()
        };
        setTranslationHistory(prev => [newEntry, ...prev.slice(0, 9)]);
        
      } catch (error) {
        console.error('Error translating code to music:', error);
        setTranslatedCode('Error translating code to music. Please try a simpler code snippet.');
      } finally {
        setIsTranslating(false);
      }
      return;
    }
    
    // Standard code-to-code translation
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000'}/api/translate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': localStorage.getItem('apiKey') || ''
        },
        body: JSON.stringify({
          sourceCode,
          sourceLanguage,
          targetLanguage,
          userId: 'anonymous'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTranslatedCode(data.translatedCode);
        
        // Add to history
        const newEntry = {
          id: Date.now(),
          sourceLanguage,
          targetLanguage,
          sourceCode,
          translatedCode: data.translatedCode,
          timestamp: new Date().toISOString()
        };
        setTranslationHistory(prev => [newEntry, ...prev.slice(0, 9)]); // Keep last 10
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Error translating code:', error);
      // Fallback to demo translation
      setTranslatedCode(generateDemoTranslation());
    } finally {
      setIsTranslating(false);
    }
  };

  const generateDemoTranslation = () => {
    const translations = {
      'python-javascript': `function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Calculate first 10 Fibonacci numbers
for (let i = 0; i < 10; i++) {
    console.log(fibonacci(i));
}`,
      'javascript-python': `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Calculate first 10 Fibonacci numbers
for i in range(10):
    print(fibonacci(i))`,
      'python-java': `public class Fibonacci {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    public static void main(String[] args) {
        // Calculate first 10 Fibonacci numbers
        for (int i = 0; i < 10; i++) {
            System.out.println(fibonacci(i));
        }
    }
}`
    };
    
    const key = `${sourceLanguage}-${targetLanguage}`;
    return translations[key] || `// Translation from ${sourceLanguage} to ${targetLanguage}\n// Demo translation - connect to AI service for real translation\n\n${sourceCode}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Code copied to clipboard!');
  };

  const downloadCode = (code, filename) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceCode(translatedCode);
    setTranslatedCode('');
  };

  return (
    <div className="code-translator">
      <div className="translator-header">
        <h2>💻 AI Code Translator</h2>
        <p>Translate code between 10+ programming languages with AI intelligence</p>
      </div>

      <div className="language-selector">
        <div className="language-group">
          <label>From:</label>
          <select 
            value={sourceLanguage} 
            onChange={(e) => setSourceLanguage(e.target.value)}
            className="language-select"
            id="from-language-selector"
            name="fromLanguage"
            aria-label="Select source programming language"
            title="Choose source language"
          >
            {supportedLanguages.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.icon} {lang.name}
              </option>
            ))}
          </select>
        </div>

        <button className="swap-btn" onClick={swapLanguages}>
          🔄
        </button>

        <div className="language-group">
          <label>To:</label>
          <select 
            value={targetLanguage} 
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="language-select"
            id="to-language-selector"
            name="toLanguage"
            aria-label="Select target programming language"
            title="Choose target language"
          >
            {supportedLanguages.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.icon} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="code-editor-container">
        <div className="code-editor">
          <div className="editor-header">
            <span>{supportedLanguages.find(l => l.id === sourceLanguage)?.icon} {supportedLanguages.find(l => l.id === sourceLanguage)?.name}</span>
            <div className="editor-actions">
              <button onClick={() => copyToClipboard(sourceCode)} className="action-btn">
                📋 Copy
              </button>
              <button onClick={() => downloadCode(sourceCode, `source.${sourceLanguage}`)} className="action-btn">
                💾 Download
              </button>
            </div>
          </div>
          <textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            placeholder={`Enter your ${supportedLanguages.find(l => l.id === sourceLanguage)?.name} code here...`}
            className="code-textarea"
          />
        </div>

        <div className="translate-button-container">
          <button 
            className="translate-btn"
            onClick={translateCode}
            disabled={isTranslating || !sourceCode.trim()}
          >
            {isTranslating ? '🔄 Translating...' : targetLanguage === 'music' ? '🎵 Translate to Music' : '🚀 Translate'}
          </button>
          {targetLanguage === 'music' && (
            <div className="harmony-info">
              CodeHarmony: Hear your code as musical patterns
            </div>
          )}
        </div>

        <div className="code-editor">
          <div className="editor-header">
            <span>{supportedLanguages.find(l => l.id === targetLanguage)?.icon} {supportedLanguages.find(l => l.id === targetLanguage)?.name}</span>
            <div className="editor-actions">
              {targetLanguage !== 'music' && (
                <>
                  <button onClick={() => copyToClipboard(translatedCode)} className="action-btn">
                    📋 Copy
                  </button>
                  <button onClick={() => downloadCode(translatedCode, `translated.${targetLanguage}`)} className="action-btn">
                    💾 Download
                  </button>
                </>
              )}
              {targetLanguage === 'music' && (
                <div className="music-actions">
                  <span className="action-label">🎵 CodeHarmony</span>
                </div>
              )}
            </div>
          </div>
          <textarea
            value={translatedCode}
            readOnly
            placeholder={targetLanguage === 'music' ? 
              "Translate your code to music patterns..." : 
              "Translated code will appear here..."}
            className="code-textarea"
          />
        </div>
      </div>
      
      {/* Piano Roll for Music Translation */}
      {showPianoRoll && targetLanguage === 'music' && (
        <div className="piano-roll-container">
          <h3>Code as Music - Piano Roll Visualization</h3>
          <div className="piano-roll-wrapper">
            <PianoRoll 
              notes={pianoRollNotes} 
              setNotes={setPianoRollNotes} 
              width={800}
              height={300}
            />
          </div>
          <div className="piano-roll-actions">
            <button 
              onClick={() => {
                // Use sample functions if available
                if (sourceCode.includes('calculate_average')) {
                  setPianoRollNotes(translateSampleFunction());
                } else if (sourceCode.includes('DataAnalyzer')) {
                  setPianoRollNotes(translateDataAnalyzerClass());
                } else {
                  // Re-translate with current algorithm
                  setPianoRollNotes(codeToNotes(sourceCode));
                }
              }}
              className="refresh-btn"
            >
              🔄 Refresh Notes
            </button>
            <button
              onClick={sendToMusicStudio}
              className="send-to-studio-btn"
              title="Send these notes to the Music Studio for editing and playback"
            >
              🎹 Send to Music Studio
            </button>
          </div>
          {statusMessage && (
            <div className="status-message success">{statusMessage}</div>
          )}
          <div className="piano-roll-description">
            <p><strong>How to read this:</strong> Each code element is mapped to musical notes. 
            Function declarations create distinctive melodic phrases, variables map to individual notes, 
            and control structures like loops and conditionals create unique patterns.</p>
            <p>Play the notes to hear how your code sounds as music!</p>
            <div className="codeharmony-branding">
              <span>Part of the </span>
              <a href="/codeharmony" target="_blank" rel="noopener noreferrer">CodeHarmony Project</a>
              <span> - Experiencing code through sound</span>
            </div>
          </div>
        </div>
      )}

      <div className="translator-footer">
        <button 
          className="history-btn"
          onClick={() => setShowHistory(!showHistory)}
        >
          📚 Translation History
        </button>
        
        {userSubscription?.plan === 'free' && (
          <div className="upgrade-notice">
            <p>💡 Upgrade to Pro for unlimited translations and advanced features!</p>
            <button 
              className="upgrade-btn"
              onClick={() => window.location.href = '/pricing'}
            >
              Upgrade Now
            </button>
          </div>
        )}
      </div>

      {showHistory && translationHistory.length > 0 && (
        <div className="translation-history">
          <h3>Recent Translations</h3>
          <div className="history-list">
            {translationHistory.map(entry => (
              <div key={entry.id} className="history-item">
                <div className="history-header">
                  <span>{supportedLanguages.find(l => l.id === entry.sourceLanguage)?.icon} → {supportedLanguages.find(l => l.id === entry.targetLanguage)?.icon}</span>
                  <span className="history-time">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="history-preview">
                  <pre>{entry.sourceCode.substring(0, 100)}...</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Add CodeHarmony styles
const styles = document.createElement('style');
styles.textContent = `
  .piano-roll-container {
    margin-top: 20px;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #ddd;
  }
  
  .piano-roll-description {
    margin-top: 15px;
    padding: 10px;
    background-color: #fff;
    border-radius: 6px;
    border: 1px solid #eee;
  }
  
  .harmony-info {
    font-size: 14px;
    color: #666;
    text-align: center;
    margin-top: 5px;
  }
  
  .codeharmony-branding {
    margin-top: 15px;
    font-size: 14px;
    color: #555;
    text-align: right;
  }
  
  .codeharmony-branding a {
    color: #4a90e2;
    text-decoration: none;
    font-weight: bold;
  }
  
  .piano-roll-actions {
    margin: 15px 0;
    display: flex;
    justify-content: center;
  }
  
  .piano-roll-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .refresh-btn {
    background-color: #6c5ce7;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
  }
  
  .refresh-btn:hover {
    background-color: #5f48e0;
  }
  
  .send-to-studio-btn {
    background-color: #4a90e2;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .send-to-studio-btn:hover {
    background-color: #357bd8;
  }
  
  .status-message {
    margin-top: 10px;
    padding: 10px;
    border-radius: 4px;
    text-align: center;
    font-weight: 500;
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .status-message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styles);

export default CodeTranslator;