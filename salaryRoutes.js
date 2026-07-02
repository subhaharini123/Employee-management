import express from 'express';
import { getSalaries, createSalary, getSalaryByEmployee } from '../controllers/salaryController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSalaries)
  .post(protect, adminOnly, createSalary);

router.route('/employee/:employeeId')
  .get(protect, getSalaryByEmployee);

export default router;
