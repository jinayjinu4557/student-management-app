const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Counter = require('../models/Counter');
const FeePayment = require('../models/FeePayment');

// Enroll a new student with auto-increment studentId
router.post('/', async (req, res) => {
  try {
    // Find the highest studentId
    const highestStudent = await Student.findOne().sort('-studentId');
    const nextStudentId = highestStudent ? highestStudent.studentId + 1 : 1;

    const newStudent = new Student({
      ...req.body,
      studentId: nextStudentId
    });

    await newStudent.save();

    // Create fee entries for the student based on fee type using academic year months
    const academicYearMonths = [
      'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025',
      'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026', 'April 2026'
    ];

    // Helper function to get applicable months for new student
    const getApplicableMonths = (enrollmentMonth, endMonth, studentStatus, leftAt) => {
      const startIndex = academicYearMonths.indexOf(enrollmentMonth);
      if (startIndex === -1) {
        return [];
      }
      
      let finalEndIndex;
      
      // If student has left, use the earlier of leftAt date or endMonth
      if (studentStatus === 'Left' && leftAt) {
        const leftDate = new Date(leftAt);
        const leftMonth = leftDate.getMonth();
        
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

    const applicableMonths = getApplicableMonths(req.body.enrollmentMonth, req.body.endMonth, req.body.status, req.body.leftAt);
    console.log(`New student ${req.body.name} applicable months: [${applicableMonths.join(', ')}]`);
    
    if (applicableMonths.length > 0) {
      // If yearly fee (10th class)
      if (req.body.feeType === 'yearly') {
        const installments = parseInt(req.body.installments) || 3;
        const yearlyFee = parseFloat(req.body.yearlyFee) || 0;
        
        // Create installment entries based on applicable months
        for (let i = 1; i <= installments; i++) {
          const monthIndex = Math.floor((applicableMonths.length * (i - 1)) / installments);
          const month = applicableMonths[monthIndex] || applicableMonths[0];
          
          await FeePayment.create({
            studentId: newStudent._id,
            month: `Installment ${i} (${month})`,
            status: 'Unpaid',
            amountPaid: 0,
            isInstallment: true,
            installmentNumber: i,
            totalInstallments: installments
          });
        }
      } 
      // If monthly fee (other classes)
      else {
        for (const month of applicableMonths) {
          await FeePayment.create({
            studentId: newStudent._id,
            month: month,
            status: 'Unpaid',
            amountPaid: 0
          });
        }
      }
    }

    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ message: 'Error enrolling student' });
  }
});

