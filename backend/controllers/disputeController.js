const Dispute = require('../models/dispute');
const Contract = require('../models/contract');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const sendEmail = require('../utils/sendEmail');

// @desc    File a dispute for a contract
// @route   POST /api/disputes
// @access  Private (Client or Freelancer)
const fileDispute = async (req, res) => {
  try {
    const { contractId, type, title, description, evidence } = req.body;

    // 1. Validation
    if (!contractId || !type || !title || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 2. Find contract
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // 3. Only client or freelancer can file dispute
    if (contract.clientId.toString() !== req.user.id && contract.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to file dispute' });
    }

    // 4. Can't dispute if not in active or submitted state
    if (!['active', 'submission_pending', 'released'].includes(contract.status)) {
      return res.status(400).json({ message: 'Cannot dispute contract in current status' });
    }

    // 5. Create dispute
    const dispute = await Dispute.create({
      contractId,
      filedBy: req.user.id,
      type,
      title,
      description,
      evidence: evidence || [],
      amountDisputed: contract.amount,
      status: 'open'
    });

    // 6. Update contract status to disputed
    contract.status = 'disputed';
    await contract.save();

    // 7. Notify both parties and admin
    const client = await User.findById(contract.clientId);
    const freelancer = await User.findById(contract.freelancerId);
    const filer = await User.findById(req.user.id);

    await sendEmail({
      email: client.email,
      subject: `Dispute Filed - Contract #${contractId}`,
      message: `A dispute has been filed for contract "${contract.jobId}". Our support team will review it within 24 hours.`
    });

    await sendEmail({
      email: freelancer.email,
      subject: `Dispute Filed - Contract #${contractId}`,
      message: `A dispute has been filed for contract "${contract.jobId}". Our support team will review it within 24 hours.`
    });

    res.status(201).json({
      message: 'Dispute filed successfully',
      dispute: {
        id: dispute._id,
        status: dispute.status,
        type: dispute.type,
        title: dispute.title,
        contractId: dispute.contractId,
        createdAt: dispute.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all disputes (Admin view)
// @route   GET /api/disputes
// @access  Private (Admin)
const getAllDisputes = async (req, res) => {
  try {
    const { status = 'open', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const disputes = await Dispute.find(query)
      .populate('contractId', 'jobId clientId freelancerId amount')
      .populate('filedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Dispute.countDocuments(query);

    res.json({
      disputes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's disputes
// @route   GET /api/disputes/user/me
// @access  Private
const getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({
      $or: [
        { filedBy: req.user.id },
        { 'contractId.clientId': req.user.id },
        { 'contractId.freelancerId': req.user.id }
      ]
    })
      .populate('contractId', 'jobId clientId freelancerId amount')
      .populate('filedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(disputes);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dispute by ID
// @route   GET /api/disputes/:id
// @access  Private
const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('contractId')
      .populate('filedBy', 'name email')
      .populate('reviewedBy', 'name email');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    res.json(dispute);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment to dispute
// @route   PUT /api/disputes/:id/comment
// @access  Private
const addDisputeComment = async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Only client, freelancer, or admin can comment
    const contract = await Contract.findById(dispute.contractId);
    const isAuthorized = 
      dispute.filedBy.toString() === req.user.id ||
      contract.clientId.toString() === req.user.id ||
      contract.freelancerId.toString() === req.user.id ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to comment' });
    }

    // Add comment based on role
    if (req.user.id === contract.clientId.toString()) {
      dispute.clientComment = comment;
    } else if (req.user.id === contract.freelancerId.toString()) {
      dispute.freelancerComment = comment;
    } else if (req.user.role === 'admin') {
      dispute.adminComment = comment;
    }

    if (dispute.status === 'open') {
      dispute.status = 'in_review';
    }

    await dispute.save();

    res.json({
      message: 'Comment added successfully',
      dispute
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve dispute (Admin only)
// @route   PUT /api/disputes/:id/resolve
// @access  Private (Admin)
const resolveDispute = async (req, res) => {
  try {
    const { resolution, resolutionDetails, adminComment } = req.body;

    // Only admin can resolve
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can resolve disputes' });
    }

    if (!['refund_client', 'pay_freelancer', 'split_payment'].includes(resolution)) {
      return res.status(400).json({ message: 'Invalid resolution type' });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    const contract = await Contract.findById(dispute.contractId);
    const client = await User.findById(contract.clientId);
    const freelancer = await User.findById(contract.freelancerId);

    // Handle different resolution types
    if (resolution === 'refund_client') {
      // Client backed out, refund their money
      client.walletBalance += contract.amount;
      await client.save();

      await Transaction.create({
        userId: client._id,
        type: 'refund',
        amount: contract.amount,
        balanceBefore: client.walletBalance - contract.amount,
        balanceAfter: client.walletBalance,
        contractId: contract._id,
        status: 'completed',
        description: `Dispute refund - ${resolutionDetails}`
      });
    } else if (resolution === 'pay_freelancer') {
      // Release full amount to freelancer
      freelancer.walletBalance += contract.amount;
      await freelancer.save();

      await Transaction.create({
        userId: freelancer._id,
        type: 'work_release',
        amount: contract.amount,
        balanceBefore: freelancer.walletBalance - contract.amount,
        balanceAfter: freelancer.walletBalance,
        contractId: contract._id,
        status: 'completed',
        description: `Dispute resolution - Full payment to freelancer`
      });
    } else if (resolution === 'split_payment') {
      // Split amount between client and freelancer
      const splitAmount = contract.amount / 2;

      client.walletBalance += splitAmount;
      freelancer.walletBalance += splitAmount;
      await client.save();
      await freelancer.save();

      await Transaction.create({
        userId: client._id,
        type: 'refund',
        amount: splitAmount,
        balanceBefore: client.walletBalance - splitAmount,
        balanceAfter: client.walletBalance,
        contractId: contract._id,
        status: 'completed',
        description: `Dispute resolution - Split payment (50%)`
      });

      await Transaction.create({
        userId: freelancer._id,
        type: 'work_release',
        amount: splitAmount,
        balanceBefore: freelancer.walletBalance - splitAmount,
        balanceAfter: freelancer.walletBalance,
        contractId: contract._id,
        status: 'completed',
        description: `Dispute resolution - Split payment (50%)`
      });
    }

    // Update dispute
    dispute.resolution = resolution;
    dispute.resolutionDetails = resolutionDetails;
    dispute.adminComment = adminComment;
    dispute.reviewedBy = req.user.id;
    dispute.reviewedAt = new Date();
    dispute.status = 'resolved';
    await dispute.save();

    // Update contract
    contract.status = 'released';
    await contract.save();

    // Notify both parties
    await sendEmail({
      email: client.email,
      subject: `Dispute Resolved - Contract #${contract._id}`,
      message: `Your dispute has been resolved. Resolution: ${resolution}. ${resolutionDetails}`
    });

    await sendEmail({
      email: freelancer.email,
      subject: `Dispute Resolved - Contract #${contract._id}`,
      message: `The dispute for your contract has been resolved. Resolution: ${resolution}. ${resolutionDetails}`
    });

    res.json({
      message: 'Dispute resolved',
      dispute
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  fileDispute,
  getAllDisputes,
  getMyDisputes,
  getDisputeById,
  addDisputeComment,
  resolveDispute
};
