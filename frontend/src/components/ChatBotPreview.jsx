import React from 'react'
import './ChatBot.css'

// Static ChatBot preview for homepage hero section
const ChatBotPreview = () => (
  <div className="chatbot-container preview">
    <div className="chatbot-header">
      <span>AI Assistant</span>
    </div>
    <div className="chatbot-messages">
      <p className="placeholder-msg">Ask me anything about CodedSwitch!</p>
    </div>
    <div className="chatbot-input">
      <input type="text" placeholder="Type a message..." disabled />
      <button disabled>Send</button>
    </div>
  </div>
)

export default ChatBotPreview
