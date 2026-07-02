import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

// @desc    Get all employees with filters and search
// @route   GET /api/employees
// @access  Private (Admin only)
export const getEmployees = async (req, res) => {
  try {
    const { search, department, status } = req.query;
    let query = {};

    // Filter by department if provided
    if (department && department !== 'All') {
      query.department = department;
    }

    // Filter by status if provided
    if (status && status !== 'All') {
      query.status = status;
    }

    // Retrieve all active employees matching base filters
    let employees = await Employee.find(query)
      .populate('userId', 'name email role profileImage')
      .populate('department', 'name');

    // If search term is present, filter in memory or via subquery
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      employees = employees.filter(
        (emp) =>
          (emp.userId && searchRegex.test(emp.userId.name)) ||
          (emp.userId && searchRegex.test(emp.userId.email)) ||
          searchRegex.test(emp.employeeId) ||
          searchRegex.test(emp.designation)
      );
    }

    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single employee details
// @route   GET /api/employees/:id
// @access  Private (Admin or own employee profile)
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'name email role profileImage')
      .populate('department', 'name');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if user is Admin OR viewing their own employee profile
    if (req.user.role === 'employee' && req.user._id.toString() !== employee.userId._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this profile' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin only)
export const createEmployee = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    employeeId,
    dob,
    gender,
    maritalStatus,
    designation,
    department,
    salary,
    joiningDate,
    status,
    profileImage,
  } = req.body;

  try {
    // Check if user credentials already exist
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Check if employeeId is unique
    const empIdExists = await Employee.findOne({ employeeId });
    if (empIdExists) {
      return res.status(400).json({ success: false, message: 'Employee ID already exists' });
    }

    // Verify department exists
    const deptExists = await Department.findById(department);
    if (!deptExists) {
      return res.status(400).json({ success: false, message: 'Selected department does not exist' });
    }

    // Create User record for auth
    const user = await User.create({
      name,
      email,
      password: password || 'welcome123',
      role: role || 'employee',
      profileImage: profileImage || '',
    });

    // Create Employee details record
    const employee = await Employee.create({
      userId: user._id,
      employeeId,
      dob,
      gender,
      maritalStatus,
      designation,
      department,
      salary,
      joiningDate,
      status: status || 'Active',
    });

    const createdEmployee = await Employee.findById(employee._id)
      .populate('userId', 'name email role')
      .populate('department', 'name');

    res.status(201).json({ success: true, data: createdEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin only)
export const updateEmployee = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    dob,
    gender,
    maritalStatus,
    designation,
    department,
    salary,
    joiningDate,
    status,
    profileImage,
  } = req.body;

  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Update User credentials
    const user = await User.findById(employee.userId);
    if (user) {
      if (name) user.name = name;
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ success: false, message: 'Email address already in use' });
        }
        user.email = email;
      }
      if (password) user.password = password; // pre-save hook will hash it
      if (role) user.role = role;
      if (profileImage !== undefined) user.profileImage = profileImage;
      await user.save();
    }

    // Update Department if changed and verify existence
    if (department && department !== employee.department.toString()) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        return res.status(400).json({ success: false, message: 'Selected department does not exist' });
      }
      employee.department = department;
    }

    // Update employee profile details
    if (dob) employee.dob = dob;
    if (gender) employee.gender = gender;
    if (maritalStatus) employee.maritalStatus = maritalStatus;
    if (designation) employee.designation = designation;
    if (salary !== undefined) employee.salary = salary;
    if (joiningDate) employee.joiningDate = joiningDate;
    if (status) employee.status = status;

    await employee.save();

    const updatedEmployee = await Employee.findById(employee._id)
      .populate('userId', 'name email role profileImage')
      .populate('department', 'name');

    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Delete User login credentials associated with employee
    await User.deleteOne({ _id: employee.userId });

    // Delete Employee profile details
    await Employee.deleteOne({ _id: employee._id });

    res.json({ success: true, message: 'Employee and user account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
