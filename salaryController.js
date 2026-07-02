import Salary from '../models/Salary.js';
import Employee from '../models/Employee.js';

// @desc    Get salary history / records (Admin gets all; Employee gets their own)
// @route   GET /api/salary
// @access  Private
export const getSalaries = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const { search, month, year } = req.query;
      let query = {};

      if (month && month !== 'All') {
        query.month = month;
      }
      if (year && year !== 'All') {
        query.year = Number(year);
      }

      let salaries = await Salary.find(query)
        .populate({
          path: 'employeeId',
          populate: [
            { path: 'userId', select: 'name email profileImage' },
            { path: 'department', select: 'name' },
          ],
        });

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        salaries = salaries.filter(
          (sal) =>
            sal.employeeId &&
            sal.employeeId.userId &&
            (searchRegex.test(sal.employeeId.userId.name) ||
              searchRegex.test(sal.employeeId.employeeId))
        );
      }

      res.json({ success: true, data: salaries });
    } else {
      // Employee view of their own payslips
      const employee = await Employee.findOne({ userId: req.user._id });
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee profile not found' });
      }

      const salaries = await Salary.find({ employeeId: employee._id })
        .populate({
          path: 'employeeId',
          populate: [
            { path: 'userId', select: 'name email' },
            { path: 'department', select: 'name' },
          ],
        })
        .sort({ year: -1, month: -1 });

      res.json({ success: true, data: salaries });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate a salary record / Pay slip
// @route   POST /api/salary
// @access  Private (Admin only)
export const createSalary = async (req, res) => {
  const { employeeId, month, year, basicSalary, allowances, deductions, status } = req.body;

  if (!employeeId || !month || !year || basicSalary === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required salary details' });
  }

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if salary record already exists for the employee for this month/year
    const salaryExists = await Salary.findOne({ employeeId, month, year });
    if (salaryExists) {
      return res.status(400).json({
        success: false,
        message: `Salary payslip already generated for ${month} ${year}`,
      });
    }

    const basePay = Number(basicSalary);
    const allowanceVal = Number(allowances) || 0;
    const deductionVal = Number(deductions) || 0;
    const netSalary = basePay + allowanceVal - deductionVal;

    const salary = await Salary.create({
      employeeId,
      month,
      year,
      basicSalary: basePay,
      allowances: allowanceVal,
      deductions: deductionVal,
      netSalary,
      status: status || 'Pending',
      paymentDate: status === 'Paid' ? new Date() : null,
    });

    const populatedSalary = await Salary.findById(salary._id).populate({
      path: 'employeeId',
      populate: { path: 'userId', select: 'name email' },
    });

    res.status(201).json({ success: true, data: populatedSalary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get salary logs by employee ID
// @route   GET /api/salary/employee/:employeeId
// @access  Private (Admin or own employee profile)
export const getSalaryByEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (req.user.role === 'employee' && req.user._id.toString() !== employee.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const records = await Salary.find({ employeeId: employee._id }).sort({ year: -1, month: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
