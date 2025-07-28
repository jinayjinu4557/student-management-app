const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const FeePayment = require('../models/FeePayment');

const academicYearMonths = [
  'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025',
  'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026', 'April 2026'
];

// Get earnings and pending summary for the academic year
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    const payments = await FeePayment.find();
    let totalEarnings = 0;
    let totalPending = 0;
    const studentStats = students.map(student => {
      let paid = 0;
      let pending = 0;
      academicYearMonths.forEach(month => {
        const payment = payments.find(p => p.studentId.toString() === student._id.toString() && p.month === month);
        if (payment && payment.status === 'Paid') {
          paid += payment.amountPaid;
        } else {
          pending += student.monthlyFee;
        }
      });
      totalEarnings += paid;
      totalPending += pending;
      return {
        studentId: student._id,
        name: student.name,
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