import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Calendar, Menu } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <nav style={{
      height: '70px',
      background: 'rgba(17, 24, 39, 0.6)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-glass)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Left side: Hamburger and Brand/Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button 
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <Calendar size={16} style={{ color: 'var(--primary)' }} />
          <span>{getFormattedDate()}</span>
        </div>
      </div>

      {/* Right side: Profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt="Profile"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--border-glass)'
              }}
            />
          ) : (
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-blue) 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '0.9rem',
              letterSpacing: '0.05em'
            }}>
              {getInitials(user?.name)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user?.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <LogOut size={15} />
          <span style={{ fontSize: '0.85rem' }}>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
