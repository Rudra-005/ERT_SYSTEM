/**
 * Latency Dashboard Component
 * Shows last 10 request latencies with color indicators
 * Toggle with Ctrl+Shift+L
 */

import React, { useState, useEffect } from 'react';

class LatencyTracker {
  constructor() {
    this.entries = [];
    this.maxEntries = 10;
    this.listeners = [];
  }

  addEntry(entry) {
    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.pop();
    }
    this.notifyListeners();
  }

  getEntries() {
    return this.entries;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.entries));
  }
}

// Initialize global tracker
if (!window.latencyTracker) {
  window.latencyTracker = new LatencyTracker();
}

const LatencyDashboard = () => {
  const [visible, setVisible] = useState(false);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    // Subscribe to latency updates
    const unsubscribe = window.latencyTracker.subscribe((newEntries) => {
      setEntries([...newEntries]);
    });

    // Keyboard shortcut: Ctrl+Shift+L
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getColorClass = (latencyMs, timeout) => {
    if (timeout || latencyMs >= 400) return 'bg-red-600 text-white';
    if (latencyMs >= 380) return 'bg-red-500 text-white';
    if (latencyMs >= 300) return 'bg-yellow-500 text-black';
    return 'bg-green-500 text-white';
  };

  const getStatusLabel = (latencyMs, timeout) => {
    if (timeout || latencyMs >= 400) return 'VIOLATION';
    if (latencyMs >= 380) return 'CRITICAL';
    if (latencyMs >= 300) return 'WARNING';
    return 'OK';
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '350px',
        maxHeight: '500px',
        backgroundColor: '#1a1a1a',
        border: '2px solid #333',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: '12px',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 15px',
          backgroundColor: '#2a2a2a',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ color: '#fff', fontWeight: 'bold' }}>
          ⚡ Latency Monitor
        </div>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Entries */}
      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '10px'
        }}
      >
        {entries.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No requests yet
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={index}
              style={{
                marginBottom: '8px',
                padding: '8px',
                backgroundColor: '#2a2a2a',
                borderRadius: '4px',
                borderLeft: '4px solid ' + (
                  entry.timeout || entry.latency_ms >= 400 ? '#ef4444' :
                  entry.latency_ms >= 380 ? '#f97316' :
                  entry.latency_ms >= 300 ? '#eab308' :
                  '#22c55e'
                )
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>
                  {entry.route}
                </span>
                <span
                  className={getColorClass(entry.latency_ms, entry.timeout)}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  {getStatusLabel(entry.latency_ms, entry.timeout)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#999' }}>
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span style={{
                  color: entry.timeout || entry.latency_ms >= 400 ? '#ef4444' :
                        entry.latency_ms >= 380 ? '#f97316' :
                        entry.latency_ms >= 300 ? '#eab308' :
                        '#22c55e',
                  fontWeight: 'bold'
                }}>
                  {entry.latency_ms.toFixed(2)}ms
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 15px',
          backgroundColor: '#2a2a2a',
          borderTop: '1px solid #333',
          color: '#666',
          fontSize: '10px',
          textAlign: 'center'
        }}
      >
        Press Ctrl+Shift+L to toggle | Target: &lt;400ms
      </div>
    </div>
  );
};

export default LatencyDashboard;
