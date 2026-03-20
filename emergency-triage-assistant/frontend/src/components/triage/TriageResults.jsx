import { motion } from 'framer-motion';

export default function TriageResults({ results, onSave, onReAnalyze, onClose, onPrint }) {
  const severityConfig = {
    CRITICAL: { 
      bg: '#ef4444', 
      text: '⚠️ CRITICAL - Immediate Intervention Required',
      animation: 'flash 1s infinite',
    },
    HIGH: { 
      bg: '#f97316', 
      text: '🔴 HIGH PRIORITY - Urgent Attention Needed',
    },
    MEDIUM: { 
      bg: '#eab308', 
      text: '🟡 MEDIUM - Monitor Closely',
    },
    LOW: { 
      bg: '#22c55e', 
      text: '🟢 LOW - Routine Assessment',
    },
  };

  const config = severityConfig[results.severity] || severityConfig.MEDIUM;

  const getVitalStatus = (vital, value) => {
    const ranges = {
      systolic: { normal: [90, 120], borderline: [120, 140] },
      diastolic: { normal: [60, 80], borderline: [80, 90] },
      pulse: { normal: [60, 100], borderline: [100, 110] },
      temperature: { normal: [97.0, 99.0], borderline: [99.0, 100.4] },
      spo2: { normal: [95, 100], borderline: [90, 95] },
      respiratoryRate: { normal: [12, 20], borderline: [20, 24] },
      gcs: { normal: [15, 15], borderline: [13, 14] },
    };

    const range = ranges[vital];
    if (!range) return 'normal';

    const numValue = parseFloat(value);
    if (numValue >= range.normal[0] && numValue <= range.normal[1]) return 'normal';
    if (numValue >= range.borderline[0] && numValue <= range.borderline[1]) return 'borderline';
    return 'critical';
  };

  const statusColors = {
    normal: '#22c55e',
    borderline: '#eab308',
    critical: '#ef4444',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '24px',
      }}
    >
      <style>
        {`
          @keyframes flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>

      {/* Severity Banner */}
      <div style={{
        background: config.bg,
        color: '#fff',
        padding: '16px 20px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 700,
        textAlign: 'center',
        marginBottom: '24px',
        animation: results.severity === 'CRITICAL' ? 'flash 1s infinite' : 'none',
        border: results.severity === 'CRITICAL' ? '2px solid #fff' : 'none',
      }}>
        {config.text}
      </div>

      {/* Severity Reason */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
      }}>
        <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
          SEVERITY REASON
        </p>
        <p style={{ color: '#e5e7eb', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
          {results.severityReason}
        </p>
      </div>

      {/* Immediate Actions */}
      <div style={{
        background: results.severity === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
        border: `2px solid ${results.severity === 'CRITICAL' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
      }}>
        <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
          ⚡ IMMEDIATE ACTIONS
        </p>
        {results.immediateActions.map((action, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '10px',
            alignItems: 'start',
          }}>
            <input type="checkbox" style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }} />
            <p style={{ color: '#e5e7eb', fontSize: '13px', margin: 0, flex: 1 }}>
              <strong>{i + 1}.</strong> {action}
            </p>
          </div>
        ))}
      </div>

      {/* Probable Diagnosis */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
      }}>
        <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
          🔍 PROBABLE DIAGNOSIS
        </p>
        <p style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
          {results.probableDiagnosis.primary}
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {results.probableDiagnosis.differentials.map((diff, i) => (
            <span key={i} style={{
              padding: '6px 12px',
              background: 'rgba(124,58,237,0.15)',
              color: '#a78bfa',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {diff}
            </span>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {(results.vitalsAlert !== 'NONE' || results.allergyWarning !== 'NONE') && (
        <div style={{ marginBottom: '20px' }}>
          {results.allergyWarning !== 'NONE' && (
            <div style={{
              background: 'rgba(239,68,68,0.15)',
              border: '2px solid #ef4444',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
            }}>
              <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                ⚠️ ALLERGY WARNING
              </p>
              <p style={{ color: '#e5e7eb', fontSize: '13px', margin: 0 }}>
                {results.allergyWarning}
              </p>
            </div>
          )}
          {results.vitalsAlert !== 'NONE' && (
            <div style={{
              background: 'rgba(249,115,22,0.15)',
              border: '2px solid #f97316',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <p style={{ color: '#f97316', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                📊 VITALS ALERT
              </p>
              <p style={{ color: '#e5e7eb', fontSize: '13px', margin: 0 }}>
                {results.vitalsAlert}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Treatment Protocol */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
      }}>
        <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
          💊 TREATMENT PROTOCOL
        </p>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <p style={{ color: '#22c55e', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Immediate (0-15 min)
            </p>
            <p style={{ color: '#e5e7eb', fontSize: '13px', margin: 0 }}>
              {results.treatmentProtocol.immediate}
            </p>
          </div>
          <div>
            <p style={{ color: '#eab308', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Short-term (15-60 min)
            </p>
            <p style={{ color: '#e5e7eb', fontSize: '13px', margin: 0 }}>
              {results.treatmentProtocol.shortTerm}
            </p>
          </div>
          <div>
            <p style={{ color: '#a78bfa', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Medications
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {results.treatmentProtocol.medications.map((med, i) => (
                <span key={i} style={{
                  padding: '4px 10px',
                  background: 'rgba(124,58,237,0.2)',
                  color: '#a78bfa',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  {med}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p style={{ color: '#06b6d4', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Monitoring
            </p>
            <p style={{ color: '#e5e7eb', fontSize: '13px', margin: 0 }}>
              {results.treatmentProtocol.monitoring}
            </p>
          </div>
        </div>
      </div>

      {/* Referral & Disposition */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            👨‍⚕️ SPECIALIST REFERRAL
          </p>
          <p style={{ color: '#e5e7eb', fontSize: '13px', margin: 0 }}>
            {results.specialistReferral}
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            🏥 ESTIMATED DISPOSITION
          </p>
          <p style={{ color: '#e5e7eb', fontSize: '13px', margin: 0 }}>
            {results.estimatedDisposition}
          </p>
        </div>
      </div>

      {/* Vitals Comparison */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
      }}>
        <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
          📊 VITALS COMPARISON
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          {Object.entries(results.vitals).map(([key, value]) => {
            const status = getVitalStatus(key, value);
            return (
              <div key={key} style={{
                background: 'rgba(0,0,0,0.3)',
                borderLeft: `3px solid ${statusColors[status]}`,
                borderRadius: '8px',
                padding: '10px',
              }}>
                <p style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  {key}
                </p>
                <p style={{ color: statusColors[status], fontSize: '14px', fontWeight: 700, margin: 0 }}>
                  {value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Doctor Notes */}
      {results.doctorNotes && results.doctorNotes !== 'NONE' && (
        <div style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <p style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            📝 DOCTOR NOTES
          </p>
          <p style={{ color: '#e5e7eb', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
            {results.doctorNotes}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: '#0f1117',
        padding: '16px 0',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={onReAnalyze}
          style={{
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)',
            color: '#9ca3af',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🔄 Re-Analyze
        </button>
        <button
          onClick={onPrint}
          style={{
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)',
            color: '#9ca3af',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🖨️ Print
        </button>
        <button
          onClick={onSave}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          💾 Save Report
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)',
            color: '#9ca3af',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}
