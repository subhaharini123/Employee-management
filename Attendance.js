import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: String, // format: YYYY-MM-DD for easier querying
      required: true,
    },
    checkIn: {
      type: String, // HH:MM or Full date ISO
    },
    checkOut: {
      type: String, // HH:MM or Full date ISO
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Leave'],
      default: 'Present',
    },
    totalHours: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
