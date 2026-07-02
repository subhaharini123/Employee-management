import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  UserCheck
} from 'lucide-react';

const Sidebar = ({ collapsed }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const menuItems = isAdmin
    ? [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/employees', label: 'Employees', icon: Users },
        { path: '/departments', label: 'Departments', icon: Briefcase },
        { path: '/attendance', label: 'Attendance', icon: Clock },
        { path: '/salary', label: 'Salary Management', icon: DollarSign },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/attendance', label: 'My Attendance', icon: Clock },
        { path: '/salary', label: 'My Salary Slips', icon: DollarSign },
      ];

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-glass)',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        transition: 'var(--transition-smooth)',
        overflowX: 'hidden'
      }}
    >
      {/* Brand Logo Header */}
      <div
        style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0 1.5rem',
          borderBottom: '1px solid var(--border-glass)',
          whiteSpace: 'nowrap'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-blue) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            boxShadow: '0 0 15px var(--primary-glow)'
          }}
        >
          E
        </div>
        {!collapsed && (
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: '800',
              fontSize: '1.25rem',
              background: 'linear-gradient(135deg, #ffffff 0%, var(--text-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            EMS Portal
          </span>
        )}
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '1.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.95rem',
                transition: 'var(--transition-smooth)',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User status indicator */}
      {!collapsed && (
        <div
          style={{
            padding: '1.5rem',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(0, 0, 0, 0.1)'
          }}
        >
          <UserCheck size={18} style={{ color: 'var(--accent-emerald)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Server Connected</span>
            <span style={{ color: 'var(--text-muted)' }}>v1.0.0</span>
          </div>
        </div>
      )}

      {/* Global Sidebar Overrides */}
      <style>{`
        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-primary) !important;
        }
        .sidebar-link.active {
          background: var(--primary-glow);
          color: var(--primary) !important;
          border-left: 3px solid var(--primary);
          padding-left: calc(1rem - 3px);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
