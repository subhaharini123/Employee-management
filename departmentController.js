import Department from '../models/Department.js';
import Employee from '../models/Employee.js';

// @desc    Get all departments (with employee count)
// @route   GET /api/departments
// @access  Private
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    
    // Add employee counts to each department
    const departmentList = await Promise.all(
      departments.map(async (dept) => {
        const count = await Employee.countDocuments({ department: dept._id, status: 'Active' });
        return {
          ...dept.toObject(),
          headcount: count,
        };
      })
    );

    res.json({ success: true, data: departmentList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private (Admin only)
export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (Admin only)
export const createDepartment = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Department name is required' });
  }

  try {
    const deptExists = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (deptExists) {
      return res.status(400).json({ success: false, message: 'Department already exists' });
    }

    const department = await Department.create({ name, description });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin only)
export const updateDepartment = async (req, res) => {
  const { name, description } = req.body;

  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check name uniqueness if changed
    if (name && name !== department.name) {
      const deptExists = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (deptExists) {
        return res.status(400).json({ success: false, message: 'Department name already exists' });
      }
      department.name = name;
    }

    if (description !== undefined) {
      department.description = description;
    }

    await department.save();
    res.json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin only)
export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check if department has active employees
    const activeEmployees = await Employee.countDocuments({ department: department._id });
    if (activeEmployees > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active employees. Reassign employees first.',
      });
    }

    await Department.deleteOne({ _id: department._id });
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
