const express = require('express');
const router = express.Router();
const FeePayment = require('../models/FeePayment');

// Add or update a fee payment
router.post('/', async (req, res) => {
  try {
    const { studentId, month, status, amountPaid } = req.body;
    let payment = await FeePayment.findOne({ studentId, month });
    if (payment) {
      payment.status = status;
      payment.amountPaid = amountPaid;
      await payment.save();
    } else {
      payment = new FeePayment({ studentId, month, status, amountPaid });
      await payment.save();
    }
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all fee payments (optionally filter by studentId or month)
router.get('/', async (req, res) => {
  try {
    const { studentId, month } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (month) filter.month = month;
    const payments = await FeePayment.find(filter);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 