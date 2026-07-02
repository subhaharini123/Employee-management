import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import {
  Users,
  Briefcase,
  UserCheck,
  DollarSign,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user, employee, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Attendance Clock-in State for Employees
  const [clockStatus, setClockStatus] = useState({
    clockedIn: false,
    clockedOut: false,
    checkIn: null,
    checkOut: null,
    status: '',
  });
  const [punchLoading, setPunchLoading] = useState(false);
  const [time, setTime] = useState(new Date());

  const isAdmin = user?.role === 'admin';

  // Digital clock helper
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      if (isAdmin) {
        const res = await api.get('/dashboard/admin');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } else {
        const res = await api.get('/dashboard/employee');
        if (res.data.success) {
          setStats(res.data.data);
        }
        
        // Fetch current day's clock-in status
        const clockRes = await api.get('/attendance/status');
        if (clockRes.data.success) {
          setClockStatus(clockRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Could not load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const handleClockIn = async () => {
    try {
      setPunchLoading(true);
      const res = await api.post('/attendance/clock-in');
      if (res.data.success) {
        // Refresh statuses
        await fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Clock-in failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setPunchLoading(true);
      const res = await api.post('/attendance/clock-out');
      if (res.data.success) {
        // Refresh statuses
        await fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Clock-out failed');
    } finally {
      setPunchLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', color: 'var(--accent-rose)', margin: '2rem 0' }}>
        <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
        <p>{error}</p>
        <button onClick={fetchStats} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  if (isAdmin) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '0.25rem' }}>
            System Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, System Administrator</p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem'
        }}>
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            icon={Users}
            color="var(--primary)"
            trend="Active workers"
          />
          <StatCard
            title="Departments"
            value={stats?.totalDepartments || 0}
            icon={Briefcase}
            color="var(--accent-blue)"
            trend="Company sectors"
          />
          <StatCard
            title="Present Today"
            value={stats?.presentToday || 0}
            icon={UserCheck}
            color="var(--accent-emerald)"
            trend="Clocked-in staff"
          />
          <StatCard
            title="Monthly Payroll"
            value={`$${(stats?.totalSalaryBudget || 0).toLocaleString()}`}
            icon={DollarSign}
            color="var(--accent-amber)"
            trend="Est. basic expenditure"
          />
        </div>

        {/* Details Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          marginTop: '1rem'
        }}>
          {/* Recent Activity Feed */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Today's Check-in Feed</h4>
              <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid var(--border-glass)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: act.status === 'Late' ? 'var(--warning)' : 'var(--success)'
                      }} />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {act.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge ${act.status === 'Late' ? 'badge-warning' : 'badge-success'}`}>
                        {act.status}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{act.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                  No attendance logged today.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Administrative Shortcuts</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <a href="/employees" className="btn btn-secondary" style={{ padding: '1rem', flexDirection: 'column', height: '100%', gap: '0.5rem', textAlign: 'center' }}>
                <Users size={24} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.85rem' }}>Add Employee</span>
              </a>
              <a href="/departments" className="btn btn-secondary" style={{ padding: '1rem', flexDirection: 'column', height: '100%', gap: '0.5rem', textAlign: 'center' }}>
                <Briefcase size={24} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontSize: '0.85rem' }}>New Department</span>
              </a>
              <a href="/attendance" className="btn btn-secondary" style={{ padding: '1rem', flexDirection: 'column', height: '100%', gap: '0.5rem', textAlign: 'center' }}>
                <UserCheck size={24} style={{ color: 'var(--accent-emerald)' }} />
                <span style={{ fontSize: '0.85rem' }}>Check Attendance</span>
              </a>
              <a href="/salary" className="btn btn-secondary" style={{ padding: '1rem', flexDirection: 'column', height: '100%', gap: '0.5rem', textAlign: 'center' }}>
                <DollarSign size={24} style={{ color: 'var(--accent-amber)' }} />
                <span style={{ fontSize: '0.85rem' }}>Pay Payroll</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- EMPLOYEE VIEW ---
  const checkInTimeFormatted = clockStatus.checkIn
    ? new Date(clockStatus.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const checkOutTimeFormatted = clockStatus.checkOut
    ? new Date(clockStatus.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '0.25rem' }}>
          Personal Dashboard
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Welcome back, {user?.name} ({employee?.designation || 'Staff Member'})
        </p>
      </div>

      {/* Grid containing Punch Console & Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Clock In / Out Console Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2.5rem 1.5rem', gap: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Digital Punch Clock
            </span>
            <h1 style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--primary)', margin: '0.5rem 0' }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Action console buttons */}
          <div style={{ width: '100%', maxWidth: '240px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!clockStatus.clockedIn ? (
              <button
                onClick={handleClockIn}
                className="btn btn-primary"
                disabled={punchLoading}
                style={{ width: '100%', padding: '0.9rem' }}
              >
                {punchLoading ? 'Processing...' : 'Clock In (Check-in)'}
              </button>
            ) : !clockStatus.clockedOut ? (
              <button
                onClick={handleClockOut}
                className="btn btn-danger"
                disabled={punchLoading}
                style={{ width: '100%', padding: '0.9rem' }}
              >
                {punchLoading ? 'Processing...' : 'Clock Out (Check-out)'}
              </button>
            ) : (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                <CheckCircle2 size={18} />
                <span>Duty Completed Today</span>
              </div>
            )}
          </div>

          {/* Punched logs today */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Check In Time</span>
              <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '600', marginTop: '0.25rem' }}>{checkInTimeFormatted}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Check Out Time</span>
              <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '600', marginTop: '0.25rem' }}>{checkOutTimeFormatted}</span>
            </div>
          </div>
        </div>

        {/* Quick analytics card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <StatCard
            title="Attendance Score"
            value={`${stats?.attendanceRate || 0}%`}
            icon={UserCheck}
            color="var(--accent-emerald)"
            trend={`Present logs logged`}
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Present Days</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>{stats?.presentDays || 0}</span>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Late Days</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-amber)' }}>{stats?.lateDays || 0}</span>
            </div>
          </div>
          <StatCard
            title="Net Earnings Received"
            value={`$${(stats?.totalEarnings || 0).toLocaleString()}`}
            icon={DollarSign}
            color="var(--primary)"
            trend="Total Paid Salary Slips"
          />
        </div>
      </div>

      {/* Latest Payslip summary */}
      {stats?.latestPayslip && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Latest Paid Pay Slip</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pay Period</span>
              <p style={{ fontWeight: '600', fontSize: '1rem', color: '#fff', marginTop: '0.25rem' }}>
                {stats.latestPayslip.month} {stats.latestPayslip.year}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Basic Pay</span>
              <p style={{ fontWeight: '600', fontSize: '1rem', color: '#fff', marginTop: '0.25rem' }}>
                ${stats.latestPayslip.basicSalary.toLocaleString()}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Net Payout</span>
              <p style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                ${stats.latestPayslip.netSalary.toLocaleString()}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status</span>
              <div style={{ marginTop: '0.25rem' }}>
                <span className="badge badge-success">Paid</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
