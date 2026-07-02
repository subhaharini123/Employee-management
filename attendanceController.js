import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';

// Get local date string YYYY-MM-DD
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get attendance records (Admin lists all for a date/dept; Employee lists their own)
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const { date, department } = req.query;
      const targetDate = date || getLocalDateString();

      // Find employees
      let empQuery = {};
      if (department && department !== 'All') {
        empQuery.department = department;
      }
      
      const employees = await Employee.find(empQuery)
        .populate('userId', 'name email profileImage')
        .populate('department', 'name');

      // Fetch attendance logs for targetDate
      const logs = await Attendance.find({ date: targetDate });

      // Map employee list to check who is present, absent, etc.
      const data = employees.map((emp) => {
        const attendanceRecord = logs.find((log) => log.employeeId.toString() === emp._id.toString());
        return {
          employee: emp,
          attendance: attendanceRecord || null,
        };
      });

      res.json({ success: true, data });
    } else {
      // Employee getting their own attendance history
      const employee = await Employee.findOne({ userId: req.user._id });
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee profile not found' });
      }

      const history = await Attendance.find({ employeeId: employee._id })
        .sort({ date: -1 })
        .limit(30);

      res.json({ success: true, data: history });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's clock-in status for active employee
// @route   GET /api/attendance/status
// @access  Private
export const getUserAttendanceStatus = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const todayStr = getLocalDateString();
    const todayLog = await Attendance.findOne({ employeeId: employee._id, date: todayStr });

    res.json({
      success: true,
      data: todayLog
        ? {
            clockedIn: !!todayLog.checkIn,
            clockedOut: !!todayLog.checkOut,
            checkIn: todayLog.checkIn,
            checkOut: todayLog.checkOut,
            status: todayLog.status,
            totalHours: todayLog.totalHours,
          }
        : {
            clockedIn: false,
            clockedOut: false,
            checkIn: null,
            checkOut: null,
            status: 'Absent',
            totalHours: 0,
          },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clock In
// @route   POST /api/attendance/clock-in
// @access  Private
export const clockIn = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const todayStr = getLocalDateString();
    const existingLog = await Attendance.findOne({ employeeId: employee._id, date: todayStr });

    if (existingLog && existingLog.checkIn) {
      return res.status(400).json({ success: false, message: 'Already clocked in for today' });
    }

    const now = new Date();
    
    // Auto status: mark as 'Late' if checked in after 9:15 AM
    let status = 'Present';
    const checkHour = now.getHours();
    const checkMin = now.getMinutes();
    if (checkHour > 9 || (checkHour === 9 && checkMin > 15)) {
      status = 'Late';
    }

    const log = await Attendance.create({
      employeeId: employee._id,
      date: todayStr,
      checkIn: now.toISOString(),
      status,
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clock Out
// @route   POST /api/attendance/clock-out
// @access  Private
export const clockOut = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const todayStr = getLocalDateString();
    const log = await Attendance.findOne({ employeeId: employee._id, date: todayStr });

    if (!log) {
      return res.status(400).json({ success: false, message: 'No clock-in record found for today' });
    }

    if (log.checkOut) {
      return res.status(400).json({ success: false, message: 'Already clocked out for today' });
    }

    const now = new Date();
    log.checkOut = now.toISOString();

    // Calculate total hours
    const diffMs = new Date(log.checkOut) - new Date(log.checkIn);
    const hours = diffMs / 3600000; // milliseconds to hours
    log.totalHours = parseFloat(hours.toFixed(2));

    await log.save();

    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
