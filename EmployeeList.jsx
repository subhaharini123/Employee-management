import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Mail,
  User,
  Shield,
  Briefcase
} from 'lucide-react';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Filter States
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Detail Modal State
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch departments for filtering
      const deptRes = await api.get('/departments');
      if (deptRes.data.success) {
        setDepartments(deptRes.data.data);
      }

      // Fetch employees with initial query filters
      const empRes = await api.get('/employees', {
        params: {
          department: selectedDept,
          status: selectedStatus,
        },
      });

      if (empRes.data.success) {
        setEmployees(empRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load workforce records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept, selectedStatus]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee and their login account?')) return;

    try {
      const res = await api.delete(`/employees/${id}`);
      if (res.data.success) {
        // Refresh local array
        setEmployees(employees.filter((emp) => emp._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const openDetailModal = (emp) => {
    setSelectedEmp(emp);
    setIsDetailOpen(true);
  };

  // Perform search in memory
  const searchRegex = new RegExp(search, 'i');
  const filteredEmployees = employees.filter((emp) => {
    const name = emp.userId?.name || '';
    const email = emp.userId?.email || '';
    const id = emp.employeeId || '';
    const des = emp.designation || '';
    return (
      searchRegex.test(name) ||
      searchRegex.test(email) ||
      searchRegex.test(id) ||
      searchRegex.test(des)
    );
  });

  const getInitials = (name) => {
    if (!name) return 'E';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) return <Loader />;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '0.25rem' }}>
            Employees
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage profiles, salaries, and system access rights</p>
        </div>
        <button
          onClick={() => navigate('/employees/new')}
          className="btn btn-primary"
          style={{ display: 'flex', gap: '0.5rem' }}
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          color: 'var(--accent-rose)',
          fontSize: '0.85rem'
        }}>
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters card */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', maxWidth: '300px', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>DEPARTMENT:</span>
              <select
                className="form-control"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ width: '150px', padding: '0.5rem 0.75rem' }}
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>STATUS:</span>
              <select
                className="form-control"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ width: '140px', padding: '0.5rem 0.75rem' }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        {filteredEmployees.length > 0 ? (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Designation / Dept</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {emp.userId?.profileImage ? (
                          <img
                            src={emp.userId.profileImage}
                            alt=""
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-glass)' }}
                          />
                        ) : (
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-blue) 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '0.85rem'
                          }}>
                            {getInitials(emp.userId?.name)}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', color: '#fff' }}>{emp.userId?.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.userId?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: '500' }}>{emp.employeeId}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>{emp.designation}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.department?.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {new Date(emp.joiningDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'Active' ? 'badge-success' : emp.status === 'Inactive' ? 'badge-warning' : 'badge-danger'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openDetailModal(emp)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem 0.6rem' }}
                          title="View Profile"
                        >
                          <Eye size={14} style={{ color: 'var(--accent-emerald)' }} />
                        </button>
                        <button
                          onClick={() => navigate(`/employees/edit/${emp._id}`)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem 0.6rem' }}
                          title="Edit Details"
                        >
                          <Edit size={14} style={{ color: 'var(--accent-blue)' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem 0.6rem' }}
                          title="Delete Employee"
                        >
                          <Trash2 size={14} style={{ color: 'var(--accent-rose)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            No employee records found.
          </div>
        )}
      </div>

      {/* Employee Detail Modal */}
      {selectedEmp && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Employee Profile Details"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
              {selectedEmp.userId?.profileImage ? (
                <img
                  src={selectedEmp.userId.profileImage}
                  alt=""
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-blue) 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '1.75rem'
                }}>
                  {getInitials(selectedEmp.userId?.name)}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>{selectedEmp.userId?.name}</h3>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{selectedEmp.designation}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span className={`badge ${selectedEmp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{selectedEmp.status}</span>
                  <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{selectedEmp.userId?.role}</span>
                </div>
              </div>
            </div>

            {/* Profile Grid Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Employee ID</span>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '500' }}>{selectedEmp.employeeId}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Email</span>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '500' }}>{selectedEmp.userId?.email}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Briefcase size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Department</span>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '500' }}>{selectedEmp.department?.name || 'Unassigned'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <DollarSign size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Basic Salary</span>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '600' }}>${selectedEmp.salary.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Joining Date</span>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '500' }}>
                    {new Date(selectedEmp.joiningDate).toLocaleDateString([], { dateStyle: 'medium' })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date of Birth</span>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '500' }}>
                    {selectedEmp.dob ? new Date(selectedEmp.dob).toLocaleDateString([], { dateStyle: 'medium' }) : 'N/A'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Shield size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gender</span>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '500' }}>{selectedEmp.gender}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Marital Status</span>
                  <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '500' }}>{selectedEmp.maritalStatus}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <button onClick={() => setIsDetailOpen(false)} className="btn btn-secondary">
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeList;
