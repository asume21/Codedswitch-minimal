import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './FeatureCarousel.css'

const features = [
  {
    icon: '💻',
    title: 'Code Translation',
    desc: 'Convert Python → JavaScript in seconds',
    route: '/code-translator'
  },
  {
    icon: '🎤',
    title: 'Lyric Lab',
    desc: 'Generate rap lyrics with AI',
    route: '/lyric-lab'
  },
  {
    icon: '🎧',
    title: 'Beat Studio',
    desc: 'Create custom AI-generated beats',
    route: '/beat-studio'
  },
  {
    icon: '🤖',
    title: 'AI Assistant',
    desc: 'Chat for coding & music advice',
    route: '/assistant'
  },
  {
    icon: '🛡️',
    title: 'Vulnerability Scanner',
    desc: 'Detect security issues in code',
    route: '/vulnerability-scanner'
  }
]

const FeatureCarousel = () => {
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % features.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const current = features[index]

  return (
    <div className="feature-carousel" onClick={() => navigate(current.route)}>
      <div className="feature-icon">{current.icon}</div>
      <h3 className="feature-title">{current.title}</h3>
      <p className="feature-desc">{current.desc}</p>
      <p className="feature-hint">Click to explore</p>
    </div>
  )
}

export default FeatureCarousel
