const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const FeePayment = require('../models/FeePayment');

const academicYearMonths = [
  'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025',
  'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026', 'April 2026'
];

// Helper function to get applicable months for a student based on enrollment month and status
const getApplicableMonths = (enrollmentMonth, studentStatus, leftAt) => {
  // If student is not active, calculate only until they left
  if (studentStatus !== 'Active' && leftAt) {
    const leftDate = new Date(leftAt);
    const leftMonth = leftDate.getMonth();
    const leftYear = leftDate.getFullYear();
    
    // Map left month to academic year month
    const monthMapping = {
      5: 'June 2025', 6: 'July 2025', 7: 'August 2025', 8: 'September 2025',
      9: 'October 2025', 10: 'November 2025', 11: 'December 2025',
      0: 'January 2026', 1: 'February 2026', 2: 'March 2026', 3: 'April 2026'
    };
    
    const endMonth = monthMapping[leftMonth];
    const startIndex = academicYearMonths.indexOf(enrollmentMonth);
    const endIndex = endMonth ? academicYearMonths.indexOf(endMonth) : academicYearMonths.length - 1;
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      return academicYearMonths.slice(startIndex, endIndex + 1);
    }
  }
  
  // For active students or if no left date, calculate from enrollment month to April
  const startIndex = academicYearMonths.indexOf(enrollmentMonth);
  if (startIndex === -1) {
    return academicYearMonths; // Default to full year if enrollment month not found
  }
  
  return academicYearMonths.slice(startIndex);
};

// Helper function to check if student is in class 10
const isClass10Student = (studentClass) => {
  return studentClass === '10' || studentClass === 'Class 10' || studentClass.toLowerCase().includes('10');
};

// Get earnings and pending summary for the academic year
router.get('/', async (req, res) => {
  try {
    // Fetch all students but we'll handle status in calculation
    const students = await Student.find({});
    const payments = await FeePayment.find();
    let totalEarnings = 0;
    let totalPending = 0;
    const studentStats = students.map(student => {
      let paid = 0;
      let pending = 0;
      
      // Skip calculation for Void or Abandon students
      if (student.status === 'Void' || student.status === 'Abandon') {
        return {
          studentId: student.studentId,
          _id: student._id,
          name: student.name,
          class: student.class,
          status: student.status,
          enrollmentMonth: student.enrollmentMonth,
          applicableMonths: 0,
          isClass10: false,
          paid: 0,
          pending: 0
        };
      }
      
      // Get applicable months based on enrollment month and status
      const enrollmentMonth = student.enrollmentMonth || 'June 2025';
      const applicableMonths = getApplicableMonths(enrollmentMonth, student.status, student.leftAt);
      const isClass10 = isClass10Student(student.class);
      
      // Calculate fees based on student type
      if (isClass10) {
        // Class 10: Part payment system (not monthly)
        // Check if there's any payment for this student
        const studentPayments = payments.filter(p => p.studentId.toString() === student._id.toString());
        const totalPaid = studentPayments.reduce((sum, payment) => {
          if (payment.status === 'Paid') {
            return sum + payment.amountPaid;
          }
          return sum;
        }, 0);
        
        // For class 10, calculate total fee as monthly fee * applicable months
        const totalExpectedFee = student.monthlyFee * applicableMonths.length;
        
        paid = totalPaid;
        pending = Math.max(0, totalExpectedFee - totalPaid);
      } else {
        // Regular students: Monthly payment system
        applicableMonths.forEach(month => {
          const payment = payments.find(p => p.studentId.toString() === student._id.toString() && p.month === month);
          if (payment && payment.status === 'Paid') {
            paid += payment.amountPaid;
          } else {
            pending += student.monthlyFee;
          }
        });
      }
      
      totalEarnings += paid;
      totalPending += pending;
      
      return {
        studentId: student.studentId, // Use the numeric studentId, not MongoDB _id
        _id: student._id, // Keep _id for reference if needed
        name: student.name,
        class: student.class,
        status: student.status,
        enrolledAt: student.enrolledAt,
        enrollmentMonth: student.enrollmentMonth,
        leftAt: student.leftAt,
        applicableMonths: applicableMonths.length,
        isClass10,
        paid,
        pending
      };
    });
    res.json({ totalEarnings, totalPending, studentStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 