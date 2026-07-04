const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Who did the transaction
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Transaction type
  type: {
    type: String,
    enum: [
      'deposit',           // Client adds money to wallet
      'job_posted',        // Client posts a job (funds deducted)
      'job_fund',          // Client funds a contract
      'work_release',      // Money released to freelancer
      'refund',            // Refund to client (dispute, cancellation)
      'withdrawal',        // Freelancer withdraws money
      'platform_fee'       // Admin fees
    ],
    required: true
  },

  // Related entities
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    default: null
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },

  // Money Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },

  // Payment method (for deposits/withdrawals)
  paymentMethod: {
    type: String,
    enum: ['wallet', 'credit_card', 'bank_transfer', 'paypal'],
    default: 'wallet'
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },

  razorpayOrderId: { 
    type: String,
    default: null 
  },

  razorpayPaymentId: { 
    type: String, 
    default: null 
  },
  
  payoutDetails: {
    accountHolderName: { type: String, default: null },
    accountNumber: { type: String, default: null },
    ifscCode: { type: String, default: null },
    upiId: { type: String, default: null }
  },

  relatedTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },

  // Description/Notes
  description: String,
  failureReason: String,

  // IP Address & User Agent for security
  ipAddress: String,

}, { timestamps: true });

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
