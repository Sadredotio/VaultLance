const express = require('express');
const router = express.Router();
const { getWallet, createOrder, withdrawFunds,verifyPayment ,getTransactionHistory } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

// Base Route: /api/wallet
router.get('/', protect, getWallet);
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/withdraw', protect, withdrawFunds);
router.get('/transactions', protect, getTransactionHistory);

module.exports = router;
