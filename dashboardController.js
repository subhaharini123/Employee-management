import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import Salary from '../models/Salary.js';

// Get local date string YYYY-MM-DD
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get Admin Dashboard metrics
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
export const getAdminDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ status: 'Active' });
    const totalDepartments = await Department.countDocuments({});

    const todayStr = getLocalDateString();
    const presentToday = await Attendance.countDocuments({
      date: todayStr,
      status: { $in: ['Present', 'Late'] },
    });

    // Calculate sum of basic salaries of active employees
    const employees = await Employee.find({ status: 'Active' });
    const totalSalaryBudget = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);

    // Fetch recent check-ins
    const recentLogs = await Attendance.find({ date: todayStr })
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name profileImage' },
      })
      .sort({ updatedAt: -1 })
      .limit(5);

    const recentActivities = recentLogs.map((log) => ({
      id: log._id,
      name: log.employeeId?.userId?.name || 'Unknown Employee',
      time: log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      status: log.status,
      type: 'attendance',
    }));

    res.json({
      success: true,
      data: {
        totalEmployees,
        totalDepartments,
        presentToday,
        totalSalaryBudget,
        recentActivities,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Employee Dashboard metrics
// @route   GET /api/dashboard/employee
// @access  Private
export const getEmployeeDashboardStats = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    // Attendance stats in past 30 days
    const attendanceRecords = await Attendance.find({ employeeId: employee._id });
    const presentDays = attendanceRecords.filter((rec) => rec.status === 'Present').length;
    const lateDays = attendanceRecords.filter((rec) => rec.status === 'Late').length;
    const absentDays = attendanceRecords.filter((rec) => rec.status === 'Absent').length;
    const leaveDays = attendanceRecords.filter((rec) => rec.status === 'Leave').length;
    const totalDays = attendanceRecords.length;

    const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

    // Total net salary received (Paid)
    const paidSlips = await Salary.find({ employeeId: employee._id, status: 'Paid' });
    const totalEarnings = paidSlips.reduce((sum, slip) => sum + slip.netSalary, 0);

    // Latest payslip
    const latestPayslip = await Salary.findOne({ employeeId: employee._id })
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      data: {
        attendanceRate,
        presentDays,
        lateDays,
        absentDays,
        leaveDays,
        totalEarnings,
        latestPayslip: latestPayslip || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
