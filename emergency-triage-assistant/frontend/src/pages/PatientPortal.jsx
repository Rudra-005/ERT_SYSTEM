import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { patients } from '../data/patients';

const SEVERITY = {
  CRITICAL: { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  HIGH:     { bg: 'rgba(249,115,22,0.15)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  MEDIUM:   { bg: 'rgba(234,179,8,0.15)',  color: '#eab308', border: 'rgba(234,179,8,0.3)'  },
  LOW:      { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)'  },
};

const LAB_STATUS = {
  Normal:   { color: '#22c55e' },
  Abnormal: { color: '#f97316' },
  Critical: { color: '#ef4444' },
};

const cell = {
  padding: '10px 14px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  fontSize: '13px',
  color: 'var(--text-secondary)',
};

const th = {
  ...cell,
  color: 'var(--text-muted)',
  fontWeight: 700,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: 'rgba(255,255,255,0.02)',
};

export default function PatientPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Guard: patients cannot access /dashboard
  useEffect(() => {
    if (user?.role !== 'patient') navigate('/unauthorized', { replace: true });
  }, [user, navigate]);

  const patient = patients.find(p => p.id === user?.id);
  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  if (!patient) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="dash-card" style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
        <p style={{ color: 'var(--text-secondary)' }}>No records found for your account.</p>
      </div>
    </div>
  );

  const sorted = [...patient.triageReports].sort((a, b) => new Date(b.date) - new Date(a.date));
  const meds = patient.medicalHistory.currentMedications;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '28px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🚑</div>
            <div>
              <h1 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, margin: 0 }}>Welcome, {user?.name}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>ERT Patient Portal</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
              ID: {user?.id}
            </span>
            <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* ── PROFILE CARD ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="dash-card" style={{ marginBottom: '20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>👤 Patient Profile</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {[
              ['Name',        patient.name],
              ['Age',         `${patient.age} yrs`],
              ['Gender',      patient.gender],
              ['Blood Group', patient.bloodGroup],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'var(--bg-primary)', borderRadius: '10px', padding: '12px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>{label}</p>
                <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg-primary)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Emergency Contact</p>
            <p style={{ color: 'var(--text-primary)', fontSize: '13px', margin: 0 }}>
              {patient.emergencyContact.name} · {patient.emergencyContact.relation} · <span style={{ color: '#a78bfa' }}>{patient.emergencyContact.phone}</span>
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px' }}>Allergies</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {patient.medicalHistory.allergies.map(a => (
                  <span key={a} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>{a}</span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px' }}>Chronic Conditions</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {patient.medicalHistory.chronicConditions.map(c => (
                  <span key={c} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── TRIAGE REPORTS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: '20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>🩺 Triage Reports</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {sorted.map(r => {
              const sev = SEVERITY[r.severity] || SEVERITY.LOW;
              return (
                <div key={r.reportId} className="dash-card" style={{ padding: '20px' }}>
                  {/* Report header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>📅 {r.date}</span>
                      <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>{r.severity}</span>
                      <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{r.status}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>👨‍⚕️ {r.doctorAssigned}</span>
                  </div>

                  <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, margin: '0 0 14px' }}>{r.chiefComplaint}</p>

                  {/* Vitals grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                    {[
                      ['BP',    r.vitals.bp],
                      ['Pulse', r.vitals.pulse],
                      ['Temp',  r.vitals.temp],
                      ['SpO₂',  r.vitals.spo2],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '10px 12px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px' }}>{label}</p>
                        <p style={{ color: '#a78bfa', fontSize: '13px', fontWeight: 600, margin: 0 }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* AI Assessment */}
                  <div style={{ background: 'rgba(99,102,241,0.06)', borderLeft: '3px solid #6366f1', borderRadius: '0 8px 8px 0', padding: '12px 14px', marginBottom: '10px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>AI Assessment</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>{r.aiAssessment}</p>
                  </div>

                  {r.followUp && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                      📌 Follow-up: <span style={{ color: 'var(--text-secondary)' }}>{r.followUp}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── LAB REPORTS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="dash-card" style={{ marginBottom: '20px', padding: '20px', overflowX: 'auto' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>🔬 Lab Reports</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
            <thead>
              <tr>
                {['Test Name', 'Date', 'Result', 'Normal Range', 'Status'].map(h => (
                  <th key={h} style={{ ...th, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patient.labReports.map(l => (
                <tr key={l.reportId} style={{ transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...cell, color: 'var(--text-primary)', fontWeight: 500 }}>{l.testName}</td>
                  <td style={cell}>{l.date}</td>
                  <td style={{ ...cell, color: 'var(--text-primary)' }}>{l.result}</td>
                  <td style={cell}>{l.normalRange}</td>
                  <td style={cell}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                      color: LAB_STATUS[l.status]?.color || 'var(--text-secondary)',
                      background: `${LAB_STATUS[l.status]?.color}18` || 'transparent',
                    }}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* ── MEDICATIONS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>💊 Current Medications</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {meds.map((med, i) => {
              const [drug, dose, freq] = med.split(' - ');
              return (
                <div key={i} className="dash-card" style={{ padding: '16px', borderLeft: '3px solid #7c3aed' }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, margin: '0 0 8px' }}>{drug}</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {dose && <span style={{ padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, background: 'rgba(124,58,237,0.12)', color: '#a78bfa' }}>{dose}</span>}
                    {freq && <span style={{ padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>{freq}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div style={{ marginTop: '28px', padding: '12px 16px', background: 'rgba(244,63,94,0.06)', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.12)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
            ⚠️ Read-only records. For emergencies call <strong style={{ color: '#f43f5e' }}>112</strong> immediately.
          </p>
        </div>

      </div>
    </div>
  );
}
