const User = require('../models/user');
const Transaction = require('../models/transaction');
const crypto = require('crypto');
const razorpay = require('../config/razorpay');

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

// @desc    Step 1: Create a Razorpay order for adding funds
// @route   POST /api/wallet/create-order
// @access  Private (Clients)
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }
    if (amount > 999999) {
      return res.status(400).json({ message: 'Amount exceeds maximum limit' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can add funds to wallet' });
    }

    const amountInPaise = Math.round(parseFloat(amount) * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `w_${Date.now()}`,
      notes: { userId: req.user.id, purpose: 'wallet_deposit' }
    });

    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'deposit',
      amount: parseFloat(amount),
      balanceBefore: user.walletBalance,
      balanceAfter: user.walletBalance,
      paymentMethod: 'credit_card',
      status: 'pending',
      description: `Wallet deposit of ₹${amount} (awaiting payment)`,
      ipAddress: req.ip,
      razorpayOrderId: order.id
    });

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      transactionId: transaction._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Step 2: Verify Razorpay payment signature and credit wallet
// @route   POST /api/wallet/verify-payment
// @access  Private (Clients)
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    const transaction = await Transaction.findOne({
      razorpayOrderId: razorpay_order_id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'completed') {
      const user = await User.findById(req.user.id);
      return res.json({
        message: 'Payment already verified',
        transaction: { id: transaction._id, amount: transaction.amount, newBalance: user.walletBalance }
      });
    }

    const user = await User.findById(req.user.id);
    const balanceAfter = user.walletBalance + transaction.amount;

    user.walletBalance = balanceAfter;
    await user.save();

    transaction.status = 'completed';
    transaction.balanceAfter = balanceAfter;
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.description = `Wallet deposit of ₹${transaction.amount} (verified)`;
    await transaction.save();

    res.json({
      message: 'Payment verified and funds added successfully',
      transaction: { id: transaction._id, amount: transaction.amount, newBalance: user.walletBalance }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Withdraw funds from wallet (Freelancer requests a cash-out)
// @route   POST /api/wallet/withdraw
// @access  Private (Freelancers)
const withdrawFunds = async (req, res) => {
  try {
    const { amount, accountHolderName, accountNumber, ifscCode, upiId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (!accountHolderName) {
      return res.status(400).json({ message: 'Account holder name is required' });
    }

    const hasBankDetails = accountNumber && ifscCode;
    const hasUpi = !!upiId;
    if (!hasBankDetails && !hasUpi) {
      return res.status(400).json({ message: 'Provide either bank account + IFSC, or a UPI ID' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can withdraw funds' });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({
        message: 'Insufficient funds',
        availableBalance: user.walletBalance,
        requestedAmount: amount
      });
    }

    const platformFee = parseFloat((amount * 0.02).toFixed(2));
    const netAmount = parseFloat((amount - platformFee).toFixed(2));

    const balanceBefore = user.walletBalance;
    const balanceAfter = user.walletBalance - amount;

    const payoutDetails = {
      accountHolderName,
      accountNumber: hasBankDetails ? accountNumber : null,
      ifscCode: hasBankDetails ? ifscCode : null,
      upiId: hasUpi ? upiId : null
    };

    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'withdrawal',
      amount: parseFloat(amount),
      balanceBefore,
      balanceAfter,
      paymentMethod: hasUpi ? 'wallet' : 'bank_transfer',
      status: 'pending',
      description: hasBankDetails
        ? `Withdrawal to bank account ending in ${accountNumber.slice(-4)} (awaiting admin approval)`
        : `Withdrawal to UPI ${upiId} (awaiting admin approval)`,
      ipAddress: req.ip,
      payoutDetails
    });

    if (platformFee > 0) {
      const feeTransaction = await Transaction.create({
        userId: req.user.id,
        type: 'platform_fee',
        amount: platformFee,
        balanceBefore: balanceAfter,
        balanceAfter: balanceAfter,
        status: 'pending',
        description: 'Platform withdrawal fee (2%) — pending withdrawal approval',
        ipAddress: req.ip,
        relatedTransactionId: transaction._id
      });
      transaction.relatedTransactionId = feeTransaction._id;
      await transaction.save();
    }

    user.walletBalance = balanceAfter;
    await user.save();

    res.status(201).json({
      message: 'Withdrawal request submitted and is awaiting admin approval',
      transaction: {
        id: transaction._id,
        grossAmount: amount,
        platformFee,
        netAmount,
        status: 'pending',
        newBalance: user.walletBalance,
        timestamp: transaction.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List all pending withdrawal requests
// @route   GET /api/admin/withdrawals
// @access  Private (Admin)
const getPendingWithdrawals = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const withdrawals = await Transaction.find({ type: 'withdrawal', status: 'pending' })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a withdrawal — confirms the admin has manually sent the money
// @route   PUT /api/admin/withdrawals/:id/approve
// @access  Private (Admin)
const approveWithdrawal = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || transaction.type !== 'withdrawal') {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: `Withdrawal is already ${transaction.status}` });
    }

    transaction.status = 'completed';
    transaction.description += ' — approved and paid out';
    await transaction.save();

    if (transaction.relatedTransactionId) {
      await Transaction.findByIdAndUpdate(transaction.relatedTransactionId, { status: 'completed' });
    }

    res.json({ message: 'Withdrawal approved', transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a withdrawal — refunds the wallet
// @route   PUT /api/admin/withdrawals/:id/reject
// @access  Private (Admin)
const rejectWithdrawal = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { reason } = req.body;

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || transaction.type !== 'withdrawal') {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: `Withdrawal is already ${transaction.status}` });
    }

    const user = await User.findById(transaction.userId);
    if (user) {
      user.walletBalance += transaction.amount;
      await user.save();
    }

    transaction.status = 'failed';
    transaction.failureReason = reason || 'Rejected by admin';
    await transaction.save();

    if (transaction.relatedTransactionId) {
      await Transaction.findByIdAndUpdate(transaction.relatedTransactionId, {
        status: 'failed',
        failureReason: reason || 'Withdrawal rejected'
      });
    }

    res.json({ message: 'Withdrawal rejected and funds refunded to wallet', transaction });
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
  createOrder,
  verifyPayment,
  withdrawFunds,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getTransactionHistory
};