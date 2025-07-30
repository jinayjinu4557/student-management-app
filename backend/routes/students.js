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

    // Create fee entries for the student based on fee type
    const allMonths = [
      'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025',
      'October 2025', 'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026',
      'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026',
      'October 2026', 'November 2026', 'December 2026', 'January 2027', 'February 2027', 'March 2027'
    ];

    const startIndex = allMonths.indexOf(req.body.enrollmentMonth);
    const endIndex = allMonths.indexOf(req.body.endMonth);
    
    if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
      // If yearly fee (10th class)
      if (req.body.feeType === 'yearly') {
        const installments = parseInt(req.body.installments) || 3;
        const yearlyFee = parseFloat(req.body.yearlyFee) || 0;
        const installmentAmount = yearlyFee / installments;
        
        // Create installment entries
        for (let i = 1; i <= installments; i++) {
          // Calculate month for this installment (evenly distributed)
          const monthIndex = Math.floor(startIndex + ((endIndex - startIndex) * (i - 1) / installments));
          const month = allMonths[monthIndex >= startIndex ? monthIndex : startIndex];
          
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
        for (let i = startIndex; i <= endIndex; i++) {
          await FeePayment.create({
            studentId: newStudent._id,
            month: allMonths[i],
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
        student.leftAt = new Date();
        student.active = false;
      } else if (req.body.status === 'Active') {
        student.leftAt = null;
        student.active = true;
      } else {
        student.active = false;
      }
    }
    
    await student.save();
    
    // If fee type or date range changed, update fee payment structure
    if (feeTypeChanged || dateRangeChanged) {
      // Delete existing fee payments that haven't been paid yet
      await FeePayment.deleteMany({ 
        studentId: student._id, 
        status: 'Unpaid' 
      });
      
      // Create new fee entries based on updated structure
      const allMonths = [
        'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025',
        'October 2025', 'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026',
        'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026',
        'October 2026', 'November 2026', 'December 2026', 'January 2027', 'February 2027', 'March 2027'
      ];

      const startIndex = allMonths.indexOf(student.enrollmentMonth);
      const endIndex = allMonths.indexOf(student.endMonth);
      
      if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
        // If yearly fee (10th class)
        if (student.feeType === 'yearly') {
          const installments = parseInt(student.installments) || 3;
          const yearlyFee = parseFloat(student.yearlyFee) || 0;
          
          // Create installment entries
          for (let i = 1; i <= installments; i++) {
            // Calculate month for this installment (evenly distributed)
            const monthIndex = Math.floor(startIndex + ((endIndex - startIndex) * (i - 1) / installments));
            const month = allMonths[monthIndex >= startIndex ? monthIndex : startIndex];
            
            await FeePayment.create({
              studentId: student._id,
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
          for (let i = startIndex; i <= endIndex; i++) {
            await FeePayment.create({
              studentId: student._id,
              month: allMonths[i],
              status: 'Unpaid',
              amountPaid: 0
            });
          }
        }
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