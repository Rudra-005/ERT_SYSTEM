import { motion } from 'framer-motion';

export default function UserBadge({ user, onLogout }) {
  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleColor = user.role === 'doctor' ? '#6366f1' : '#a78bfa';

  return (
    <div className="dash-card-flat" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${roleColor}, ${roleColor}dd)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            color: '#fff',
            boxShadow: `0 0 16px ${roleColor}40`,
          }}
        >
          {initials}
        </motion.div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, margin: 0 }}>
            {user.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            {user.dept && (
              <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{user.dept}</span>
            )}
            {user.dept && <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>·</span>}
            <span
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: `${roleColor}20`,
                color: roleColor,
              }}
            >
              {user.role}
            </span>
          </div>
        </div>
      </div>
      <motion.button
        onClick={onLogout}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-secondary"
        style={{ width: '100%', fontSize: '12px', padding: '7px 10px' }}
      >
        🚪 Logout
      </motion.button>
    </div>
  );
}
