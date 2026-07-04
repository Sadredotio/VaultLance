const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  // The contract in dispute
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },

  // Who filed the dispute
  filedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Dispute Type
  type: {
    type: String,
    enum: [
      'work_not_completed',    // Freelancer didn't finish
      'work_quality_issue',    // Work is poor quality
      'payment_never_sent',    // Freelancer says they never got paid
      'work_stolen',           // Client claims work is copied
      'miscommunication',      // General disagreement
      'contract_violation',    // Terms were violated
      'other'                  // Anything else
    ],
    required: true
  },

  // Dispute Details
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },

  // Evidence (file URLs)
  evidence: {
    type: [String],
    default: []
  },

  // Dispute Status
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved', 'closed'],
    default: 'open'
  },

  // Resolution
  resolution: {
    type: String,
    enum: ['refund_client', 'pay_freelancer', 'split_payment', 'request_revision', null],
    default: null
  },
  resolutionDetails: String,

  // Admin who reviewed it
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: Date,

  // Amount to refund/pay
  amountDisputed: Number,

  // Comments from both parties
  clientComment: String,
  freelancerComment: String,
  adminComment: String,

}, { timestamps: true });

module.exports = mongoose.models.Dispute || mongoose.model('Dispute', disputeSchema);