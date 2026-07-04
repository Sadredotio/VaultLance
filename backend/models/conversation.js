const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    // Exactly two participants: client + freelancer
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    // Optional context: which job/contract this conversation is about
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      default: null,
    },
    lastMessage: {
      text: String,
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: Date,
    },
  },
  { timestamps: true }
);

// Prevent duplicate conversations between the same two participants for the same job
conversationSchema.index({ participants: 1, jobId: 1 });

module.exports =
  mongoose.models.Conversation ||
  mongoose.model('Conversation', conversationSchema);