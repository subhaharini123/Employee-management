import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import salaryRoutes from './routes/salaryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Seeding function for default administrator credentials
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@ems.com',
        password: 'admin123', // Will be hashed automatically by pre-save hooks in User schema
        role: 'admin',
      });
      console.log('----------------------------------------------------');
      console.log('Seeded Default Admin Credentials:');
      console.log('Email: admin@ems.com');
      console.log('Password: admin123');
      console.log('----------------------------------------------------');
    }
  } catch (error) {
    console.error('Error seeding default admin account:', error.message);
  }
};

// Seed admin right after starting
seedAdmin();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Fallback status endpoint
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Employee Management API is active' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
