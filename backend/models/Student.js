const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: Number, unique: true },
  name: { type: String, required: true },
  parentNumber: { type: String, required: true },
  class: { type: String, required: true },
  monthlyFee: { type: Number, required: true },
  enrolledAt: { type: Date, default: Date.now },
  enrollmentMonth: { 
    type: String, 
    required: true,
    default: 'June 2025'
  },
  status: {
    type: String,
    enum: ['Active', 'Left', 'Void', 'Abandon'],
    default: 'Active'
  },
  leftAt: { type: Date }, 
  active: { type: Boolean, default: true } 
});

module.exports = mongoose.model('Student', studentSchema); 