import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import './CodeBeatStudio.css';

const CodeBeatStudio = () => {
  const [code, setCode] = useState(`// Welcome to CodeBeat Studio! 🎵
// Code your music with simple commands

tempo(120)
key('C minor')

// Drums - X = hit, . = rest
kick:  X . . . X . . .
snare: . . X . . . X .
hihat: X X . X X X . X

// Bass line
bass.note('C2').play([1, 1.5, 3, 3.5])

// Generate your beat!
generate()`);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [parsedPattern, setParsedPattern] = useState(null);
  const [error, setError] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Tone.js instruments
  const kickRef = useRef(null);
  const snareRef = useRef(null);
  const hihatRef = useRef(null);
  const bassRef = useRef(null);

  useEffect(() => {
    // Initialize Tone.js instruments
    kickRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).toDestination();

    snareRef.current = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.0 }
    }).toDestination();

    hihatRef.current = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();

    bassRef.current = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.8 }
    }).toDestination();

    return () => {
      // Cleanup
      if (kickRef.current) kickRef.current.dispose();
      if (snareRef.current) snareRef.current.dispose();
      if (hihatRef.current) hihatRef.current.dispose();
      if (bassRef.current) bassRef.current.dispose();
    };
  }, []);

  const parseCode = (codeText) => {
    try {
      const lines = codeText.split('\n').filter(line => 
        line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('#')
      );
      
      const pattern = {
        tempo: 120,
        key: 'C',
        drums: { kick: [], snare: [], hihat: [] },
        bass: [],
        bars: 1
      };

      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Parse tempo
        if (trimmed.startsWith('tempo(')) {
          const match = trimmed.match(/tempo\((\d+)\)/);
          if (match) pattern.tempo = parseInt(match[1]);
        }
        
        // Parse key
        if (trimmed.startsWith('key(')) {
          const match = trimmed.match(/key\(['"]([^'"]+)['"]\)/);
          if (match) pattern.key = match[1];
        }
        
        // Parse drum patterns
        if (trimmed.includes('kick:')) {
          const patternStr = trimmed.split(':')[1].trim();
          pattern.drums.kick = parsePattern(patternStr);
        }
        
        if (trimmed.includes('snare:')) {
          const patternStr = trimmed.split(':')[1].trim();
          pattern.drums.snare = parsePattern(patternStr);
        }
        
        if (trimmed.includes('hihat:')) {
          const patternStr = trimmed.split(':')[1].trim();
          pattern.drums.hihat = parsePattern(patternStr);
        }
        
        // Parse bass
        if (trimmed.includes('bass.note(')) {
          const noteMatch = trimmed.match(/bass\.note\(['"]([^'"]+)['"]\)/);
          const playMatch = trimmed.match(/\.play\(\[([^\]]+)\]/);
          if (noteMatch && playMatch) {
            const note = noteMatch[1];
            const timings = playMatch[1].split(',').map(t => parseFloat(t.trim()));
            pattern.bass.push({ note, timings });
          }
        }
      });

      return pattern;
    } catch (err) {
      throw new Error(`Parse error: ${err.message}`);
    }
  };

  const parsePattern = (patternStr) => {
    const beats = [];
    const chars = patternStr.replace(/\s/g, '').split('');
    chars.forEach((char, index) => {
      if (char === 'X' || char === 'x') {
        beats.push(index * 0.25); // Each character is a 16th note
      }
    });
    return beats;
  };

  const playPattern = async () => {
    if (!parsedPattern) return;
    
    await Tone.start();
    Tone.Transport.bpm.value = parsedPattern.tempo;
    
    setIsPlaying(true);
    
    // Schedule drum hits
    const scheduleTime = Tone.now();
    
    parsedPattern.drums.kick.forEach(beat => {
      kickRef.current.triggerAttackRelease('C1', '8n', scheduleTime + beat);
    });
    
    parsedPattern.drums.snare.forEach(beat => {
      snareRef.current.triggerAttackRelease('8n', scheduleTime + beat);
    });
    
    parsedPattern.drums.hihat.forEach(beat => {
      hihatRef.current.triggerAttackRelease('C5', '32n', scheduleTime + beat);
    });
    
    // Schedule bass notes
    parsedPattern.bass.forEach(bassLine => {
      bassLine.timings.forEach(timing => {
        bassRef.current.triggerAttackRelease(bassLine.note, '4n', scheduleTime + timing);
      });
    });
    
    // Stop after 4 bars (16 beats at 4/4 time)
    setTimeout(() => {
      setIsPlaying(false);
    }, (16 / (parsedPattern.tempo / 60)) * 1000);
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    setError('');
    
    try {
      const parsed = parseCode(newCode);
      setParsedPattern(parsed);
    } catch (err) {
      setError(err.message);
      setParsedPattern(null);
    }
  };

  const generateAIBeat = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/codebeat-pattern`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          tempo: parsedPattern?.tempo || 120,
          key: parsedPattern?.key || 'C'
        })
      });
      
      const data = await response.json();
      if (data.jobId) {
        // Poll for completion
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/music-file/${data.jobId}`);
            const statusData = await statusResponse.json();
            
            if (statusResponse.ok && statusResponse.headers.get('content-type')?.includes('audio')) {
              // File is ready
              clearInterval(pollInterval);
              setIsGenerating(false);
              
              // Create audio URL and play
              const audioUrl = `${import.meta.env.VITE_BACKEND_URL}/api/music-file/${data.jobId}`;
              const audio = new Audio(audioUrl);
              audio.play();
              
              alert('🎵 Your code pattern has been transformed into music! Playing now...');
            } else if (statusData.status === 'failed') {
              clearInterval(pollInterval);
              setIsGenerating(false);
              alert('Generation failed. Please try again.');
            }
          } catch (pollError) {
            console.error('Polling error:', pollError);
          }
        }, 2000);
        
        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (isGenerating) {
            setIsGenerating(false);
            alert('Generation is taking longer than expected. Please check back later.');
          }
        }, 120000);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      alert('Error generating beat. Please try again.');
    }
  };

  const insertTemplate = (template) => {
    const templates = {
      trap: `tempo(140)
key('C minor')

kick:  X . . . X . . .
snare: . . . . X . . .
hihat: X . X . X . X .

bass.note('C2').play([1, 1.75, 3, 3.75])`,
      
      house: `tempo(128)
key('C major')

kick:  X . . . X . . .
snare: . . X . . . X .
hihat: . X . X . X . X

bass.note('C2').play([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5])`,
      
      hiphop: `tempo(90)
key('G minor')

kick:  X . . X . . X .
snare: . . . . X . . .
hihat: X X . X X . X X

bass.note('G2').play([1, 2.5, 4])`
    };
    
    setCode(templates[template]);
  };

  const codeExamples = [
    { name: 'Trap Beat', key: 'trap' },
    { name: 'House Beat', key: 'house' },
    { name: 'Hip-Hop Beat', key: 'hiphop' }
  ];

  return (
    <div className="codebeat-studio">
      <div className="studio-header">
        <h1>🎵 CodeBeat Studio</h1>
        <p>Code your music with simple, intuitive commands</p>
        <button 
          className="tutorial-btn"
          onClick={() => setShowTutorial(!showTutorial)}
        >
          {showTutorial ? 'Hide Tutorial' : 'Show Tutorial'}
        </button>
      </div>

      {showTutorial && (
        <div className="tutorial-panel">
          <h3>🎓 How to Code Music</h3>
          <div className="tutorial-content">
            <div className="tutorial-section">
              <h4>Basic Commands:</h4>
              <code>tempo(120)</code> - Set BPM<br/>
              <code>key('C minor')</code> - Set musical key
            </div>
            <div className="tutorial-section">
              <h4>Drum Patterns:</h4>
              <code>kick: X . . . X . . .</code><br/>
              <code>snare: . . X . . . X .</code><br/>
              <code>hihat: X X . X X X . X</code><br/>
              <small>X = hit, . = rest (each character = 16th note)</small>
            </div>
            <div className="tutorial-section">
              <h4>Bass Lines:</h4>
              <code>bass.note('C2').play([1, 1.5, 3, 3.5])</code><br/>
              <small>Numbers are beat positions (1 = first beat)</small>
            </div>
          </div>
        </div>
      )}

      <div className="studio-content">
        <div className="code-panel">
          <div className="code-header">
            <h3>💻 Beat Code</h3>
            <div className="template-buttons">
              {codeExamples.map(example => (
                <button
                  key={example.key}
                  className="template-btn"
                  onClick={() => insertTemplate(example.key)}
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
          
          <textarea
            className="code-editor"
            value={code}
            onChange={handleCodeChange}
            placeholder="Start coding your beat..."
            spellCheck={false}
          />
          
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="preview-panel">
          <h3>🎵 Live Preview</h3>
          
          {parsedPattern && (
            <div className="pattern-display">
              <div className="pattern-info">
                <span>Tempo: {parsedPattern.tempo} BPM</span>
                <span>Key: {parsedPattern.key}</span>
              </div>
              
              <div className="drum-patterns">
                <div className="pattern-row">
                  <label>Kick:</label>
                  <div className="pattern-viz">
                    {Array.from({length: 8}, (_, i) => (
                      <div 
                        key={i} 
                        className={`beat ${parsedPattern.drums.kick.includes(i * 0.25) ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="pattern-row">
                  <label>Snare:</label>
                  <div className="pattern-viz">
                    {Array.from({length: 8}, (_, i) => (
                      <div 
                        key={i} 
                        className={`beat ${parsedPattern.drums.snare.includes(i * 0.25) ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="pattern-row">
                  <label>Hi-hat:</label>
                  <div className="pattern-viz">
                    {Array.from({length: 8}, (_, i) => (
                      <div 
                        key={i} 
                        className={`beat ${parsedPattern.drums.hihat.includes(i * 0.25) ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="control-buttons">
            <button
              className={`play-btn ${isPlaying ? 'playing' : ''}`}
              onClick={playPattern}
              disabled={!parsedPattern || isPlaying}
            >
              {isPlaying ? '⏸️ Playing...' : '▶️ Play Pattern'}
            </button>
            
            <button
              className="generate-btn"
              onClick={generateAIBeat}
              disabled={isGenerating || !parsedPattern}
            >
              {isGenerating ? '🎵 Generating...' : '🤖 Generate AI Beat'}
            </button>
          </div>
        </div>
      </div>

      <div className="code-examples">
        <h3>📚 Example Patterns</h3>
        <div className="examples-grid">
          <div className="example-card">
            <h4>Simple 4/4 Beat</h4>
            <pre>{`kick:  X . . . X . . .
snare: . . X . . . X .
hihat: X X X X X X X X`}</pre>
          </div>
          
          <div className="example-card">
            <h4>Syncopated Rhythm</h4>
            <pre>{`kick:  X . . X . . X .
snare: . . . . X . . .
hihat: . X . X . X . X`}</pre>
          </div>
          
          <div className="example-card">
            <h4>Bass Line</h4>
            <pre>{`bass.note('C2').play([1, 1.5, 3])
bass.note('F2').play([2, 4])`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeBeatStudio;
