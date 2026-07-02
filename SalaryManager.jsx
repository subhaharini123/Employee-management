import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  Printer,
  AlertCircle,
  Briefcase,
  User,
  CheckCircle2
} from 'lucide-react';

const SalaryManager = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data lists
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterYear, setFilterYear] = useState('All');

  // Generator Modal State
  const [isGenOpen, setIsGenOpen] = useState(false);
  const [genError, setGenError] = useState('');
  const [genSubmitting, setGenSubmitting] = useState(false);
  const [genData, setGenData] = useState({
    employeeId: '',
    month: 'January',
    year: new Date().getFullYear(),
    basicSalary: '',
    allowances: 0,
    deductions: 0,
    status: 'Paid',
  });

  // Pay Slip Modal
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const years = [
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1
  ];

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch salary logs
      const res = await api.get('/salary', {
        params: {
          month: filterMonth,
          year: filterYear,
        },
      });
      if (res.data.success) {
        setSalaries(res.data.data);
      }

      if (isAdmin) {
        // Fetch active employees for dropdown
        const empRes = await api.get('/employees', { params: { status: 'Active' } });
        if (empRes.data.success) {
          setEmployees(empRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Could not load salary registry details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [filterMonth, filterYear]);

  // Auto-fill salary when employee selection changes in generator
  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const selectedEmp = employees.find((emp) => emp._id === empId);
    setGenData((prev) => ({
      ...prev,
      employeeId: empId,
      basicSalary: selectedEmp ? selectedEmp.salary : '',
    }));
  };

  const handleGenSubmit = async (e) => {
    e.preventDefault();
    if (!genData.employeeId || !genData.basicSalary) {
      setGenError('Please select an employee and define basic salary');
      return;
    }

    try {
      setGenSubmitting(true);
      setGenError('');
      const res = await api.post('/salary', genData);
      if (res.data.success) {
        setIsGenOpen(false);
        // Clear generator states
        setGenData({
          employeeId: '',
          month: 'January',
          year: new Date().getFullYear(),
          basicSalary: '',
          allowances: 0,
          deductions: 0,
          status: 'Paid',
        });
        await fetchSalaries();
      }
    } catch (err) {
      setGenError(err.response?.data?.message || 'Error occurred while creating payroll payslip.');
    } finally {
      setGenSubmitting(false);
    }
  };

  const openGenModal = () => {
    setGenError('');
    setIsGenOpen(true);
    if (employees.length > 0) {
      // Set default employee
      const defaultEmp = employees[0];
      setGenData({
        employeeId: defaultEmp._id,
        month: months[new Date().getMonth()],
        year: new Date().getFullYear(),
        basicSalary: defaultEmp.salary,
        allowances: 0,
        deductions: 0,
        status: 'Paid',
      });
    }
  };

  const openSlipModal = (slip) => {
    setSelectedSlip(slip);
    setIsSlipOpen(true);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  // Perform client-side filter for searches
  const searchRegex = new RegExp(search, 'i');
  const filteredSalaries = salaries.filter((sal) => {
    if (!isAdmin) return true; // Employee gets their own directly from endpoint
    const name = sal.employeeId?.userId?.name || '';
    const id = sal.employeeId?.employeeId || '';
    return searchRegex.test(name) || searchRegex.test(id);
  });

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', color: 'var(--accent-rose)', margin: '2rem 0' }}>
        <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
        <p>{error}</p>
        <button onClick={fetchSalaries} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  // Common Table Render (Admin and Employee columns have small variations)
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '0.25rem' }}>
            {isAdmin ? 'Salary Registry' : 'My Pay Slips'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isAdmin
              ? 'Generate monthly employee pay slips and monitor financial payouts'
              : 'Review and download monthly salary details and payment slips'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={openGenModal} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
            <Plus size={18} />
            Generate Pay Slip
          </button>
        )}
      </div>

      {/* Search and Filters card */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search bar (Admin only) */}
          {isAdmin ? (
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', maxWidth: '300px', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search by Employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          ) : (
            <div />
          )}

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>MONTH:</span>
              <select
                className="form-control"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{ width: '120px', padding: '0.5rem 0.75rem' }}
              >
                <option value="All">All Months</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>YEAR:</span>
              <select
                className="form-control"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                style={{ width: '100px', padding: '0.5rem 0.75rem' }}
              >
                <option value="All">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Salary Records List */}
        {filteredSalaries.length > 0 ? (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  {isAdmin && <th>ID</th>}
                  <th>Period</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalaries.map((sal) => (
                  <tr key={sal._id}>
                    {isAdmin && (
                      <td>
                        <span style={{ fontWeight: '600', color: '#fff' }}>
                          {sal.employeeId?.userId?.name || 'Deleted Employee'}
                        </span>
                      </td>
                    )}
                    {isAdmin && (
                      <td style={{ fontFamily: 'monospace' }}>
                        {sal.employeeId?.employeeId || 'N/A'}
                      </td>
                    )}
                    <td style={{ fontWeight: '500' }}>
                      {sal.month} {sal.year}
                    </td>
                    <td>${sal.basicSalary.toLocaleString()}</td>
                    <td style={{ color: 'var(--accent-emerald)' }}>+${sal.allowances.toLocaleString()}</td>
                    <td style={{ color: 'var(--accent-rose)' }}>-${sal.deductions.toLocaleString()}</td>
                    <td style={{ fontWeight: '700', color: '#fff' }}>
                      ${sal.netSalary.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${sal.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {sal.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openSlipModal(sal)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', gap: '0.375rem' }}
                      >
                        <Printer size={13} />
                        View Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            No salary records logged in this period.
          </div>
        )}
      </div>

      {/* MODAL 1: Add/Generate Salary (Admin Only) */}
      {isAdmin && (
        <Modal isOpen={isGenOpen} onClose={() => setIsGenOpen(false)} title="Generate Employee Pay Slip">
          <form onSubmit={handleGenSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {genError && (
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
                <span>{genError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Select Employee</label>
              <select
                name="employeeId"
                className="form-control"
                value={genData.employeeId}
                onChange={handleEmployeeChange}
                required
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.userId?.name} ({emp.employeeId} - {emp.designation})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Pay Month</label>
                <select
                  name="month"
                  className="form-control"
                  value={genData.month}
                  onChange={(e) => setGenData({ ...genData, month: e.target.value })}
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pay Year</label>
                <select
                  name="year"
                  className="form-control"
                  value={genData.year}
                  onChange={(e) => setGenData({ ...genData, year: Number(e.target.value) })}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Basic Salary ($)</label>
                <input
                  type="number"
                  className="form-control"
                  value={genData.basicSalary}
                  onChange={(e) => setGenData({ ...genData, basicSalary: Number(e.target.value) })}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Allowances ($)</label>
                <input
                  type="number"
                  className="form-control"
                  value={genData.allowances}
                  onChange={(e) => setGenData({ ...genData, allowances: Number(e.target.value) })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deductions ($)</label>
                <input
                  type="number"
                  className="form-control"
                  value={genData.deductions}
                  onChange={(e) => setGenData({ ...genData, deductions: Number(e.target.value) })}
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select
                name="status"
                className="form-control"
                value={genData.status}
                onChange={(e) => setGenData({ ...genData, status: e.target.value })}
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Live Calculation preview */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.5rem'
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Calculated Net Salary:</span>
              <h3 style={{ color: 'var(--primary)', fontWeight: '800' }}>
                ${(Number(genData.basicSalary || 0) + Number(genData.allowances || 0) - Number(genData.deductions || 0)).toLocaleString()}
              </h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setIsGenOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={genSubmitting}>
                {genSubmitting ? 'Generating...' : 'Confirm & Payout'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: View and Print Pay Slip (Admin & Employee) */}
      {selectedSlip && (
        <Modal
          isOpen={isSlipOpen}
          onClose={() => setIsSlipOpen(false)}
          title="Official Corporate Pay Slip"
          size="lg"
        >
          {/* Slip Content Printable */}
          <div id="printable-payslip" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0.5rem' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--primary)', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h2 style={{ fontWeight: '800', color: '#fff', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.85rem' }}>E</div>
                  EMS Corporate
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enterprise Employee Portal</span>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--primary)' }}>PAY SLIP</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Period: {selectedSlip.month} {selectedSlip.year}</span>
              </div>
            </div>

            {/* Profile grids */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              background: 'rgba(255, 255, 255, 0.01)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glass)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={15} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Employee Details</span>
                </div>
                <h4 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700' }}>
                  {selectedSlip.employeeId?.userId?.name || 'Employee'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>ID: {selectedSlip.employeeId?.employeeId}</span>
                  <span>Designation: {selectedSlip.employeeId?.designation}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '1px solid var(--border-glass)', paddingLeft: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={15} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Payment Reference</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Slip ID: {selectedSlip._id}</span>
                  <span>Department: {selectedSlip.employeeId?.department?.name || 'Unassigned'}</span>
                  <span>Date Issued: {selectedSlip.paymentDate ? new Date(selectedSlip.paymentDate).toLocaleDateString() : 'Pending'}</span>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Salary Breakdown</span>
              <div className="custom-table-container">
                <table className="custom-table" style={{ fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th>Earnings / Description</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ color: '#fff' }}>Basic Monthly Salary</td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: '#fff' }}>${selectedSlip.basicSalary.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--accent-emerald)' }}>Allowances (Bonuses, Reimbursements)</td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent-emerald)' }}>+${selectedSlip.allowances.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--accent-rose)' }}>Deductions (Professional Tax, Deductions)</td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent-rose)' }}>-${selectedSlip.deductions.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '2px dashed var(--border-glass)',
              paddingTop: '1.25rem',
              marginTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Status:</span>
                <span className={`badge ${selectedSlip.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                  {selectedSlip.status}
                </span>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Net Payout Amount</span>
                <h2 style={{ color: 'var(--accent-emerald)', fontWeight: '800', fontSize: '1.8rem' }}>
                  ${selectedSlip.netSalary.toLocaleString()}
                </h2>
              </div>
            </div>

            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
              <span>This is a system generated salary pay slip and does not require a physical signature.</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '1rem' }}>
            <button onClick={handlePrintSlip} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
              <Printer size={16} />
              Print Pay Slip
            </button>
            <button onClick={() => setIsSlipOpen(false)} className="btn btn-secondary">
              Close Slip
            </button>
          </div>
        </Modal>
      )}

      {/* Print Overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip, #printable-payslip * {
            visibility: visible;
          }
          #printable-payslip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 2cm !important;
          }
          #printable-payslip h2, #printable-payslip h3, #printable-payslip h4, #printable-payslip td, #printable-payslip span {
            color: black !important;
          }
          #printable-payslip .custom-table-container {
            border: 1px solid #ccc !important;
          }
          #printable-payslip th {
            background: #eee !important;
            color: #333 !important;
            border-bottom: 1px solid #ccc !important;
          }
          #printable-payslip td {
            border-bottom: 1px solid #eee !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SalaryManager;
