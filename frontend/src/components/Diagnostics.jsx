import React, { useState, useEffect } from 'react';

const Diagnostics = () => {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [apiTests, setApiTests] = useState([]);

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        // Test backend health
        const healthResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`);
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setBackendStatus(`✅ Backend Healthy: ${healthData.message}`);
        } else {
          setBackendStatus(`❌ Backend Error: Status ${healthResponse.status}`);
        }

        // Test key validation endpoint
        const apiKey = localStorage.getItem('apiKey') || 'no-key';
        const validateResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/keys/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          }
        });
        const validateData = await validateResponse.json();
        setApiTests(prev => [...prev, {
          name: 'Key Validation',
          status: validateResponse.ok ? '✅' : '❌',
          message: validateResponse.ok ? `Valid: ${validateData.valid}, Plan: ${validateData.plan || 'N/A'}` : `Error: ${validateData.error}`
        }]);

      } catch (error) {
        setBackendStatus(`❌ Connection Error: ${error.message}`);
        setApiTests(prev => [...prev, {
          name: 'Key Validation',
          status: '❌',
          message: `Connection Error: ${error.message}`
        }]);
      }
    };

    runDiagnostics();
  }, []);

  return (
    <div className="diagnostics-container">
      <h2>System Diagnostics</h2>
      <div className="status-box">
        <h3>Backend Status</h3>
        <p>{backendStatus}</p>
      </div>
      <div className="status-box">
        <h3>API Tests</h3>
        {apiTests.length > 0 ? (
          <ul>
            {apiTests.map((test, index) => (
              <li key={index}>
                <strong>{test.name}</strong>: {test.status} {test.message}
              </li>
            ))}
          </ul>
        ) : (
          <p>Running API tests...</p>
        )}
      </div>
      <div className="status-box">
        <h3>Environment</h3>
        <p>Backend URL: {import.meta.env.VITE_BACKEND_URL}</p>
        <p>AI URL: {import.meta.env.VITE_AI_URL}</p>
        <p>API URL: {import.meta.env.VITE_API_URL}</p>
      </div>
      <style jsx>{`
        .diagnostics-container {
          max-width: 800px;
          margin: 2rem auto;
          padding: 2rem;
          background: #1a1a2e;
          border-radius: 8px;
          color: #fff;
        }
        .status-box {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          border: 1px solid #333;
        }
        h2 {
          margin-bottom: 1.5rem;
          color: #4CAF50;
        }
        h3 {
          margin-bottom: 0.5rem;
          color: #4CAF50;
        }
        ul {
          list-style: none;
          padding: 0;
        }
        li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default Diagnostics;
