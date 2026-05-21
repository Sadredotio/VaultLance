const mongoose = require('mongoose');


const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  postedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Links to the User model
    required: true 
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'pending', 'completed', 'closed'],
    default: 'open'
  }
}, { timestamps: true });

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);