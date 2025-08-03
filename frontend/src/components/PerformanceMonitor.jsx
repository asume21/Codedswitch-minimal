import React, { useState, useEffect } from 'react';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    apiResponseTime: 0,
    audioLatency: 0,
    memoryUsage: 0,
    activeConnections: 0,
    errorRate: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    let interval;
    
    if (isMonitoring) {
      interval = setInterval(async () => {
        try {
          const startTime = performance.now();
          
          // Test API response time
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`);
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          // Get memory usage if available
          const memoryInfo = performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          } : null;
          
          setMetrics(prev => ({
            ...prev,
            apiResponseTime: Math.round(responseTime),
            memoryUsage: memoryInfo ? Math.round((memoryInfo.used / memoryInfo.limit) * 100) : 0,
            activeConnections: navigator.onLine ? 1 : 0
          }));
          
        } catch (error) {
          console.error('Performance monitoring error:', error);
          setMetrics(prev => ({
            ...prev,
            errorRate: prev.errorRate + 1
          }));
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  const getStatusColor = (value, thresholds) => {
    if (value <= thresholds.good) return '#4ecdc4';
    if (value <= thresholds.warning) return '#f9ca24';
    return '#ff6b6b';
  };

  const MetricCard = ({ title, value, unit, thresholds, icon }) => (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value" style={{ color: getStatusColor(value, thresholds) }}>
        {value}{unit}
      </div>
      <div className="metric-status">
        {value <= thresholds.good && '✅ Good'}
        {value > thresholds.good && value <= thresholds.warning && '⚠️ Warning'}
        {value > thresholds.warning && '❌ Critical'}
      </div>
    </div>
  );

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h3>📊 Performance Monitor</h3>
        <button 
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`monitor-toggle ${isMonitoring ? 'active' : ''}`}
        >
          {isMonitoring ? '⏸️ Pause' : '▶️ Start'} Monitoring
        </button>
      </div>
      
      <div className="metrics-grid">
        <MetricCard
          title="API Response"
          value={metrics.apiResponseTime}
          unit="ms"
          thresholds={{ good: 200, warning: 500 }}
          icon="🚀"
        />
        
        <MetricCard
          title="Memory Usage"
          value={metrics.memoryUsage}
          unit="%"
          thresholds={{ good: 50, warning: 80 }}
          icon="🧠"
        />
        
        <MetricCard
          title="Connection"
          value={metrics.activeConnections}
          unit=""
          thresholds={{ good: 1, warning: 1 }}
          icon="🌐"
        />
        
        <MetricCard
          title="Error Rate"
          value={metrics.errorRate}
          unit=""
          thresholds={{ good: 0, warning: 3 }}
          icon="⚠️"
        />
      </div>
      
      <style jsx>{`
        .performance-monitor {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1rem 0;
        }
        
        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .monitor-header h3 {
          margin: 0;
          color: #4ecdc4;
        }
        
        .monitor-toggle {
          background: linear-gradient(45deg, #4ecdc4, #45b7d1);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .monitor-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
        }
        
        .monitor-toggle.active {
          background: linear-gradient(45deg, #ff6b6b, #ff8e53);
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .metric-card {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }
        
        .metric-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .metric-icon {
          font-size: 1.2rem;
        }
        
        .metric-title {
          font-size: 0.9rem;
          color: #ccc;
          font-weight: 500;
        }
        
        .metric-value {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0.5rem 0;
        }
        
        .metric-status {
          font-size: 0.8rem;
          color: #888;
        }
      `}</style>
    </div>
  );
};

export default PerformanceMonitor;