import express from 'express';
import { getAdminDashboardStats, getEmployeeDashboardStats } from '../controllers/dashboardController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', protect, adminOnly, getAdminDashboardStats);
router.get('/employee', protect, getEmployeeDashboardStats);

export default router;