// Get all active students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({ active: { $ne: false } });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update student details by studentId
router.put('/:studentId', async (req, res) => {
  if (!req.params.studentId || isNaN(Number(req.params.studentId))) {
    return res.status(400).json({ error: 'Invalid studentId' });
  }
  try {
    // Always use studentId field for finding students in the database
    const student = await Student.findOne({ studentId: req.params.studentId });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Check if fee type is changing
    const oldFeeType = student.feeType || 'monthly';
    const newFeeType = req.body.feeType || oldFeeType;
    const feeTypeChanged = oldFeeType !== newFeeType;
    
    // Check if enrollment or end month is changing
    const oldEnrollmentMonth = student.enrollmentMonth;
    const newEnrollmentMonth = req.body.enrollmentMonth || oldEnrollmentMonth;
    const oldEndMonth = student.endMonth || 'March 2026';
    const newEndMonth = req.body.endMonth || oldEndMonth;
    const dateRangeChanged = oldEnrollmentMonth !== newEnrollmentMonth || oldEndMonth !== newEndMonth;
    
    // Update student fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        student[key] = req.body[key];
      }
    });
    
    // Handle status changes
    if (req.body.status && req.body.status !== student.status) {
      if (req.body.status === 'Left') {
        // Use provided leftAt date or current date
        student.leftAt = req.body.leftAt ? new Date(req.body.leftAt) : new Date();
        student.active = false;
        console.log(`Student ${student.name} marked as Left on: ${student.leftAt}`);
      } else if (req.body.status === 'Active') {
        student.leftAt = null;
        student.active = true;
        console.log(`Student ${student.name} marked as Active`);
      } else {
        student.active = false;
        console.log(`Student ${student.name} status changed to: ${req.body.status}`);
      }
    }
    
    // Also handle leftAt date updates independently
    if (req.body.leftAt !== undefined) {
      student.leftAt = req.body.leftAt ? new Date(req.body.leftAt) : null;
      console.log(`Student ${student.name} leftAt date updated to: ${student.leftAt}`);
    }
    
    await student.save();
    
    // Check if status changed (especially to/from Left)
    const statusChanged = req.body.status && req.body.status !== student.status;
    const leftAtChanged = req.body.leftAt !== undefined;
    
    // If fee type, date range, status, or leftAt changed, update fee payment structure
    if (feeTypeChanged || dateRangeChanged || statusChanged || leftAtChanged) {
      console.log(`Recalculating fees for ${student.name} due to: ${feeTypeChanged ? 'fee type' : ''} ${dateRangeChanged ? 'date range' : ''} ${statusChanged ? 'status' : ''} ${leftAtChanged ? 'left date' : ''} changes`);
      
      // First, get the new applicable months to know what to keep/delete
      const academicYearMonths = [
        'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025',
        'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026', 'April 2026'
      ];
      
      // Helper function to get applicable months (same as summary route)
      const getApplicableMonths = (enrollmentMonth, endMonth, studentStatus, leftAt) => {
        const startIndex = academicYearMonths.indexOf(enrollmentMonth);
        if (startIndex === -1) {
          return [];
        }
        
        let finalEndIndex;
        
        // If student has left, use the earlier of leftAt date or endMonth
        if (studentStatus === 'Left' && leftAt) {
          const leftDate = new Date(leftAt);
          const leftMonth = leftDate.getMonth();
          
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
      
      // Get the actual applicable months for this student
      const applicableMonths = getApplicableMonths(student.enrollmentMonth, student.endMonth, student.status, student.leftAt);
      console.log(`Student ${student.name} applicable months: [${applicableMonths.join(', ')}]`);
      
      // Delete existing fee payments that are NOT in applicable months or are unpaid
      const existingPayments = await FeePayment.find({ studentId: student._id });
      for (const payment of existingPayments) {
        const shouldDelete = payment.status === 'Unpaid' || 
                           (!applicableMonths.includes(payment.month) && !payment.isInstallment);
        
        if (shouldDelete) {
          console.log(`Deleting fee payment for ${payment.month} (${payment.status})`);
          await FeePayment.deleteOne({ _id: payment._id });
        } else {
          console.log(`Keeping fee payment for ${payment.month} (${payment.status})`);
        }
      }
      
      // Create new fee entries only for months that don't already have paid entries

      // Create fee entries for applicable months that don't already exist
      if (applicableMonths.length > 0) {
        // Get remaining existing payments after deletion
        const remainingPayments = await FeePayment.find({ studentId: student._id });
        const existingMonths = remainingPayments.map(p => p.month);
        
        // If yearly fee (10th class)
        if (student.feeType === 'yearly') {
          const installments = parseInt(student.installments) || 3;
          const yearlyFee = parseFloat(student.yearlyFee) || 0;
          const totalApplicableMonths = applicableMonths.length;
          
          console.log(`Creating ${installments} installments for ${totalApplicableMonths} applicable months`);
          
          // Create installment entries based on actual applicable months
          for (let i = 1; i <= installments; i++) {
            const installmentMonth = `Installment ${i}`;
            const monthExists = existingMonths.some(m => m.startsWith(installmentMonth));
            
            if (!monthExists) {
              // Distribute installments across applicable months
              const monthIndex = Math.floor((totalApplicableMonths * (i - 1)) / installments);
              const month = applicableMonths[monthIndex] || applicableMonths[0];
              
              await FeePayment.create({
                studentId: student._id,
                month: `Installment ${i} (${month})`,
                status: 'Unpaid',
                amountPaid: 0,
                isInstallment: true,
                installmentNumber: i,
                totalInstallments: installments
              });
              console.log(`Created installment ${i} for month ${month}`);
            } else {
              console.log(`Installment ${i} already exists, skipping`);
            }
          }
        } 
        // If monthly fee (other classes)
        else {
          console.log(`Creating monthly fee entries for ${applicableMonths.length} months`);
          for (const month of applicableMonths) {
            if (!existingMonths.includes(month)) {
              await FeePayment.create({
                studentId: student._id,
                month: month,
                status: 'Unpaid',
                amountPaid: 0
              });
              console.log(`Created fee entry for ${month}`);
            } else {
              console.log(`Fee entry for ${month} already exists, skipping`);
            }
          }
        }
      } else {
        console.log(`No applicable months found for student ${student.name}`);
      }
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:studentId', async (req, res) => {
  if (!req.params.studentId || isNaN(Number(req.params.studentId))) {
    return res.status(400).json({ error: 'Invalid studentId' });
  }
  try {
    // Always use studentId field for finding and deleting students in the database
    const student = await Student.findOneAndDelete(
      { studentId: req.params.studentId }
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    // Also delete all associated fee payments
    await FeePayment.deleteMany({ studentId: student._id });
    
    res.json({ message: 'Student deleted successfully', student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;