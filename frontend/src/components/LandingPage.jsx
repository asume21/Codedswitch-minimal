import React, { useState } from 'react';
import './LandingPage.css';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // For MVP, just show a thank you. (Wire up backend/email service later)
    setSubmitted(true);
  };

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <h1>CodedSwitch</h1>
        <h2>The Future of Music, Code, and AI Collaboration</h2>
        <p>
          Create, remix, and innovate with the world’s first AI-powered studio for music makers, coders, and creatives.
        </p>
        {!submitted ? (
          <form className="landing-signup" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email for early access"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit">Notify Me</button>
          </form>
        ) : (
          <div className="landing-thankyou">Thank you for signing up! 🚀</div>
        )}
      </div>
      <div className="landing-features">
        <h3>Why CodedSwitch?</h3>
        <ul>
          <li>🎵 AI-powered beat and melody generation</li>
          <li>📝 AI lyric writing and creative tools</li>
          <li>💻 Code translation, security, and automation</li>
          <li>🌎 Community-driven, human+AI collaboration</li>
        </ul>
      </div>
      <div className="landing-footer">
        <span>© {new Date().getFullYear()} CodedSwitch. All rights reserved.</span>
      </div>
    </div>
  );
};

export default LandingPage;
