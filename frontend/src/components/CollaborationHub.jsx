import React, { useState, useEffect } from 'react';

const CollaborationHub = () => {
  const [activeRooms, setActiveRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const createRoom = async (roomName, roomType = 'music') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/collaboration/create-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': localStorage.getItem('apiKey') || ''
        },
        body: JSON.stringify({
          name: roomName,
          type: roomType,
          maxParticipants: 8
        })
      });
      
      if (response.ok) {
        const room = await response.json();
        setActiveRooms(prev => [...prev, room]);
        return room;
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const joinRoom = async (roomId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/collaboration/join-room/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': localStorage.getItem('apiKey') || ''
        }
      });
      
      if (response.ok) {
        const room = await response.json();
        setCurrentRoom(room);
        setIsConnected(true);
        return room;
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <div className="collaboration-hub">
      <div className="hub-header">
        <h2>🤝 Collaboration Hub</h2>
        <p>Create music together in real-time</p>
      </div>
      
      {!currentRoom ? (
        <div className="room-browser">
          <div className="create-room-section">
            <h3>Create New Room</h3>
            <div className="room-creation">
              <input
                type="text"
                placeholder="Room name..."
                className="room-name-input"
              />
              <select className="room-type-select">
                <option value="music">Music Production</option>
                <option value="lyrics">Lyric Writing</option>
                <option value="beats">Beat Making</option>
                <option value="mixing">Mixing Session</option>
              </select>
              <button 
                className="create-room-btn"
                onClick={() => createRoom('New Room', 'music')}
              >
                Create Room
              </button>
            </div>
          </div>
          
          <div className="active-rooms-section">
            <h3>Active Rooms</h3>
            <div className="rooms-list">
              {activeRooms.length === 0 ? (
                <div className="no-rooms">
                  <p>No active rooms. Create one to get started!</p>
                </div>
              ) : (
                activeRooms.map(room => (
                  <div key={room.id} className="room-card">
                    <div className="room-info">
                      <h4>{room.name}</h4>
                      <p>{room.type} • {room.participants}/{room.maxParticipants} participants</p>
                    </div>
                    <button 
                      className="join-room-btn"
                      onClick={() => joinRoom(room.id)}
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="active-room">
          <div className="room-header">
            <h3>🎵 {currentRoom.name}</h3>
            <div className="room-controls">
              <span className="participant-count">
                👥 {currentRoom.participants} participants
              </span>
              <button 
                className="leave-room-btn"
                onClick={() => {
                  setCurrentRoom(null);
                  setIsConnected(false);
                }}
              >
                Leave Room
              </button>
            </div>
          </div>
          
          <div className="collaboration-workspace">
            <div className="shared-canvas">
              <h4>Shared Workspace</h4>
              <div className="canvas-placeholder">
                <p>Real-time collaboration features coming soon!</p>
                <ul>
                  <li>🎹 Shared piano roll editing</li>
                  <li>🥁 Collaborative beat making</li>
                  <li>🎤 Live lyric writing</li>
                  <li>💬 Voice chat integration</li>
                  <li>📁 Project file sharing</li>
                </ul>
              </div>
            </div>
            
            <div className="participants-panel">
              <h4>Participants</h4>
              <div className="participants-list">
                <div className="participant">
                  <span className="participant-avatar">👤</span>
                  <span className="participant-name">You</span>
                  <span className="participant-role">Host</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .collaboration-hub {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 20px;
          color: white;
        }
        
        .hub-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .hub-header h2 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(45deg, #4ecdc4, #45b7d1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .room-browser {
          display: grid;
          gap: 2rem;
        }
        
        .create-room-section, .active-rooms-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
        }
        
        .create-room-section h3, .active-rooms-section h3 {
          color: #4ecdc4;
          margin-bottom: 1rem;
        }
        
        .room-creation {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .room-name-input, .room-type-select {
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: white;
          font-size: 1rem;
        }
        
        .room-name-input {
          flex: 1;
          min-width: 200px;
        }
        
        .room-type-select {
          min-width: 150px;
        }
        
        .create-room-btn {
          background: linear-gradient(45deg, #4ecdc4, #45b7d1);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .create-room-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
        }
        
        .rooms-list {
          display: grid;
          gap: 1rem;
        }
        
        .no-rooms {
          text-align: center;
          padding: 2rem;
          color: #888;
        }
        
        .room-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .room-card:hover {
          border-color: #4ecdc4;
          transform: translateY(-2px);
        }
        
        .room-info h4 {
          margin: 0 0 0.25rem 0;
          color: white;
        }
        
        .room-info p {
          margin: 0;
          color: #888;
          font-size: 0.9rem;
        }
        
        .join-room-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .join-room-btn:hover {
          background: rgba(78, 205, 196, 0.2);
          border-color: #4ecdc4;
        }
        
        .active-room {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
        }
        
        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .room-header h3 {
          margin: 0;
          color: #4ecdc4;
        }
        
        .room-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .participant-count {
          color: #888;
          font-size: 0.9rem;
        }
        
        .leave-room-btn {
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
          border: 1px solid #ff6b6b;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .leave-room-btn:hover {
          background: rgba(255, 107, 107, 0.3);
        }
        
        .collaboration-workspace {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 1.5rem;
        }
        
        .shared-canvas, .participants-panel {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
        }
        
        .shared-canvas h4, .participants-panel h4 {
          margin: 0 0 1rem 0;
          color: white;
        }
        
        .canvas-placeholder {
          text-align: center;
          padding: 2rem;
          color: #888;
        }
        
        .canvas-placeholder ul {
          text-align: left;
          margin-top: 1rem;
        }
        
        .participants-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .participant {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }
        
        .participant-avatar {
          font-size: 1.2rem;
        }
        
        .participant-name {
          flex: 1;
          color: white;
        }
        
        .participant-role {
          font-size: 0.8rem;
          color: #4ecdc4;
          background: rgba(78, 205, 196, 0.2);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        
        @media (max-width: 768px) {
          .collaboration-workspace {
            grid-template-columns: 1fr;
          }
          
          .room-creation {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default CollaborationHub;