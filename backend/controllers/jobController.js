const Job = require('../models/job');
const Contract = require('../models/contract');

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Only Clients)
const createJob = async (req, res) => {
  try {
    const { title, description, budget } = req.body;
    const User = require('../models/user');
    const Transaction = require('../models/transaction');

    console.log(`\n📝 CREATE JOB REQUEST`);
    console.log(`User ID: ${req.user._id}`);
    console.log(`Title: ${title}`);
    console.log(`Budget: ${budget}`);

    if (!title || !description || !budget) {
      console.log(`❌ Missing fields`);
      return res.status(400).json({ message: 'Please add all fields' });
    }

    if (budget <= 0) {
      console.log(`❌ Invalid budget: ${budget}`);
      return res.status(400).json({ message: 'Budget must be greater than 0' });
    }

    // Check client has sufficient wallet balance
    console.log(`🔍 Finding client...`);
    const client = await User.findById(req.user._id);
    if (!client) {
      console.log(`❌ Client not found with ID: ${req.user._id}`);
      return res.status(404).json({ message: 'Client not found' });
    }

    console.log(`✅ Client found: ${client.email}`);
    console.log(`💰 Wallet Balance: $${client.walletBalance}, Budget: $${budget}`);

    if (client.walletBalance < budget) {
      console.log(`❌ Insufficient balance`);
      return res.status(400).json({ message: `Insufficient wallet balance. You have $${client.walletBalance}, but need $${budget}` });
    }

    // Deduct budget from client wallet
    const balanceBefore = client.walletBalance;
    client.walletBalance -= budget;
    await client.save();
    console.log(`💸 Deducted $${budget} from wallet. New balance: $${client.walletBalance}`);

    // Create job
    const job = await Job.create({
      title,
      description,
      budget,
      postedBy: req.user._id,
      status: 'open'
    });
    console.log(`✅ Job created with ID: ${job._id}`);

    // Record transaction
    await Transaction.create({
      userId: client._id,
      type: 'job_posted',
      jobId: job._id,
      amount: budget,
      balanceBefore,
      balanceAfter: client.walletBalance,
      status: 'completed',
      description: `Posted job: ${title}`,
      ipAddress: req.ip
    });
    console.log(`✅ Transaction recorded`);

    console.log(`\n✅ JOB CREATED SUCCESSFULLY`);
    res.status(201).json({
      message: 'Job posted successfully',
      job,
      newWalletBalance: client.walletBalance
    });
  } catch (error) {
    console.error(`❌ ERROR in createJob:`, error.message);
    console.error(error.stack);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all open jobs
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const jobs = await Job.find({ status: 'open' })
      .populate('postedBy', 'name avatar rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Return just the array for consistency with other endpoints
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name avatar rating headline bio');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get jobs posted by a specific client (PUBLIC - for client profile display)
// @route   GET /api/jobs/client/:clientId
// @access  Public
const getJobsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const jobs = await Job.find({ postedBy: clientId })
      .sort({ createdAt: -1 })
      .select('title status budget createdAt');

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get jobs posted by the logged-in user
// @route   GET /api/jobs/myjobs
// @access  Private
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/jobs/stats
// @access  Private
const getJobStats = async (req, res) => {
  try {
    let stats = { total: 0, open: 0, in_progress: 0, completed: 0 };

    if (req.user.role === 'client') {
      // Count Client's jobs
      stats.total = await Job.countDocuments({ postedBy: req.user._id });
      stats.open = await Job.countDocuments({ postedBy: req.user._id, status: 'open' });
      stats.in_progress = await Job.countDocuments({ postedBy: req.user._id, status: 'in_progress' });
      stats.completed = await Job.countDocuments({ postedBy: req.user._id, status: 'completed' });
    } else {
      // Count Freelancer's jobs (Based on contracts they are part of)
      const myContracts = await Contract.find({ 
        freelancerId: req.user._id,
        status: { $in: ['active', 'submission_pending', 'released'] }
      });
      const jobIds = myContracts.map(c => c.jobId);

      stats.total = myContracts.length;
      stats.in_progress = await Job.countDocuments({ _id: { $in: jobIds }, status: 'in_progress' });
      stats.completed = await Job.countDocuments({ _id: { $in: jobIds }, status: 'completed' });
      stats.open = await Contract.countDocuments({ freelancerId: req.user._id, status: 'pending' });
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Close job (client closes without selecting freelancer)
// @route   PUT /api/jobs/:id/close
// @access  Private (Client Only)
const closeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to close this job' });
    }

    if (job.status === 'closed') {
      return res.status(400).json({ message: 'Job is already closed' });
    }

    // Find any active/pending contracts for this job
    const activeContract = await Contract.findOne({
      jobId: req.params.id,
      status: { $in: ['active', 'submission_pending'] }
    });

    if (activeContract) {
      return res.status(400).json({ message: 'Cannot close job with active contract' });
    }

    job.status = 'closed';
    await job.save();

    res.json({
      message: 'Job closed successfully',
      job
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a job (only for open jobs by the client)
// @route   DELETE /api/jobs/:id
// @access  Private (Client Only)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Only allow client to delete their own job
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    // Only allow deletion of open jobs (not in_progress or completed)
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Can only delete open jobs that have no active contracts' });
    }

    // Delete the job
    await Job.findByIdAndDelete(req.params.id);

    // Refund the job budget back to the client's wallet
    const client = await User.findById(req.user._id);
    const balanceBefore = client.walletBalance;
    client.walletBalance += job.budget;
    await client.save();

    // Record transaction for job deletion refund
    await Transaction.create({
      userId: client._id,
      type: 'job_deleted_refund',
      jobId: job._id,
      amount: job.budget,
      balanceBefore,
      balanceAfter: client.walletBalance,
      status: 'completed',
      description: `Refund for deleted job: ${job.title}`,
      ipAddress: req.ip
    });

    res.json({
      message: 'Job deleted successfully and budget refunded to wallet',
      job,
      refundedAmount: job.budget,
      newWalletBalance: client.walletBalance
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createJob, 
  getJobs, 
  getJobById,
  getJobsByClient,
  getMyJobs, 
  getJobStats,
  closeJob,
  deleteJob
}; 