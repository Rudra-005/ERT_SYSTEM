import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('doctor');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // brief UX delay
    const ok = login(id.trim(), password, tab);
    setLoading(false);
    if (!ok) { setError('Invalid ID or password. Please try again.'); return; }
    navigate(tab === 'doctor' ? '/dashboard' : '/patient-portal', { replace: true });
  };

  const switchTab = (t) => { setTab(t); setId(''); setPassword(''); setError(''); };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 16px',
            boxShadow: '0 0 32px rgba(99,102,241,0.35)',
          }}>🚑</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: 700, margin: 0 }}>
            ERT System
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Emergency Response Triage — AI Powered
          </p>
        </div>

        {/* Card */}
        <div className="dash-card" style={{ padding: '32px' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--bg-primary)',
            borderRadius: '10px', padding: '4px',
            border: '1px solid var(--border-color)', marginBottom: '28px',
          }}>
            {['doctor', 'patient'].map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                style={{
                  flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
                  fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                  transition: 'all 0.25s',
                  background: tab === t ? 'var(--accent-indigo)' : 'transparent',
                  color: tab === t ? '#fff' : 'var(--text-secondary)',
                  boxShadow: tab === t ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                {t === 'doctor' ? '👨‍⚕️ Doctor Login' : '🧑‍🤝‍🧑 Patient Login'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                {tab === 'doctor' ? 'Doctor ID' : 'Patient ID'}
              </label>
              <input
                type="text"
                value={id}
                onChange={e => setId(e.target.value)}
                className="form-input"
                placeholder={tab === 'doctor' ? 'e.g. D001' : 'e.g. P001'}
                required
                autoComplete="off"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
                style={{ width: '100%' }}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
                    borderRadius: '8px', padding: '10px 14px',
                    color: 'var(--accent-rose)', fontSize: '13px',
                  }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="btn-primary"
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading ? '⏳ Signing in...' : `Sign In as ${tab === 'doctor' ? 'Doctor' : 'Patient'}`}
            </motion.button>
          </form>

          {/* Demo hint */}
          <div style={{
            marginTop: '20px', padding: '12px 14px',
            background: 'rgba(99,102,241,0.06)', borderRadius: '8px',
            border: '1px solid rgba(99,102,241,0.12)',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: 0, lineHeight: 1.6 }}>
              <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>Demo — </span>
              {tab === 'doctor'
                ? 'Doctor IDs: D001 / D002 · Passwords: doc123 / doc456'
                : 'Patient IDs: P001–P006 · Passwords: pat123, pat456, pat789…'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
