import express from 'express';
import {
  getAttendance,
  getUserAttendanceStatus,
  clockIn,
  clockOut,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAttendance);
router.get('/status', protect, getUserAttendanceStatus);
router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);

export default router;
