import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import { ArrowLeft, UserPlus, Save, AlertCircle } from 'lucide-react';

const EmployeeForm = () => {
  const { id } = useParams(); // present if editing
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    employeeId: '',
    dob: '',
    gender: 'Male',
    maritalStatus: 'Single',
    designation: '',
    department: '',
    salary: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    profileImage: '',
  });

  useEffect(() => {
    const initForm = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch department list
        const deptRes = await api.get('/departments');
        if (deptRes.data.success) {
          setDepartments(deptRes.data.data);
          // Set default department if any exist
          if (deptRes.data.data.length > 0 && !isEditMode) {
            setFormData((prev) => ({ ...prev, department: deptRes.data.data[0]._id }));
          }
        }

        if (isEditMode) {
          // Fetch employee to edit
          const empRes = await api.get(`/employees/${id}`);
          if (empRes.data.success) {
            const emp = empRes.data.data;
            setFormData({
              name: emp.userId?.name || '',
              email: emp.userId?.email || '',
              password: '', // blank by default during edit
              role: emp.userId?.role || 'employee',
              employeeId: emp.employeeId || '',
              dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
              gender: emp.gender || 'Male',
              maritalStatus: emp.maritalStatus || 'Single',
              designation: emp.designation || '',
              department: emp.department?._id || '',
              salary: emp.salary || '',
              joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
              status: emp.status || 'Active',
              profileImage: emp.userId?.profileImage || '',
            });
          }
        }
      } catch (err) {
        console.error(err);
        setError('Error loading form configuration or employee profile.');
      } finally {
        setLoading(false);
      }
    };

    initForm();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department) {
      setError('Please select a department. Create a department first if none exist.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (isEditMode) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Do not send empty password update
        const res = await api.put(`/employees/${id}`, payload);
        if (res.data.success) {
          navigate('/employees');
        }
      } else {
        const res = await api.post('/employees', formData);
        if (res.data.success) {
          navigate('/employees');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while saving employee record.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate('/employees')}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', padding: '0.5rem' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '0.25rem' }}>
            {isEditMode ? 'Edit Employee Profile' : 'Add New Employee'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isEditMode ? 'Modify registration profiles or credentials' : 'Register a new employee and system credentials'}
          </p>
        </div>
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
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card container */}
      <div className="glass-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Form grid sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Section: Account & Authentication */}
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', fontWeight: '700' }}>
              Account & Credentials
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="john.doe@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password {isEditMode && '(Leave blank to keep current)'}</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder={isEditMode ? '••••••••' : 'Password (min 6 chars)'}
                  value={formData.password}
                  onChange={handleChange}
                  required={!isEditMode}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Portal Access Role</label>
                <select
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="employee">Employee (Staff Member)</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>
            </div>

            {/* Section: Job Placement */}
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', fontWeight: '700', marginTop: '1rem' }}>
              Job Placement & Compensation
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  className="form-control"
                  placeholder="e.g. EMP-0092"
                  value={formData.employeeId}
                  onChange={handleChange}
                  disabled={isEditMode} // Cannot edit Employee ID once assigned
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  name="designation"
                  className="form-control"
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  name="department"
                  className="form-control"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  {departments.length === 0 ? (
                    <option value="">No departments available. Create one first!</option>
                  ) : (
                    departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Basic Monthly Salary ($)</label>
                <input
                  type="number"
                  name="salary"
                  className="form-control"
                  placeholder="e.g. 5200"
                  value={formData.salary}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Joining Date</label>
                <input
                  type="date"
                  name="joiningDate"
                  className="form-control"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Status</label>
                <select
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>

            {/* Section: Personal Profile Details */}
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', fontWeight: '700', marginTop: '1rem' }}>
              Personal Profile Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  className="form-control"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Marital Status</label>
                <select
                  name="maritalStatus"
                  className="form-control"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Profile Image URL</label>
                <input
                  type="text"
                  name="profileImage"
                  className="form-control"
                  placeholder="https://images.unsplash.com/... or blank"
                  value={formData.profileImage}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ display: 'flex', gap: '0.5rem' }}
            >
              <Save size={16} />
              {submitting ? 'Saving Profile...' : 'Save Employee Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
