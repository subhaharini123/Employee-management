import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'var(--primary)', trend = '' }) => {
  return (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <h3 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
          {value}
        </h3>
        {trend && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {trend}
          </span>
        )}
      </div>
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-sm)',
          background: `rgba(${color === 'var(--primary)' ? '99, 102, 241' : color === 'var(--accent-emerald)' ? '16, 185, 129' : color === 'var(--accent-blue)' ? '14, 165, 233' : '245, 158, 11'}, 0.1)`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.15)`
        }}
      >
        {Icon && <Icon size={26} />}
      </div>
    </div>
  );
};

export default StatCard;
