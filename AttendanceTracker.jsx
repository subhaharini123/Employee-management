import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import {
  Clock,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';

const AttendanceTracker = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Admin search state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [departments, setDepartments] = useState([]);
  
  // Data lists
  const [attendanceData, setAttendanceData] = useState([]);
  const [personalHistory, setPersonalHistory] = useState([]);

  // Employee-only Punch console state
  const [clockStatus, setClockStatus] = useState({
    clockedIn: false,
    clockedOut: false,
    checkIn: null,
    checkOut: null,
    status: '',
  });
  const [punchLoading, setPunchLoading] = useState(false);
  const [time, setTime] = useState(new Date());

  // Digital clock update
  useEffect(() => {
    if (!isAdmin) {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [isAdmin]);

  const fetchAdminAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch departments for filtering
      const deptRes = await api.get('/departments');
      if (deptRes.data.success) {
        setDepartments(deptRes.data.data);
      }

      // Fetch logs
      const res = await api.get('/attendance', {
        params: {
          date: selectedDate,
          department: selectedDept,
        },
      });

      if (res.data.success) {
        setAttendanceData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load company attendance board.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeAttendance = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch personal log history
      const res = await api.get('/attendance');
      if (res.data.success) {
        setPersonalHistory(res.data.data);
      }

      // Fetch clock-in status
      const statusRes = await api.get('/attendance/status');
      if (statusRes.data.success) {
        setClockStatus(statusRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminAttendance();
    } else {
      fetchEmployeeAttendance();
    }
  }, [selectedDate, selectedDept, isAdmin]);

  const handleClockIn = async () => {
    try {
      setPunchLoading(true);
      const res = await api.post('/attendance/clock-in');
      if (res.data.success) {
        await fetchEmployeeAttendance();
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
        await fetchEmployeeAttendance();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Clock-out failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const formatClockTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', options);
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', color: 'var(--accent-rose)', margin: '2rem 0' }}>
        <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
        <p>{error}</p>
        <button onClick={isAdmin ? fetchAdminAttendance : fetchEmployeeAttendance} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  // --- ADMIN ATTENDANCE VIEW ---
  if (isAdmin) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '0.25rem' }}>
            Attendance Tracker
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Review daily punch records and working hours across departments</p>
        </div>

        {/* Date / Dept Selectors */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1', minWidth: '220px' }}>
            <Calendar size={18} style={{ color: 'var(--primary)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase' }}>Select Date</span>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ marginTop: '0.25rem', padding: '0.5rem 0.75rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1', minWidth: '220px' }}>
            <Filter size={18} style={{ color: 'var(--primary)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase' }}>Department</span>
              <select
                className="form-control"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ marginTop: '0.25rem', padding: '0.5rem 0.75rem' }}
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data list Table */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
            Attendance Board for {formatDate(selectedDate)}
          </h4>
          
          {attendanceData.length > 0 ? (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((record) => {
                    const emp = record.employee;
                    const log = record.attendance;
                    return (
                      <tr key={emp._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {emp.userId?.profileImage ? (
                              <img
                                src={emp.userId.profileImage}
                                alt=""
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                              }}>
                                {emp.userId?.name ? emp.userId.name.charAt(0).toUpperCase() : 'E'}
                              </div>
                            )}
                            <span style={{ fontWeight: '600', color: '#fff' }}>{emp.userId?.name}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{emp.employeeId}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{emp.department?.name}</td>
                        <td style={{ fontWeight: '500', color: log?.checkIn ? '#fff' : 'var(--text-muted)' }}>
                          {formatClockTime(log?.checkIn)}
                        </td>
                        <td style={{ fontWeight: '500', color: log?.checkOut ? '#fff' : 'var(--text-muted)' }}>
                          {formatClockTime(log?.checkOut)}
                        </td>
                        <td>
                          {log?.totalHours ? (
                            <span style={{ fontWeight: '600', color: 'var(--accent-blue)' }}>{log.totalHours} hrs</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>--</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            log?.status === 'Present'
                              ? 'badge-success'
                              : log?.status === 'Late'
                              ? 'badge-warning'
                              : log?.status === 'Leave'
                              ? 'badge-info'
                              : 'badge-danger'
                          }`}>
                            {log?.status || 'Absent'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No employee records found.
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- EMPLOYEE PERSONAL VIEW ---
  const checkInTimeFormatted = clockStatus.checkIn ? formatClockTime(clockStatus.checkIn) : '--:--';
  const checkOutTimeFormatted = clockStatus.checkOut ? formatClockTime(clockStatus.checkOut) : '--:--';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '0.25rem' }}>
          My Attendance
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Clock-in for daily shifts and review your historical punch sheets</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Daily clock console */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2.5rem 1.5rem', gap: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Digital Punch Console
            </span>
            <h1 style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--primary)', margin: '0.5rem 0' }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

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

        {/* History table */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Recent Attendance (Last 30 Days)</h4>
          
          {personalHistory.length > 0 ? (
            <div className="custom-table-container">
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {personalHistory.map((log) => (
                    <tr key={log._id}>
                      <td style={{ fontWeight: '500' }}>{log.date}</td>
                      <td>{formatClockTime(log.checkIn)}</td>
                      <td>{formatClockTime(log.checkOut)}</td>
                      <td>{log.totalHours ? `${log.totalHours} hrs` : '--'}</td>
                      <td>
                        <span className={`badge ${
                          log.status === 'Present'
                            ? 'badge-success'
                            : log.status === 'Late'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No attendance logs found in database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;
