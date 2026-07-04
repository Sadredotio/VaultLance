const Contract = require('../models/contract');
const User = require('../models/user');
const Job = require('../models/job');
const Transaction = require('../models/transaction');
const sendEmail = require('../utils/sendEmail');

// @desc    Create a new Contract Proposal
// @route   POST /api/contracts
// @access  Private
const createContract = async (req, res) => {
  const { jobId, freelancerId, amount, terms } = req.body;

  // 1. Validation
  if (!jobId || !freelancerId || !amount) {
    return res.status(400).json({ message: 'Missing required fields! Please field all details' });
  }

  // 2. Create the Contract (Status: "new")
  const contract = await Contract.create({
    jobId,
    clientId: req.user._id, // The logged-in user is the Client
    freelancerId,
    amount,
    terms,
    status: 'new'
  });

  res.status(201).json(contract);
};



// @desc    Client deposits money into Escrow
// @route   POST /api/contracts/:id/fund
// @access  Private (Client Only)
const fundContract = async (req, res) => {
  const contractId = req.params.id;

  try {
    // 1. Find the Contract
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // 2. Find the Client (User)
    const client = await User.findById(req.user._id);

    // 3. Security Checks
    if (contract.clientId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to fund this contract' });
    }
    if (contract.status !== 'new' && contract.status !== 'pending') {
      return res.status(400).json({ message: 'Contract is already funded or closed' });
    }

    // --- THE TRANSACTION LOGIC ---
    // Note: Money was already deducted when job was posted
    // Now we're just confirming the escrow and starting the work

    // A. Record transaction for contract funding
    await Transaction.create({
      userId: client._id,
      type: 'job_fund',
      contractId: contract._id,
      jobId: contract.jobId,
      amount: contract.amount,
      balanceBefore: client.walletBalance,
      balanceAfter: client.walletBalance,
      status: 'completed',
      description: `Funded contract for job - moved to escrow`,
      ipAddress: req.ip
    });

    // B. Update Contract Status to "Active" (Money is now in Escrow)
    contract.status = 'active';
    await contract.save();

    // C. Note: Job status already updated to 'in_progress' when contract was accepted

    // D. Notify freelancer
    const freelancer = await User.findById(contract.freelancerId);
    await sendEmail({
      email: freelancer.email,
      subject: 'Contract Funded - Work Ready to Begin',
      message: `Great news! The client has funded your contract. You can now begin working on the project.`
    });

    res.json({ 
      message: 'Contract funded successfully - work in progress!', 
      walletBalance: client.walletBalance,
      contractStatus: contract.status,
      jobStatus: 'in_progress'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Release funds to Freelancer (after client approves work)
// @route   POST /api/contracts/:id/release
// @access  Private (Client Only)
const releaseFunds = async (req, res) => {
  const contractId = req.params.id;

  try {
    const contract = await Contract.findById(contractId);
    if (!contract || contract.status !== 'submission_pending') {
      return res.status(400).json({ message: 'Contract must be in submission_pending status to release funds' });
    }

    // Verify User is the Client
    if (contract.clientId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized! Use correct credentials' });
    }

    // --- THE RELEASE LOGIC ---

    // 1. Find Freelancer and Client
    const freelancer = await User.findById(contract.freelancerId);
    const client = await User.findById(contract.clientId);
    
    // 2. Record transaction for freelancer (money received)
    const freelancerBalanceBefore = freelancer.walletBalance;
    freelancer.walletBalance += contract.amount;
    await freelancer.save();

    await Transaction.create({
      userId: contract.freelancerId,
      type: 'work_release',
      contractId: contract._id,
      jobId: contract.jobId,
      amount: contract.amount,
      balanceBefore: freelancerBalanceBefore,
      balanceAfter: freelancer.walletBalance,
      status: 'completed',
      description: `Payment released for completed work`,
      ipAddress: req.ip
    });

    // 3. Update contract
    contract.status = 'released';
    contract.clientApprovedAt = new Date();
    contract.clientApprovalNotes = req.body.approvalNotes || 'Work approved';
    await contract.save();

    // 4. Update Job Status to 'completed'
    await Job.findByIdAndUpdate(contract.jobId, { status: 'completed' });

    // 5. Send notifications
    await sendEmail({
      email: freelancer.email,
      subject: 'Payment Released',
      message: `Your work has been approved! Payment of $${contract.amount} has been released to your wallet.`
    });

    await sendEmail({
      email: client.email,
      subject: 'Work Completed and Approved',
      message: `You have approved the work and payment of $${contract.amount} has been sent to the freelancer.`
    });

    res.json({ 
      message: 'Funds released successfully!',
      freelancerNewBalance: freelancer.walletBalance,
      contractStatus: contract.status
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all contracts for a user
// @route   GET /api/contracts
// @access  Private
const getContracts = async (req, res) => {
    // Find contracts where the user is either the client or freelancer
    const contracts = await Contract.find({
        $or: [{ clientId: req.user._id }, { freelancerId: req.user._id }]
    })
      .populate('jobId', 'title description budget status')
      .populate('clientId', 'name avatar')
      .populate('freelancerId', 'name avatar rating headline experience skills')
      .sort({ createdAt: -1 });
    res.json(contracts);
};

// @desc    Get dashboard stats for a freelancer (based on their contracts)
// @route   GET /api/contracts/stats/freelancer
// @access  Private (Freelancer)
const getFreelancerStats = async (req, res) => {
  try {
    const freelancerId = req.user._id;

    const total = await Contract.countDocuments({ freelancerId });
    // "Open" = contracts ready to work on / submit (active), plus legacy 'new' ones awaiting funding
    const open = await Contract.countDocuments({ freelancerId, status: { $in: ['active', 'new'] } });
    // "In Progress" = work submitted, waiting on client review
    const in_progress = await Contract.countDocuments({ freelancerId, status: 'submission_pending' });
    // "Completed" = client approved, payment released
    const completed = await Contract.countDocuments({ freelancerId, status: 'released' });

    res.json({ total, open, in_progress, completed });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const applyForJob = async (req, res) => {
  try {
      const { jobId, budget } = req.body;

      // 1. Find the Job in the database to get the Client's ID
      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ message: "Job not found" });

      // 1.5. Check if Job status is 'open' - prevent applying to in-progress or completed jobs
      if (job.status !== 'open') {
        return res.status(400).json({ 
          message: `This job is no longer available for applications. Current status: ${job.status}` 
        });
      }

      // 2. Check if Freelancer already applied
      const existing = await Contract.findOne({ jobId, freelancerId: req.user._id });
      if (existing) return res.status(400).json({ message: "You already applied to this job." });

      // 3. Create contract WITH Client ID and Terms included!
      const contract = await Contract.create({
          jobId,
          clientId: job.postedBy, // <-- Connects to the new job's owner
          freelancerId: req.user._id,
          amount: budget,
          terms: "Standard application terms.", // <-- Fixes the 'terms' error
          status: 'pending' 
      });

      // 4. Send notification to client
      const client = await User.findById(job.postedBy);
      const freelancer = await User.findById(req.user._id);
      await sendEmail({
        email: client.email,
        subject: 'New Freelancer Application',
        message: `Freelancer ${freelancer.name} has applied to your job "${job.title}".`
      });

      res.status(201).json(contract);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Accept freelancer application
// @route   PUT /api/contracts/:id/accept
// @access  Private (Client Only)
const acceptApplication = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    if (contract.clientId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (contract.status !== 'pending') {
      return res.status(400).json({ message: 'Application already processed' });
    }

    // Money was already deducted from client's wallet when the job was posted,
    // so there's nothing left to "fund" separately — go straight to active.
    contract.status = 'active'; // Ready for freelancer to start work / submit
    await contract.save();

    // Update job status from 'open' to 'in_progress'
    await Job.findByIdAndUpdate(contract.jobId, { status: 'in_progress' });

    // Send notification to freelancer
    const freelancer = await User.findById(contract.freelancerId);
    const client = await User.findById(req.user._id);
    const job = await Job.findById(contract.jobId);

    // Record the funding transaction now, since escrow is confirmed at acceptance
    await Transaction.create({
      userId: client._id,
      type: 'job_fund',
      contractId: contract._id,
      jobId: contract.jobId,
      amount: contract.amount,
      balanceBefore: client.walletBalance,
      balanceAfter: client.walletBalance,
      status: 'completed',
      description: `Contract funded automatically on acceptance - escrow confirmed for "${job.title}"`,
      ipAddress: req.ip
    });

    await sendEmail({
      email: freelancer.email,
      subject: '🎉 Your Application was Accepted!',
      message: `Congratulations! Client ${client.name} has accepted your application for the job "${job.title}". The payment is locked in escrow — you can start work right away!`
    });

    res.json({ 
      message: 'Application accepted and contract funded', 
      contract,
      jobStatus: 'in_progress'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject freelancer application
// @route   PUT /api/contracts/:id/reject
// @access  Private (Client Only)
const rejectApplication = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    if (contract.clientId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (contract.status !== 'pending') {
      return res.status(400).json({ message: 'Application already processed' });
    }

    contract.status = 'cancelled';
    await contract.save();

    res.json({ message: 'Application rejected', contract });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Freelancer submits completed work
// @route   PUT /api/contracts/:id/submit-work
// @access  Private (Freelancer Only)
const submitWork = async (req, res) => {
  try {
    const { submissionNotes, deliverables } = req.body;

    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    // Only freelancer can submit work
    if (contract.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Contract must be active
    if (contract.status !== 'active') {
      return res.status(400).json({ message: 'Contract is not active' });
    }

    // Update contract
    contract.status = 'submission_pending';
    contract.workSubmittedAt = new Date();
    contract.workSubmissionNotes = submissionNotes || 'Work completed and ready for review';
    await contract.save();

    // Update job status to 'pending' (awaiting approval)
    await Job.findByIdAndUpdate(contract.jobId, { status: 'pending' });

    // Notify client
    const client = await User.findById(contract.clientId);
    const freelancer = await User.findById(req.user._id);

    await sendEmail({
      email: client.email,
      subject: 'Work Submitted - Ready for Review',
      message: `Freelancer ${freelancer.name} has submitted their work for review. Please check and approve or request revisions.`
    });

    res.json({
      message: 'Work submitted successfully',
      contract,
      status: 'submission_pending',
      jobStatus: 'pending'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel contract (before work starts)
// @route   PUT /api/contracts/:id/cancel
// @access  Private (Client or Freelancer)
const cancelContract = async (req, res) => {
  try {
    const { reason } = req.body;

    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    // Only client or freelancer can cancel
    const isClient = contract.clientId.toString() === req.user._id.toString();
    const isFreelancer = contract.freelancerId.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Can only cancel if not already active or completed
    if (['active', 'submission_pending', 'released', 'disputed'].includes(contract.status)) {
      return res.status(400).json({ message: 'Cannot cancel contract in current status' });
    }

    // If money was locked (funded status), refund client
    if (contract.status === 'funded') {
      const client = await User.findById(contract.clientId);
      client.walletBalance += contract.amount;
      await client.save();

      await Transaction.create({
        userId: client._id,
        type: 'refund',
        contractId: contract._id,
        jobId: contract.jobId,
        amount: contract.amount,
        balanceBefore: client.walletBalance - contract.amount,
        balanceAfter: client.walletBalance,
        status: 'completed',
        description: `Contract cancelled - refund to client`,
        ipAddress: req.ip
      });
    }

    contract.status = 'cancelled';
    contract.cancelledBy = isClient ? 'client' : 'freelancer';
    contract.cancellationReason = reason;
    await contract.save();

    res.json({ message: 'Contract cancelled', contract });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get contract details
// @route   GET /api/contracts/:id
// @access  Private
const getContractById = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('jobId', 'title description budget')
      .populate('clientId', 'name email rating')
      .populate('freelancerId', 'name email skills rating');

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Only client or freelancer can view contract
    if (contract.clientId._id.toString() !== req.user._id.toString() && contract.freelancerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this contract' });
    }

    res.json(contract);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve Work = Release Funds (after client approves work)
// @route   POST /api/contracts/:id/approve
// @access  Private (Client Only)
const approveWork = async (req, res) => {
  const contractId = req.params.id;

  try {
    const contract = await Contract.findById(contractId);
    if (!contract || contract.status !== 'submission_pending') {
      return res.status(400).json({ message: 'Contract must be in submission_pending status to approve work' });
    }

    // Verify User is the Client
    if (contract.clientId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized! Only client can approve work.' });
    }

    // --- THE APPROVAL & FUND RELEASE LOGIC ---

    // 1. Find Freelancer, Client, and Job
    const freelancer = await User.findById(contract.freelancerId);
    const client = await User.findById(contract.clientId);
    const job = await Job.findById(contract.jobId);

    // 2. Release payment to freelancer
    const freelancerBalanceBefore = freelancer.walletBalance;
    freelancer.walletBalance += contract.amount;
    await freelancer.save();

    await Transaction.create({
      userId: contract.freelancerId,
      type: 'work_release',
      contractId: contract._id,
      jobId: contract.jobId,
      amount: contract.amount,
      balanceBefore: freelancerBalanceBefore,
      balanceAfter: freelancer.walletBalance,
      status: 'completed',
      description: `Payment released for completed work - Amount: $${contract.amount}`,
      ipAddress: req.ip
    });

    // 3. Refund difference to client if freelancer bid less than job budget
    const refundAmount = job.budget - contract.amount;
    if (refundAmount > 0) {
      const clientBalanceBefore = client.walletBalance;
      client.walletBalance += refundAmount;
      await client.save();

      await Transaction.create({
        userId: client._id,
        type: 'refund',
        contractId: contract._id,
        jobId: contract.jobId,
        amount: refundAmount,
        balanceBefore: clientBalanceBefore,
        balanceAfter: client.walletBalance,
        status: 'completed',
        description: `Escrow refund: job budget $${job.budget} - freelancer paid $${contract.amount} = $${refundAmount} returned`,
        ipAddress: req.ip
      });
    }

    // 4. Update contract
    contract.status = 'released';
    contract.clientApprovedAt = new Date();
    contract.clientApprovalNotes = req.body.approvalNotes || 'Work approved by client';
    await contract.save();

    // 5. Update Job Status to 'completed'
    await Job.findByIdAndUpdate(contract.jobId, { status: 'completed' });

    // 6. Send notifications
    await sendEmail({
      email: freelancer.email,
      subject: '💰 Payment Released - Work Approved!',
      message: `Congratulations! Your work has been approved. Payment of $${contract.amount} has been released to your wallet.`
    });

    await sendEmail({
      email: client.email,
      subject: '✅ Work Completed & Payment Sent',
      message: `You have approved the work. Payment of $${contract.amount} has been transferred to the freelancer.${refundAmount > 0 ? ` A refund of $${refundAmount} (unused escrow) has been returned to your wallet.` : ''}`
    });

    res.json({ 
      message: 'Work approved! Funds released to freelancer wallet.',
      freelancerNewBalance: freelancer.walletBalance,
      clientRefund: refundAmount > 0 ? refundAmount : 0,
      clientNewBalance: client.walletBalance,
      contractStatus: contract.status,
      jobStatus: 'completed'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createContract, 
  fundContract, 
  releaseFunds,
  approveWork,
  getContracts,
  getFreelancerStats,
  getContractById,
  applyForJob, 
  acceptApplication, 
  rejectApplication,
  submitWork,
  cancelContract
};