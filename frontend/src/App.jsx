import React, { useState, useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import ChatBot from './components/ChatBot'
import AnimatedLogo from './components/AnimatedLogo'
import FeatureCarousel from './components/FeatureCarousel'
import SettingsDropdown from './components/SettingsDropdown'
import Diagnostics from './components/Diagnostics'
// lazy loaded below

import Pricing from './components/Pricing'
import Success from './components/Success'
import About from './components/About'
import Features from './components/Features'


// Dynamic imports for heavy pages
const LyricLab = React.lazy(() => import('./components/LyricLab'))
const CodeTranslator = React.lazy(() => import('./components/CodeTranslator'))
const BeatStudio = React.lazy(() => import('./components/BeatStudio'))
const MusicStudio = React.lazy(() => import('./components/MusicStudio'))
const CodeBeatStudio = React.lazy(() => import('./components/CodeBeatStudio'))
const Assistant = React.lazy(() => import('./components/Assistant'))
const VulnerabilityScanner = React.lazy(() => import('./components/VulnerabilityScanner'))
const AdminPanel = React.lazy(() => import('./components/AdminPanel'))
const SpessaSynthEmbed = React.lazy(() => import('./components/SpessaSynthEmbed'));
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const GeminiAITools = React.lazy(() => import('./components/GeminiAITools'));

function AppContent() {
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [userPlan, setUserPlan] = useState('free'); // Track user subscription
  const navigate = useNavigate();
  const location = useLocation();

  // SEO: page titles & descriptions
  const metaMap = {
    '/': {
      title: 'CodedSwitch | AI Coding Rapper Platform',
      description: 'Revolutionary triple-entendre platform combining AI code translation, intelligent lyric generation and seamless mode switching.'
    },
    '/about': {
      title: 'About | CodedSwitch',
      description: 'Learn how CodedSwitch fuses programming, music and AI to empower creators worldwide.'
    },
    '/pricing': {
      title: 'Pricing | CodedSwitch',
      description: 'Choose a plan and unlock the full potential of AI-powered code translation and music creation.'
    },
    '/lyric-lab': {
      title: 'Lyric Lab | CodedSwitch',
      description: 'Generate professional rap lyrics in 7 different styles powered by AI.'
    },
    '/code-translator': {
      title: 'Code Translator | CodedSwitch',
      description: 'Instantly translate source code between programming languages with AI.'
    },
    '/beat-studio': {
      title: 'Beat Studio | CodedSwitch',
      description: 'Create custom AI-generated beats and loops directly in your browser.'
    },
    '/music-studio': {
      title: 'Music Studio | CodedSwitch',
      description: 'Mix multitrack sessions and produce full songs with AI-powered tools.'
    },
    '/assistant': {
      title: 'AI Assistant | CodedSwitch',
      description: 'Chat with your personal AI assistant for coding and music production help.'
    },
    '/vulnerability-scanner': {
      title: 'Vulnerability Scanner | CodedSwitch',
      description: 'Analyze your codebase for security vulnerabilities with AI.'
    },
    '/codebeat-studio': {
      title: 'CodeBeat Studio | CodedSwitch',
      description: 'Code your music with intuitive commands - where programming meets beat making.'
    },
    '/gemini-ai': {
      title: 'Gemini AI Tools | CodedSwitch',
      description: 'Access powerful AI tools for text and code generation powered by Google\'s Gemini AI.'
    }
  };

  useEffect(() => {
    const meta = metaMap[location.pathname] || metaMap['/'];
    if (meta) {
      document.title = meta.title;
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', meta.description);
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch('./pricing.json');
      if (!response.ok) throw new Error('Failed to fetch pricing');
      const data = await response.json();
      setPricingPlans(data.plans);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const handlePayment = async (plan) => {
    if (!plan || !plan.price) {
      console.error('Invalid plan details');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price })
      });
      if (!response.ok) throw new Error('Payment request failed');
      await response.json();

      // Simulate payment success for demo
      setTimeout(() => {
        setPaymentStatus('success');
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
    }
  };

  const downloadApp = () => {
    const link = document.createElement('a');
    link.href = '#'; // Change to valid download URL
    link.download = 'CodedSwitch.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <AnimatedLogo size={48} />
          </div>
          <button
            className="nav-toggle"
            onClick={() => setNavOpen(!navOpen)}
          >
            &#9776;
          </button>
          <div className={`nav-menu ${navOpen ? 'open' : ''}`}>
            <button
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              Home
            </button>
            <button
              className={`nav-link ${isActive('/about') ? 'active' : ''}`}
              onClick={() => navigate('/about')}
            >
              About
            </button>
            <button
              className={`nav-link ${isActive('/features') ? 'active' : ''}`}
              onClick={() => navigate('/features')}
            >
              Features
            </button>
            <button
              className={`nav-link ${isActive('/pricing') ? 'active' : ''}`}
              onClick={() => navigate('/pricing')}
            >
              Pricing
            </button>
            <button
              className={`nav-link ${isActive('/code-translator') ? 'active' : ''}`}
              onClick={() => navigate('/code-translator')}
            >
              Code Translator
            </button>
            <button
              className={`nav-link ${isActive('/gemini-ai') ? 'active' : ''}`}
              onClick={() => navigate('/gemini-ai')}
            >
              Gemini AI
            </button>
            <button
              className={`nav-link ${isActive('/lyric-lab') ? 'active' : ''}`}
              onClick={() => navigate('/lyric-lab')}
            >
              Lyric Lab
            </button>
            <button
              className={`nav-link ${isActive('/beat-studio') ? 'active' : ''}`}
              onClick={() => navigate('/beat-studio')}
            >
              Beat Studio
            </button>
            <button
              className={`nav-link ${isActive('/music-studio') ? 'active' : ''}`}
              onClick={() => navigate('/music-studio')}
            >
              Music Studio
            </button>
            <button
              className={`nav-link ${isActive('/codebeat-studio') ? 'active' : ''}`}
              onClick={() => navigate('/codebeat-studio')}
            >
              CodeBeat Studio
            </button>
            <button
              className={`nav-link ${isActive('/assistant') ? 'active' : ''}`}
              onClick={() => navigate('/assistant')}
            >
              AI Assistant
            </button>
            <button
              className={`nav-link ${isActive('/vulnerability-scanner') ? 'active' : ''}`}
              onClick={() => navigate('/vulnerability-scanner')}
            >
              Vulnerability Scanner
            </button>
            <button
              className={`nav-link ${isActive('/diagnostics') ? 'active' : ''}`}
              onClick={() => navigate('/diagnostics')}
            >
              Diagnostics
            </button>
            <div className="nav-settings">
              <SettingsDropdown />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          {/* Landing page for new visitors */}
          <Route path="/" element={<LandingPage />} />

          {/* Main homepage at /home (was previously at /) */}
          <Route path="/home" element={
            <div className="hero-section">
              <div className="hero-content">
                <div className="coded-logo">
                  <AnimatedLogo size={200} />
                </div>
                <h1 className="hero-title">
                  🎤 CodedSwitch
                  <span className="hero-subtitle">The World's First AI Coding Rapper Platform</span>
                </h1>
                <p className="hero-description">
                  Revolutionary triple entendre platform combining AI code translation, 
                  intelligent lyric generation, and seamless mode switching.
                </p>
                <div className="hero-buttons">
                  <button className="btn-primary" onClick={() => navigate('/features')}>
                    Explore Features
                  </button>
                  <button className="btn-secondary" onClick={() => navigate('/pricing')}>
                    Get Started
                  </button>
                </div>
              </div>
              <div className="hero-visual">
                <div className="platform-preview">
                  <FeatureCarousel />
                </div>
              </div>
            </div>
          } />

          {/* About and Features */}
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<React.Suspense fallback={<div>Loading Features…</div>}><Features /></React.Suspense>} />

          {/* Product/feature routes */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/code-translator" element={<div className="code-translator-section"><CodeTranslator userSubscription={{ plan: userPlan }} /></div>} />
          <Route path="/gemini-ai" element={
            <Suspense fallback={<div>Loading Gemini AI Tools...</div>}>
              <GeminiAITools />
            </Suspense>
          } />
          <Route path="/lyric-lab" element={<div className="lyric-lab-section"><LyricLab userPlan={userPlan} onUsageUpdate={(usage) => {console.log('Lyric usage updated:', usage);}} /></div>} />
          <Route path="/beat-studio" element={<BeatStudio />} />
          <Route path="/music-studio" element={
            <Suspense fallback={<div>Loading...</div>}>
              <MusicStudio />
            </Suspense>
          } />
          <Route path="/codebeat-studio" element={<CodeBeatStudio />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/vulnerability-scanner" element={<VulnerabilityScanner />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/spessasynth" element={<SpessaSynthEmbed />} />
          <Route path="/success" element={<Success />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🚀 CodedSwitch</h4>
            <p>The world's first AI coding rapper platform</p>
          </div>
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li>AI Code Translation</li>
              <li>Lyric Generation</li>
              <li>Beat Analysis</li>
              <li>Security Scanning</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li>Documentation</li>
              <li>API Reference</li>
              <li>Community</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 CodedSwitch. The future of creative coding and music production.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  useEffect(() => {
    import('./components/LyricLab');
    import('./components/CodeTranslator');
    import('./components/BeatStudio');
    import('./components/MusicStudio');
    import('./components/Assistant');
    import('./components/VulnerabilityScanner');
    import('./components/SpessaSynthEmbed');
  }, []);
  return (
    <Router>
      <Suspense fallback={<div className="loading">Loading...</div>}>
        <AppContent />
        <ChatBot />
      </Suspense>
    </Router>
  );
}

export default App;