import React, { useState } from 'react';
import './Assistant.css';

const Assistant = () => {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000'}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          provider: import.meta.env.VITE_DEFAULT_AI_PROVIDER
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI request failed');
      setReply(data.response);
    } catch (err) {
      setReply(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="assistant-page">
      <h1 className="assistant-title">🤖 AI Assistant</h1>
      <p className="assistant-description">
        Ask coding or music-production questions and get context-aware answers powered by AI.
      </p>
      <div className="assistant-interface">
        <textarea
          rows={4}
          placeholder="Type your question..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? 'Loading...' : 'Send'}
        </button>
      </div>
      {reply && (
        <div className="assistant-response">
          <h3>Response:</h3>
          <pre>{reply}</pre>
        </div>
      )}
    </div>
  );
}

export default Assistant
