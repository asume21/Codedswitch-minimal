import React, { useState, useRef, useEffect } from 'react'
import './ChatBot.css'
import { codeToNotes } from '../utils/CodeHarmonyTranslator';

const ChatBot = ({ startOpen = false, showToggle = true }) => {
  const [open, setOpen] = useState(startOpen);
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I\'m your CodedSwitch assistant. How can I help?' }
  ])
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [showMusicOption, setShowMusicOption] = useState(false);
  const [codeToTranslate, setCodeToTranslate] = useState('');
  const [translatingMusic, setTranslatingMusic] = useState(false);
  const [musicTranslationMessage, setMusicTranslationMessage] = useState(null);

  const toggle = () => setOpen(!open)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(scrollToBottom, [messages])

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Check if it's a code-to-music translation request
    const lowerInput = userMsg.text.toLowerCase();
    if ((lowerInput.includes('translate') || lowerInput.includes('convert') || lowerInput.includes('transform')) && 
        (lowerInput.includes('code') || lowerInput.includes('function') || lowerInput.includes('class')) && 
        (lowerInput.includes('music') || lowerInput.includes('sound') || lowerInput.includes('melody') || lowerInput.includes('tune'))) {
      
      // Look for code block in previous messages
      let foundCode = false;
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.sender === 'user') {
          const codeMatch = msg.text.match(/```([\s\S]+?)```/) || 
                          msg.text.match(/`([\s\S]+?)`/) ||
                          msg.text.match(/(function|class|def|var|let|const)[\s\S]+?[;{}]/g);
          
          if (codeMatch) {
            setCodeToTranslate(codeMatch[1] || codeMatch[0]);
            foundCode = true;
            setShowMusicOption(true);
            
            const botMsg = { 
              sender: 'bot', 
              text: 'I found some code in our conversation. Would you like me to translate it to music?',
              showMusicButton: true
            };
            setMessages(prev => [...prev, botMsg]);
            setLoading(false);
            return;
          }
        }
      }
      
      if (!foundCode) {
        const botMsg = { 
          sender: 'bot', 
          text: "I'd be happy to translate code to music! Please share the code snippet you want to convert, ideally wrapped in triple backticks like ```code here```."
        };
        setMessages(prev => [...prev, botMsg]);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000'}/api/ai`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': localStorage.getItem('apiKey') || ''
        },
        body: JSON.stringify({
          prompt: userMsg.text,
          provider: import.meta.env.VITE_DEFAULT_AI_PROVIDER
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI request failed');
      const botMsg = { sender: 'bot', text: data.response };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const botMsg = { sender: 'bot', text: `Error: ${err.message}` };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const generateDemoResponse = (prompt) => {
    const lower = prompt.toLowerCase()
    if (lower.includes('optimize')) {
      return 'Consider memoization or using a cache for repeated calls.'
    }
    if (lower.includes('hello') || lower.includes('hi')) {
      return 'Hey there! 👋 How can I assist you today?'
    }
    return "That's interesting! I\'ll have more insights soon."
  }
  // Handle translation to music
  const handleTranslateToMusic = () => {
    // Hide the music option button
    setShowMusicOption(false);
    
    // Set translating state
    setTranslatingMusic(true);
    
    // Add a message indicating translation is happening
    const processingMsg = { 
      sender: 'bot', 
      text: 'Translating your code to music...' 
    };
    setMessages(prev => [...prev, processingMsg]);
    
    try {
      // Use the CodeHarmonyTranslator to translate the code
      const notes = codeToNotes(codeToTranslate);
      
      // Success message to display in chat
      const successMsg = {
        sender: 'bot',
        text: '✅ Code successfully translated to music! Sent to both CodeTranslator and MusicStudio for editing.'
      };
      setMessages(prev => [...prev, successMsg]);
      
      // If there's a global handler for sending to CodeTranslator (set up by parent app)
      if (typeof window.sendToCodeTranslator === 'function') {
        window.sendToCodeTranslator(notes, 'Code from ChatBot');
      }
      
      // Add new handler for MusicStudio integration
      if (typeof window.importCodeHarmonyToMusicStudio === 'function') {
        window.importCodeHarmonyToMusicStudio(notes, 'Code from ChatBot');
      }
      
    } catch (error) {
      console.error('Error translating code to music:', error);
      
      // Error message to display in chat
      const errorMsg = {
        sender: 'bot',
        text: `Failed to translate code to music: ${error.message || 'Unknown error'}. Try a different code snippet.`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setTranslatingMusic(false);
    }
  };

  return (
    <>
      {showToggle && (
        <button className="chatbot-toggle" onClick={toggle} aria-label="Open chat bot">
        💬
      </button>
      )}
      {open && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <span>AI Assistant</span>
            <button className="chatbot-close" onClick={toggle} aria-label="Close chat bot">✖</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg ${msg.sender}`}>
                {msg.text}
                {msg.showMusicButton && showMusicOption && (
                  <div className="chat-msg-actions">
                    <button 
                      className="translate-music-btn" 
                      onClick={handleTranslateToMusic}
                    >
                      🎵 Translate to Music
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot
