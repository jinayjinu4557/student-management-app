const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  month: { type: String, required: true },
  status: { type: String, enum: ['Paid', 'Unpaid'], required: true },
  amountPaid: { type: Number, required: true }
});

module.exports = mongoose.model('FeePayment', feePaymentSchema); 