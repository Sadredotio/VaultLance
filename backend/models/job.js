const mongoose = require('mongoose');


const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },

  // Detailed project requirements — what exactly needs to be done
  requirements: { type: String, required: true },

  // Expected timeline / deadline for the project (free text, e.g. "2 weeks", "by July 15")
  timeline: { type: String, required: true },

  // Skills the freelancer must have for this job
  skillsRequired: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'At least one required skill must be specified'
    }
  },

  // What success looks like — the deliverables/outcomes expected at completion
  expectedOutcomes: { type: String, required: true },

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