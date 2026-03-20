import React, { useState, useEffect } from 'react';

/**
 * Global LatencyBadge fixed to the bottom right.
 * Listens to custom events or window variables to display the last network request time.
 * Automatically color-codes based on strict SLAs.
 */
const LatencyBadge = ({ latencyMs = 0 }) => {
  const [latency, setLatency] = useState(latencyMs);

  useEffect(() => {
    // Listen for custom globally dispatched latency events
    const handleLatencyUpdate = (e) => {
      if (e.detail && typeof e.detail.latency === 'number') {
        setLatency(e.detail.latency);
      }
    };
    
    window.addEventListener('api-latency-update', handleLatencyUpdate);
    return () => window.removeEventListener('api-latency-update', handleLatencyUpdate);
  }, []);

  if (!latency) return null;

  // Enforce Color Thresholds: Green (<300), Yellow (300-380), Red (>380)
  let bgColor = 'bg-emerald-500/20';
  let textColor = 'text-emerald-400';
  let borderColor = 'border-emerald-500/30';
  
  if (latency > 380) {
    bgColor = 'bg-rose-500/20';
    textColor = 'text-rose-400';
    borderColor = 'border-rose-500/30';
  } else if (latency >= 300) {
    bgColor = 'bg-amber-500/20';
    textColor = 'text-amber-400';
    borderColor = 'border-amber-500/30';
  }

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md flex items-center gap-2 transition-colors duration-300 ${bgColor} ${borderColor}`}
      title="Last Request Latency"
    >
      <div className={`w-2 h-2 rounded-full ${latency > 380 ? 'bg-rose-500' : latency >= 300 ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
      <span className={`font-mono text-xs font-bold tracking-wider ${textColor}`}>
        {latency}ms
      </span>
    </div>
  );
};

export default LatencyBadge;
