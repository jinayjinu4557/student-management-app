const express = require('express');
const router = express.Router();
const FeePayment = require('../models/FeePayment');

// Add or update a fee payment
router.post('/', async (req, res) => {
  try {
    const { studentId, month, status, amountPaid, isInstallment, installmentNumber, totalInstallments } = req.body;
    
    // Validate required fields
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }
    
    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Ensure we're using MongoDB ObjectId for studentId
    // This ensures consistent ID handling across the application
    // Validate that studentId is a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: 'Invalid Student ID format' });
    }
    
    // Check if the student exists
    const Student = require('../models/Student');
    const studentExists = await Student.findById(studentId);
    if (!studentExists) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    console.log('Creating/updating payment with data:', {
      studentId, 
      month, 
      status, 
      amountPaid, 
      isInstallment, 
      installmentNumber, 
      totalInstallments
    });
    
    // For installment-based payments
    if (isInstallment) {
      let payment = await FeePayment.findOne({ 
        studentId, 
        isInstallment: true,
        installmentNumber
      });
      
      if (payment) {
        console.log('Found existing installment payment:', payment._id);
        payment.status = status;
        payment.amountPaid = amountPaid;
        payment.month = month; // Update month in case it changed
        const updatedPayment = await payment.save();
        console.log('Updated installment payment:', updatedPayment._id);
        res.status(200).json(updatedPayment);
      } else {
        console.log('Creating new installment payment');
        payment = new FeePayment({ 
          studentId, 
          month, 
          status, 
          amountPaid,
          isInstallment: true,
          installmentNumber,
          totalInstallments: totalInstallments || 3
        });
        const newPayment = await payment.save();
        console.log('Created new installment payment:', newPayment._id);
        res.status(201).json(newPayment);
      }
    } 
    // For regular monthly payments
    else {
      let payment = await FeePayment.findOne({ 
        studentId, 
        month,
        isInstallment: { $ne: true } // Make sure we don't match installment payments
      });
      
      if (payment) {
        console.log('Found existing monthly payment:', payment._id);
        payment.status = status;
        payment.amountPaid = amountPaid;
        const updatedPayment = await payment.save();
        console.log('Updated monthly payment:', updatedPayment._id);
        res.status(200).json(updatedPayment);
      } else {
        console.log('Creating new monthly payment');
        payment = new FeePayment({ 
          studentId, 
          month, 
          status, 
          amountPaid,
          isInstallment: false
        });
        const newPayment = await payment.save();
        console.log('Created new monthly payment:', newPayment._id);
        res.status(201).json(newPayment);
      }
    }
  } catch (err) {
    console.error('Error adding/updating fee payment:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get all fee payments (optionally filter by studentId or month)
router.get('/', async (req, res) => {
  try {
    const { studentId, month, isInstallment } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (month) filter.month = month;
    if (isInstallment !== undefined) filter.isInstallment = isInstallment === 'true';
    
    // Populate student data to ensure consistent ID handling
    // Make sure we handle null studentId values properly
    const payments = await FeePayment.find(filter).populate({
      path: 'studentId',
      select: 'studentId name class',
      // Don't throw an error if studentId is null or invalid
      options: { retainNullValues: true }
    });
    
    res.json(payments);
  } catch (err) {
    console.error('Error fetching fee payments:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a specific fee payment by ID
router.put('/:id', async (req, res) => {
  try {
    const { status, amountPaid } = req.body;
    const payment = await FeePayment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Update payment fields
    if (status !== undefined) payment.status = status;
    if (amountPaid !== undefined) payment.amountPaid = amountPaid;
    
    const updatedPayment = await payment.save();
    console.log('Payment updated successfully:', updatedPayment);
    
    // Get the updated payment with populated student data
    const populatedPayment = await FeePayment.findById(updatedPayment._id).populate('studentId');
    res.json(populatedPayment);
  } catch (err) {
    console.error('Error updating fee payment:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;