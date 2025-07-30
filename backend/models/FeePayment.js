const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  month: { type: String, required: true },
  status: { type: String, enum: ['Paid', 'Unpaid'], required: true },
  amountPaid: { type: Number, required: true },
  installmentNumber: { type: Number },
  isInstallment: { type: Boolean, default: false },
  totalInstallments: { type: Number, default: 1 }
});

module.exports = mongoose.model('FeePayment', feePaymentSchema);