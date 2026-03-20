import React from 'react';

export default function VitalsInput({ vitals, setVitals }) {
  const painEmojis = ['😊', '🙂', '😐', '😟', '😣', '😖', '😫', '😩', '😭', '😱', '💀'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Blood Pressure */}
        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Blood Pressure (mmHg) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              value={vitals.systolic}
              onChange={(e) => setVitals(prev => ({ ...prev, systolic: e.target.value }))}
              placeholder="Systolic"
              min="0" max="300"
              style={inputStyle}
              required
            />
            <span style={{ color: '#9ca3af' }}>/</span>
            <input
              type="number"
              value={vitals.diastolic}
              onChange={(e) => setVitals(prev => ({ ...prev, diastolic: e.target.value }))}
              placeholder="Diastolic"
              min="0" max="200"
              style={inputStyle}
              required
            />
          </div>
        </div>

        {/* Pulse Rate */}
        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Pulse Rate (bpm) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="number"
            value={vitals.pulse}
            onChange={(e) => setVitals(prev => ({ ...prev, pulse: e.target.value }))}
            placeholder="e.g., 72"
            min="0" max="300"
            style={inputStyle}
            required
          />
        </div>

        {/* Temperature */}
        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Temperature (°F) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="number"
            value={vitals.temperature}
            onChange={(e) => setVitals(prev => ({ ...prev, temperature: e.target.value }))}
            placeholder="e.g., 98.6"
            step="0.1" min="0" max="115"
            style={inputStyle}
            required
          />
        </div>

        {/* SpO2 */}
        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            SpO2 (%) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="number"
            value={vitals.spo2}
            onChange={(e) => setVitals(prev => ({ ...prev, spo2: e.target.value }))}
            placeholder="e.g., 98"
            min="0" max="100"
            style={inputStyle}
            required
          />
        </div>

        {/* Respiratory Rate */}
        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Respiratory Rate (/min) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="number"
            value={vitals.respiratoryRate}
            onChange={(e) => setVitals(prev => ({ ...prev, respiratoryRate: e.target.value }))}
            placeholder="e.g., 16"
            min="0" max="60"
            style={inputStyle}
            required
          />
        </div>

        {/* GCS Score */}
        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            GCS Score (3-15) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="number"
            value={vitals.gcs}
            onChange={(e) => setVitals(prev => ({ ...prev, gcs: e.target.value }))}
            min="3" max="15"
            style={inputStyle}
            required
          />
        </div>
      </div>

      {/* Pain Scale */}
      <div>
        <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
          Pain Scale (0-10) <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <input
            type="range"
            min="0" max="10"
            value={vitals.painScale}
            onChange={(e) => setVitals(prev => ({ ...prev, painScale: Number(e.target.value) }))}
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              outline: 'none',
              background: `linear-gradient(to right, #22c55e 0%, #eab308 50%, #ef4444 100%)`,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
            <span style={{ fontSize: '24px' }}>{painEmojis[vitals.painScale]}</span>
            <span style={{ color: '#e5e7eb', fontSize: '18px', fontWeight: 700 }}>{vitals.painScale}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e5e7eb',
  fontSize: '13px',
  outline: 'none',
};
