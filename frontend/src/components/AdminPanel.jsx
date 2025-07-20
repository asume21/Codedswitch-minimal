import React, { useState } from 'react';

const AdminPanel = () => {
  const [adminKey, setAdminKey] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [godKey, setGodKey] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [userId, setUserId] = useState('');
  const [activeTab, setActiveTab] = useState('usage');

  const resetUsage = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/reset-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey: adminKey,
          userId: 'anonymous'
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage('✅ Usage limits reset successfully!');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  const enableUnlimited = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      localStorage.setItem('codedswitch_admin_key', adminKey);
      setMessage('✅ Unlimited mode enabled! All usage limits bypassed.');
    } catch (error) {
      setMessage('❌ Failed to enable unlimited mode');
    } finally {
      setLoading(false);
    }
  };

  const createGodKey = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/keys/god`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminKey }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setGodKey(data.god_key);
        setMessage(`🔥 GOD MODE KEY CREATED! 🔥\n\n${data.message}\n\nPowers: ${data.powers.join(', ')}`);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to create God key');
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/keys/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          adminKey, 
          plan: selectedPlan,
          userId: userId || undefined,
          description: `${selectedPlan} plan key generated via admin panel`
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNewApiKey(data.api_key);
        setMessage(`✅ ${data.message}\n\nAPI Key: ${data.api_key}`);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔧 CodedSwitch Admin Panel</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>Admin Key:</label>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="Enter admin key"
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            marginBottom: '10px'
          }}
        />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        {['usage', 'keys', 'god'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: activeTab === tab ? '#007bff' : 'transparent',
              color: activeTab === tab ? 'white' : '#007bff',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #007bff' : 'none'
            }}
          >
            {tab === 'usage' && '📊 Usage Management'}
            {tab === 'keys' && '🔑 API Keys'}
            {tab === 'god' && '👑 God Mode'}
          </button>
        ))}
      </div>

      {/* Usage Management Tab */}
      {activeTab === 'usage' && (
        <div>
          <h3>Usage Management</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={resetUsage}
              disabled={loading || !adminKey}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading || !adminKey ? 'not-allowed' : 'pointer',
                opacity: loading || !adminKey ? 0.6 : 1
              }}
            >
              {loading ? 'Processing...' : 'Reset All Usage'}
            </button>
            
            <button
              onClick={enableUnlimited}
              disabled={!adminKey}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: !adminKey ? 'not-allowed' : 'pointer',
                opacity: !adminKey ? 0.6 : 1
              }}
            >
              Enable Unlimited Mode
            </button>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div>
          <h3>API Key Generation</h3>
          <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Plan:</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              >
                <option value="free">Free (5 lyrics, 2 music, 10 translations)</option>
                <option value="pro">Pro (100 lyrics, 25 music, 500 translations)</option>
                <option value="premium">Premium (Unlimited everything)</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>User ID (optional):</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g., user123 or email@domain.com"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>
            
            <button
              onClick={generateApiKey}
              disabled={loading || !adminKey}
              style={{
                padding: '12px 24px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading || !adminKey ? 'not-allowed' : 'pointer',
                opacity: loading || !adminKey ? 0.6 : 1,
                fontSize: '16px'
              }}
            >
              {loading ? 'Generating...' : '🔑 Generate API Key'}
            </button>
          </div>
          
          {newApiKey && (
            <div style={{
              padding: '15px',
              backgroundColor: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <strong>New API Key Generated:</strong><br/>
              <code style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '5px', 
                borderRadius: '3px',
                fontSize: '12px',
                wordBreak: 'break-all'
              }}>
                {newApiKey}
              </code>
            </div>
          )}
        </div>
      )}

      {/* God Mode Tab */}
      {activeTab === 'god' && (
        <div>
          <h3>👑 God Mode Key</h3>
          <div style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            <h4>⚠️ Ultimate Power</h4>
            <p>The God Mode key grants:</p>
            <ul>
              <li>🚀 Unlimited everything (lyrics, music, translations, scans)</li>
              <li>🔄 Never expires or resets</li>
              <li>🛡️ Bypasses all rate limits</li>
              <li>👑 Admin panel access</li>
              <li>🎯 Perfect for testing and personal use</li>
            </ul>
          </div>
          
          <button
            onClick={createGodKey}
            disabled={loading || !adminKey}
            style={{
              padding: '15px 30px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading || !adminKey ? 'not-allowed' : 'pointer',
              opacity: loading || !adminKey ? 0.6 : 1,
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Creating...' : '🔥 CREATE GOD KEY 🔥'}
          </button>
          
          {godKey && (
            <div style={{
              padding: '20px',
              backgroundColor: '#d1ecf1',
              border: '2px solid #bee5eb',
              borderRadius: '5px',
              marginTop: '20px'
            }}>
              <h4>🎉 Your God Key:</h4>
              <code style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '10px', 
                borderRadius: '5px',
                fontSize: '14px',
                wordBreak: 'break-all',
                display: 'block',
                marginTop: '10px'
              }}>
                {godKey}
              </code>
              <p style={{ marginTop: '15px', fontSize: '14px', color: '#0c5460' }}>
                💾 <strong>Save this key!</strong> Use it in API headers as <code>X-API-Key</code> or in request bodies as <code>apiKey</code>
              </p>
            </div>
          )}
        </div>
      )}

      {message && (
        <div style={{
          padding: '15px',
          backgroundColor: message.includes('✅') || message.includes('🔥') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') || message.includes('🔥') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('✅') || message.includes('🔥') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
          marginTop: '20px',
          whiteSpace: 'pre-wrap'
        }}>
          {message}
        </div>
      )}

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '5px',
        fontSize: '14px',
        color: '#6c757d',
        marginTop: '20px'
      }}>
        <strong>🔐 Security Notes:</strong><br/>
        • Default Admin Key: <code>codedswitch_admin_2025</code><br/>
        • API keys are stored securely and can be deactivated<br/>
        • God mode keys should only be used for testing/personal use<br/>
        • Change the admin key in production environments
      </div>
    </div>
  );
};

export default AdminPanel;
