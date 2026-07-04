const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/user');
const Transaction = require('../models/transaction');

// @desc    Razorpay webhook — confirms payments independently of the browser
// @route   POST /api/wallet/webhook
// @access  Public (verified via signature, not auth)
// NOTE: this route is mounted with express.raw() in server.js so req.body is a Buffer here
router.post('/', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error('❌ RAZORPAY_WEBHOOK_SECRET is not set');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');

    if (signature !== expected) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      const transaction = await Transaction.findOne({ razorpayOrderId: orderId });

      // Idempotency: only act if still pending (verify-payment endpoint may have already handled it)
      if (transaction && transaction.status === 'pending') {
        const user = await User.findById(transaction.userId);
        if (user) {
          const balanceAfter = user.walletBalance + transaction.amount;
          user.walletBalance = balanceAfter;
          await user.save();

          transaction.status = 'completed';
          transaction.balanceAfter = balanceAfter;
          transaction.razorpayPaymentId = payment.id;
          transaction.description = `Wallet deposit of ₹${transaction.amount} (verified via webhook)`;
          await transaction.save();
        }
      }
    }

    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id;
      await Transaction.findOneAndUpdate(
        { razorpayOrderId: orderId, status: 'pending' },
        {
          status: 'failed',
          failureReason: event.payload.payment.entity.error_description || 'Payment failed'
        }
      );
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;