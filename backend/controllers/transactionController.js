const Transaction = require('../models/transaction');
const User = require('../models/user');

// @desc    Get all transactions (Admin view)
// @route   GET /api/transactions
// @access  Private (Admin)
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, userId } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const transactions = await Transaction.find(query)
      .populate('userId', 'name email')
      .populate('contractId', 'amount status')
      .populate('jobId', 'title budget')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
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

// @desc    Get user transaction history
// @route   GET /api/transactions/user/me
// @access  Private
const getUserTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .populate('contractId', 'jobId amount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);
    
    // Calculate summary
    const summary = await Transaction.aggregate([
      { $match: { userId: { $oid: req.user.id } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      transactions,
      summary,
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

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('contractId')
      .populate('jobId');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // User can only view their own transactions
    if (transaction.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.json(transaction);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats/summary
// @access  Private
const getTransactionStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Summary by type
    const typeStats = await Transaction.aggregate([
      { $match: { userId: { $oid: userId } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Total balance moved
    const totalDeposits = await Transaction.aggregate([
      {
        $match: {
          userId: { $oid: userId },
          type: 'deposit'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalWithdrawals = await Transaction.aggregate([
      {
        $match: {
          userId: { $oid: userId },
          type: 'withdrawal'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalSpent = await Transaction.aggregate([
      {
        $match: {
          userId: { $oid: userId },
          type: 'job_fund'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      byType: typeStats,
      summary: {
        totalDeposited: totalDeposits[0]?.total || 0,
        totalWithdrawn: totalWithdrawals[0]?.total || 0,
        totalSpent: totalSpent[0]?.total || 0,
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTransactions,
  getUserTransactions,
  getTransactionById,
  getTransactionStats
};
