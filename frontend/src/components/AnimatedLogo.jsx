import React from 'react'
import './AnimatedLogo.css'

const AnimatedLogo = ({ size = 120 }) => (
  <div className="logo-animation" style={{ width: size, height: size }}>
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Eye */}
      <path className="draw-path" d="M5 20 Q20 5 35 20 Q20 35 5 20 Z" />
      {/* Inner pupil */}
      <circle className="draw-path" cx="20" cy="20" r="3" />
      {/* Corner circles */}
      <circle className="draw-path" cx="31" cy="8" r="3" />
      <circle className="draw-path" cx="9" cy="32" r="3" />
      {/* Connecting lines */}
      <line className="draw-path" x1="17" y1="6" x2="28" y2="6" />
      <line className="draw-path" x1="12" y1="34" x2="23" y2="34" />
    </svg>
  </div>
)

export default AnimatedLogo
