const User = require('../models/user');
const Transaction = require('../models/transaction');

// @desc    Get user wallet balance
// @route   GET /api/wallet
// @access  Private
const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance name email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      balance: user.walletBalance,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add funds to wallet (Client deposits money)
// @route   POST /api/wallet/add-funds
// @access  Private (Clients)
const addFunds = async (req, res) => {
  try {
    const { amount, paymentMethod = 'credit_card', description } = req.body;

    // 1. Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (amount > 999999) {
      return res.status(400).json({ message: 'Amount exceeds maximum limit' });
    }

    // 2. Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only clients can add funds
    if (user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can add funds to wallet' });
    }

    // 3. Record transaction
    const balanceBefore = user.walletBalance;
    const balanceAfter = user.walletBalance + parseFloat(amount);

    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'deposit',
      amount: parseFloat(amount),
      balanceBefore,
      balanceAfter,
      paymentMethod,
      status: 'completed',
      description: description || `Wallet deposit of $${amount}`,
      ipAddress: req.ip
    });

    // 4. Update wallet balance
    user.walletBalance = balanceAfter;
    await user.save();

    res.status(201).json({
      message: 'Funds added successfully',
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        newBalance: user.walletBalance,
        timestamp: transaction.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Withdraw funds from wallet (Freelancer cashes out)
// @route   POST /api/wallet/withdraw
// @access  Private (Freelancers)
const withdrawFunds = async (req, res) => {
  try {
    const { amount, bankAccount } = req.body;

    // 1. Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // 2. Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only freelancers can withdraw
    if (user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can withdraw funds' });
    }

    // 3. Check balance
    if (user.walletBalance < amount) {
      return res.status(400).json({ 
        message: 'Insufficient funds', 
        availableBalance: user.walletBalance,
        requestedAmount: amount
      });
    }

    // 4. Platform may take a small fee (optional - 2% fee)
    const platformFee = amount * 0.02; // 2% fee
    const netAmount = amount - platformFee;

    // 5. Record main withdrawal transaction
    const balanceBefore = user.walletBalance;
    const balanceAfter = user.walletBalance - amount;

    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'withdrawal',
      amount: parseFloat(amount),
      balanceBefore,
      balanceAfter,
      paymentMethod: 'bank_transfer',
      status: 'completed',
      description: `Withdrawal to bank account ending in ${bankAccount ? bankAccount.slice(-4) : 'XXXX'}`,
      ipAddress: req.ip
    });

    // 6. Record platform fee (if applicable)
    if (platformFee > 0) {
      await Transaction.create({
        userId: req.user.id,
        type: 'platform_fee',
        amount: platformFee,
        balanceBefore: balanceAfter,
        balanceAfter: balanceAfter,
        status: 'completed',
        description: 'Platform withdrawal fee (2%)',
        ipAddress: req.ip
      });
    }

    // 7. Update wallet balance
    user.walletBalance = balanceAfter;
    await user.save();

    res.status(201).json({
      message: 'Withdrawal processed successfully',
      transaction: {
        id: transaction._id,
        grossAmount: amount,
        platformFee: platformFee,
        netAmount: netAmount,
        status: 'completed',
        newBalance: user.walletBalance,
        timestamp: transaction.createdAt,
        estimatedArrival: '2-3 business days'
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get transaction history
// @route   GET /api/wallet/transactions
// @access  Private
const getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWallet,
  addFunds,
  withdrawFunds,
  getTransactionHistory
};
