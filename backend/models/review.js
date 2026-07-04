const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  contractId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  jobId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job',      required: true },
  reviewerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true }, // who wrote it
  revieweeId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true }, // who is rated
  rating:      { type: Number, required: true, min: 1, max: 5 },
  comment:     { type: String, default: '' },
  reviewerRole:{ type: String, enum: ['client', 'freelancer'], required: true }, // role of the reviewer
}, { timestamps: true });

// One review per contract per reviewer
reviewSchema.index({ contractId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);