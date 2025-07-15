import React from 'react';

const SpessaSynthEmbed = () => (
  <div style={{ width: '100%', height: '80vh', border: '2px solid #333', borderRadius: '12px', overflow: 'hidden', background: '#111' }}>
    <iframe
      src="https://spessasus.github.io/SpessaSynth/"
      title="SpessaSynth Web App"
      width="100%"
      height="100%"
      style={{ border: 'none', minHeight: '600px' }}
      allow="autoplay; clipboard-write"
    ></iframe>
  </div>
);

export default SpessaSynthEmbed;
