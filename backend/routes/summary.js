const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const FeePayment = require('../models/FeePayment');

const academicYearMonths = [
  'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025',
  'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026', 'April 2026'
];

// Helper function to get applicable months for a student based on enrollment, end month and status
const getApplicableMonths = (enrollmentMonth, endMonth, studentStatus, leftAt) => {
  const startIndex = academicYearMonths.indexOf(enrollmentMonth);
  if (startIndex === -1) {
    return []; // Return empty if enrollment month not found
  }
  
  let finalEndIndex;
  
  // If student has left, use the earlier of leftAt date or endMonth
  if (studentStatus === 'Left' && leftAt) {
    const leftDate = new Date(leftAt);
    const leftMonth = leftDate.getMonth();
    
    // Map left month to academic year month
    const monthMapping = {
      5: 'June 2025', 6: 'July 2025', 7: 'August 2025', 8: 'September 2025',
      9: 'October 2025', 10: 'November 2025', 11: 'December 2025',
      0: 'January 2026', 1: 'February 2026', 2: 'March 2026', 3: 'April 2026'
    };
    
    const leftMonthLabel = monthMapping[leftMonth];
    const leftIndex = leftMonthLabel ? academicYearMonths.indexOf(leftMonthLabel) : -1;
    const endMonthIndex = endMonth ? academicYearMonths.indexOf(endMonth) : -1;
    
    // Use the earlier of left date or end month
    if (leftIndex !== -1 && endMonthIndex !== -1) {
      finalEndIndex = Math.min(leftIndex, endMonthIndex);
    } else if (leftIndex !== -1) {
      finalEndIndex = leftIndex;
    } else if (endMonthIndex !== -1) {
      finalEndIndex = endMonthIndex;
    } else {
      return [enrollmentMonth];
    }
  } 
  // For active students, use endMonth if provided, otherwise April
  else {
    if (endMonth) {
      finalEndIndex = academicYearMonths.indexOf(endMonth);
      if (finalEndIndex === -1) {
        finalEndIndex = academicYearMonths.length - 1; // Default to April
      }
    } else {
      finalEndIndex = academicYearMonths.length - 1; // Default to April
    }
  }
  
  // Ensure end index is not before start index
  if (finalEndIndex < startIndex) {
    return [enrollmentMonth];
  }
  
  return academicYearMonths.slice(startIndex, finalEndIndex + 1);
};

// Helper function to check if student is in class 10
const isClass10Student = (studentClass) => {
  return studentClass === '10' || studentClass === 'Class 10' || studentClass.toLowerCase().includes('10');
};

// Get earnings and pending summary for the academic year
router.get('/', async (req, res) => {
  try {
    // Fetch all students but we'll handle status in calculation
    const students = await Student.find({ active: { $ne: false } });
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
      
      // Get applicable months based on enrollment month, end month and status - REAL TIME CALCULATION
      const enrollmentMonth = student.enrollmentMonth || 'June 2025';
      const endMonth = student.endMonth;
      const applicableMonths = getApplicableMonths(enrollmentMonth, endMonth, student.status, student.leftAt);
      const isClass10 = isClass10Student(student.class);
      
      // Calculate fees based on student type
      if (isClass10) {
        // Class 10 students: Yearly fee system with installments (original logic)
        const currentStudentPayments = payments.filter(p => p.studentId.toString() === student._id.toString());
        const totalPaid = currentStudentPayments.reduce((sum, payment) => {
          if (payment.status === 'Paid' && payment.amountPaid) {
            return sum + Number(payment.amountPaid);
          }
          return sum;
        }, 0);
        
        // For Class 10, use full yearly fee (installment system)
        // Class 10 yearly fees are contractual installments, not monthly-based
        let totalExpectedFee;
        if (student.yearlyFee && student.yearlyFee > 0) {
          // Use FULL yearly fee - installments are contractual
          totalExpectedFee = student.yearlyFee;
        } else {
          // Fallback: if no yearly fee set, calculate from monthly fee
          totalExpectedFee = (student.monthlyFee || 1000) * 11;
        }
        
        paid = Math.round(totalPaid);
        pending = Math.max(0, Math.round(totalExpectedFee) - Math.round(totalPaid));
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
        feeType: isClass10 ? 'yearly' : (student.feeType || 'monthly'), // Correct fee type
        applicableMonths: applicableMonths.length,
        applicableMonthsList: applicableMonths, // Send the actual months array
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