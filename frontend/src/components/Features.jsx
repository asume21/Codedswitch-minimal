import React from 'react';
import '../App.css';

const FEATURES = [
  {
    icon: '💻',
    title: 'AI Code Translation',
    description: 'Convert Python ↔ JavaScript and more, instantly and accurately with AI-powered translation.',
    details: [
      'Supports Python, JavaScript, Java, C++, and more',
      'Syntax highlighting and formatting',
      'Handles code blocks and full files',
      'Detects and converts idioms and libraries',
    ],
    example: `# Python\ndef greet(name):\n    print(f"Hello, {name}!")\n\n# → JavaScript\nfunction greet(name) {\n  console.log('Hello, ' + name + '!');\n}`
  },
  {
    icon: '🎤',
    title: 'AI Lyric Lab',
    description: 'Generate professional rap lyrics in 7 styles. Get rhyme suggestions and flow analysis.',
    details: [
      'Boom Bap, Trap, Drill, Melodic, and more',
      'Custom topic and style selection',
      'Intelligent rhyme and syllable suggestions',
      'Export and share lyrics',
    ],
    example: `[Hook]\nCodedSwitch, that's the wave\nMaking moves, that's the way\nFrom trap to tech, I'm here to stay\nCodedSwitch, that's the way`
  },
  {
    icon: '🎧',
    title: 'Beat Studio',
    description: 'Create custom AI-generated beats and loops. Preview, mix, and export tracks.',
    details: [
      'AI beat and melody generation',
      'Loop browser and drag-and-drop timeline',
      'Metronome and BPM controls',
      'Export WAV/MP3',
    ],
    example: '🎵 [AI-generated beat preview here]'
  },
  {
    icon: '🤖',
    title: 'AI Assistant',
    description: 'Chat for coding & music advice. Get context-aware suggestions and creative ideas.',
    details: [
      'Ask coding or music questions',
      'AI-powered, context-aware responses',
      'Integrated with all platform features',
    ],
    example: `User: How do I convert a list to a string in Python?\nAssistant: Use ','.join(my_list) to join list elements into a string.`
  },
  {
    icon: '🛡️',
    title: 'Vulnerability Scanner',
    description: 'Detect security issues in your codebase with AI-powered static analysis.',
    details: [
      'Scans Python, JS, and more',
      'Highlights vulnerabilities and suggests fixes',
      'Security status indicators',
      'Easy-to-read reports',
    ],
    example: `def insecure():\n    eval(input())  # ⚠️ Potential code injection!`
  },
];

const Features = () => (
  <section className="features-section">
    <h2 className="features-title">🎯 Complete Feature Overview</h2>
    <div className="features-grid">
      {FEATURES.map((feature, idx) => (
        <div className="feature-card" key={idx}>
          <div className="feature-icon">{feature.icon}</div>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
          <ul>
            {feature.details.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <div className="feature-example">
            <pre>{feature.example}</pre>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Features;
