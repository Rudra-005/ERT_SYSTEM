import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoToPortal = () => {
    if (!user) {
      navigate('/', { replace: true });
    } else if (user.role === 'doctor') {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/patient-portal', { replace: true });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', maxWidth: '480px' }}
      >
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(244,63,94,0.15)',
          border: '2px solid rgba(244,63,94,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          margin: '0 auto 24px',
        }}>
          🚫
        </div>

        <h1 style={{
          color: 'var(--text-primary)',
          fontSize: '28px',
          fontWeight: 700,
          margin: '0 0 12px',
        }}>
          Access Denied
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '15px',
          lineHeight: 1.6,
          margin: '0 0 24px',
        }}>
          You don't have permission to access this page.
        </p>

        {user && (
          <div className="dash-card" style={{ padding: '16px 20px', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>Your Role:</span>
              <span style={{
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: user.role === 'doctor' ? 'rgba(99,102,241,0.15)' : 'rgba(167,139,250,0.15)',
                color: user.role === 'doctor' ? '#6366f1' : '#a78bfa',
              }}>
                {user.role}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>Attempted Access:</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                {window.location.pathname}
              </span>
            </div>
          </div>
        )}

        <motion.button
          onClick={handleGoToPortal}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary"
          style={{ width: '100%', maxWidth: '280px' }}
        >
          {user ? '🏠 Go to My Portal' : '← Back to Login'}
        </motion.button>
      </motion.div>
    </div>
  );
}
