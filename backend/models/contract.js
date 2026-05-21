const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // The agreed price
  
  // THE MOST CRITICAL PART: THE ESCROW STATES
  status: { 
    type: String, 
    enum: [
        'pending',            // Freelancer applied, waiting for Client approval
        'new',                // Client accepted, but not funded yet
        'funded',             // Client locked money in Escrow
        'active',             // Work in progress
        'submission_pending', // Freelancer finished work, waiting for approval
        'released',           // Client approved, money sent to Freelancer
        'disputed',           // Something went wrong, Dispute filed
        'cancelled'           // Contract killed before work started
    ],
    default: 'pending'
  },
  
  // Freelancer withdrawal status (for earned money)
  freelancerWithdrawalStatus: {
    type: String,
    enum: ['pending', 'withdrawn', 'requested'],
    default: 'pending'
  },
  freelancerWithdrawnAt: Date,

  terms: { type: String, required: true },
  
  // Work submission tracking
  workSubmittedAt: Date,
  workSubmissionNotes: String,
  
  // Client approval tracking
  clientApprovedAt: Date,
  clientApprovalNotes: String,

  // Cancellation info
  cancelledBy: { type: String }, // 'client' or 'freelancer'
  cancellationReason: String,

}, { timestamps: true });

module.exports = mongoose.models.Contract || mongoose.model('Contract', contractSchema);