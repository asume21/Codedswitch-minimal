import React, { useState, useEffect } from 'react';

const SettingsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Load saved API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('apiKey') || '';
    setApiKey(savedApiKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem('apiKey', apiKey);
    setIsSaved(true);
    // Hide the success message after 2 seconds
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleValidateKey = async () => {
    setIsValidating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/keys/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      });
      const data = await response.json();
      if (response.ok) {
        setValidationResult({ valid: true, message: data.message || 'Valid key!', plan: data.plan || 'God Mode' });
      } else {
        setValidationResult({ valid: false, message: data.error || 'Invalid key' });
      }
    } catch (error) {
      console.error('Error validating key:', error);
      setValidationResult({ valid: false, message: 'Validation failed: Network error' });
    } finally {
      setIsValidating(false);
      // Hide the result after 5 seconds
      setTimeout(() => setValidationResult(null), 5000);
    }
  };

  return (
    <div className="settings-dropdown">
      <button 
        className="settings-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Settings"
      >
        ⚙️
      </button>
      
      {isOpen && (
        <div className="dropdown-content">
          <div className="dropdown-header">
            <h4>API Settings</h4>
            <button className="close-button" onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="form-group">
            <label htmlFor="apiKey">Your API Key (Regular or God Mode):</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="api-key-input"
            />
            <div className="button-group">
              <button onClick={handleSave} className="save-button">
                Save
              </button>
              <button onClick={handleValidateKey} className="validate-button" disabled={isValidating || !apiKey}>
                {isValidating ? 'Validating...' : 'Validate'}
              </button>
            </div>
            {isSaved && <span className="success-message">✓ Saved!</span>}
            {validationResult && (
              <span className={`validation-message ${validationResult.valid ? 'valid' : 'invalid'}`}>
                {validationResult.valid ? '✓' : '✗'} {validationResult.message}
                {validationResult.valid && validationResult.plan && ` (${validationResult.plan})`}
              </span>
            )}
          </div>
          
          <div className="dropdown-footer">
            <small>
              Don't have an API key?{' '}
              <a href="/pricing" target="_blank" rel="noopener noreferrer">
                Get one here
              </a>
            </small>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .settings-dropdown {
          position: relative;
          display: inline-block;
          margin-left: 1rem;
        }
        
        .settings-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .settings-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .dropdown-content {
          position: absolute;
          right: 0;
          top: 100%;
          background: #1a1a2e;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 1rem;
          width: 300px;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #333;
        }
        
        .close-button {
          background: none;
          border: none;
          color: #fff;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0 0.5rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .api-key-input {
          width: 100%;
          padding: 0.5rem;
          margin: 0.5rem 0;
          border: 1px solid #444;
          border-radius: 4px;
          background: #0f0f1f;
          color: #fff;
        }
        
        .save-button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: background 0.2s;
        }
        
        .save-button:hover {
          background: #45a049;
        }
        
        .button-group {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        
        .validate-button {
          background: #2196F3;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .validate-button:hover:not(:disabled) {
          background: #1976D2;
        }
        
        .validate-button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        
        .success-message {
          color: #4CAF50;
          margin-left: 0.5rem;
          font-size: 0.9rem;
        }
        
        .validation-message {
          margin-left: 0.5rem;
          font-size: 0.9rem;
        }
        
        .valid {
          color: #4CAF50;
        }
        
        .invalid {
          color: #F44336;
        }
        
        .dropdown-footer {
          margin-top: 1rem;
          padding-top: 0.5rem;
          border-top: 1px solid #333;
          font-size: 0.8rem;
          color: #aaa;
        }
        
        .dropdown-footer a {
          color: #4CAF50;
          text-decoration: none;
        }
        
        .dropdown-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default SettingsDropdown;
