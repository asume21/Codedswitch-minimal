import React, { useState, useEffect } from 'react';

// Helper to fetch available BPM folders and loop files from a static manifest
// (for MVP, you can update this to scan dynamically if using a backend)
const fetchLoopManifest = async () => {
  // Hardcoded for MVP; you can automate this with a build script later
  return {
    '95bpm': [
      'E808_Loop_BD_95-01.wav',
      'E808_Loop_BD_95-02.wav',
      'E808_Loop_Hats_95-01.wav',
      'E808_Loop_SD_95-01.wav',
      'E808_Loop_Perc_95-01.wav',
    ],
    '105bpm': [],
    '124bpm': [],
    '132bpm': [],
    '85bpm': [],
  };
};

const LoopBrowser = ({ onAddLoop }) => {
  const [manifest, setManifest] = useState({});
  const [bpm, setBpm] = useState('95bpm');
  const [selectedLoop, setSelectedLoop] = useState('');

  useEffect(() => {
    fetchLoopManifest().then(setManifest);
  }, []);

  useEffect(() => {
    if (manifest[bpm] && manifest[bpm].length > 0) {
      setSelectedLoop(manifest[bpm][0]);
    } else {
      setSelectedLoop('');
    }
  }, [bpm, manifest]);

  return (
    <div className="loop-browser">
      <label>
        BPM:
        <select value={bpm} onChange={e => setBpm(e.target.value)}>
          {Object.keys(manifest).map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </label>
      <label>
        Loop:
        <select
          value={selectedLoop}
          onChange={e => setSelectedLoop(e.target.value)}
          disabled={!manifest[bpm] || manifest[bpm].length === 0}
        >
          {(manifest[bpm] || []).map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </label>
      <button
        onClick={() => selectedLoop && onAddLoop({ bpm, filename: selectedLoop })}
        disabled={!selectedLoop}
      >
        Add Loop to Track
      </button>
    </div>
  );
};

export default LoopBrowser;
