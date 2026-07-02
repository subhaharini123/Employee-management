import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { Briefcase, Plus, Edit, Trash2, Search, AlertCircle, FileText } from 'lucide-react';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add Department');
  const [editingDeptId, setEditingDeptId] = useState(null);
  
  // Form states
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch departments list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setModalTitle('Add Department');
    setEditingDeptId(null);
    setDeptName('');
    setDeptDesc('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setModalTitle('Edit Department');
    setEditingDeptId(dept._id);
    setDeptName(dept.name);
    setDeptDesc(dept.description);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) {
      setFormError('Department name is required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      if (editingDeptId) {
        // Edit mode
        const res = await api.put(`/departments/${editingDeptId}`, {
          name: deptName,
          description: deptDesc,
        });
        if (res.data.success) {
          setIsModalOpen(false);
          await fetchDepartments();
        }
      } else {
        // Add mode
        const res = await api.post('/departments', {
          name: deptName,
          description: deptDesc,
        });
        if (res.data.success) {
          setIsModalOpen(false);
          await fetchDepartments();
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error occurred while saving');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      setError('');
      const res = await api.delete(`/departments/${id}`);
      if (res.data.success) {
        await fetchDepartments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete department.');
    }
  };

  const filteredDepts = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '0.25rem' }}>
            Departments
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage organizational divisions and workforce aggregates</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
          <Plus size={18} />
          Add Department
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
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Table Content */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', maxWidth: '360px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {filteredDepts.length > 0 ? (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Description</th>
                  <th>Total Headcount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepts.map((dept) => (
                  <tr key={dept._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Briefcase size={16} />
                        </div>
                        <span style={{ fontWeight: '600', color: '#fff' }}>{dept.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {dept.description || 'No description provided'}
                    </td>
                    <td>
                      <span className="badge badge-info">{dept.headcount} Active</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.75rem' }}>
                        <button
                          onClick={() => openEditModal(dept)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem 0.6rem' }}
                        >
                          <Edit size={14} style={{ color: 'var(--accent-blue)' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(dept._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem 0.6rem' }}
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
            No departments found.
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {formError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              background: 'rgba(239, 68, 68, 0.05)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Department Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Engineering, Sales"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              placeholder="Provide a brief description of this department's functions"
              rows={4}
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Departments;
