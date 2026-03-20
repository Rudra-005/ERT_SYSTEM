import { useState } from 'react';

export default function VitalsInput({ vitals, onChange }) {
  const [painScale, setPainScale] = useState(vitals.painScale || 0);

  const handleChange = (field, value) => {
    onChange({ ...vitals, [field]: value });
  };

  const handlePainChange = (value) => {
    setPainScale(value);
    handleChange('painScale', value);
  };

  const painEmojis = ['😊', '🙂', '😐', '😟', '😣', '😖', '😫', '😩', '😭', '😱', '💀'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Blood Pressure (mmHg) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              placeholder="Systolic"
              value={vitals.systolic || ''}
              onChange={(e) => handleChange('systolic', e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#e5e7eb',
                fontSize: '13px',
                outline: 'none',
              }}
              required
            />
            <span style={{ color: '#9ca3af' }}>/</span>
            <input
              type="number"
              placeholder="Diastolic"
              value={vitals.diastolic || ''}
              onChange={(e) => handleChange('diastolic', e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#e5e7eb',
                fontSize: '13px',
                outline: 'none',
              }}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Pulse Rate (bpm) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="number"
            placeholder="e.g., 72"
            value={vitals.pulse || ''}
            onChange={(e) => handleChange('pulse', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '13px',
              outline: 'none',
            }}
            required
          />
        </div>

        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Temperature (°F) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="e.g., 98.6"
            value={vitals.temp || ''}
            onChange={(e) => handleChange('temp', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '13px',
              outline: 'none',
            }}
            required
          />
        </div>

        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            SpO2 (%) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="number"
            placeholder="e.g., 98"
            value={vitals.spo2 || ''}
            onChange={(e) => handleChange('spo2', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '13px',
              outline: 'none',
            }}
            required
          />
        </div>

        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Respiratory Rate (/min) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="number"
            placeholder="e.g., 16"
            value={vitals.respRate || ''}
            onChange={(e) => handleChange('respRate', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '13px',
              outline: 'none',
            }}
            required
          />
        </div>

        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            GCS Score (3-15) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="number"
            min="3"
            max="15"
            placeholder="e.g., 15"
            value={vitals.gcs || ''}
            onChange={(e) => handleChange('gcs', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '13px',
              outline: 'none',
            }}
            required
          />
        </div>
      </div>

      <div>
        <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
          Pain Scale (0-10) <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <input
            type="range"
            min="0"
            max="10"
            value={painScale}
            onChange={(e) => handlePainChange(e.target.value)}
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              outline: 'none',
              background: `linear-gradient(to right, #22c55e 0%, #eab308 50%, #ef4444 100%)`,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
            <span style={{ fontSize: '24px' }}>{painEmojis[painScale]}</span>
            <span style={{ color: '#e5e7eb', fontSize: '18px', fontWeight: 700 }}>{painScale}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
