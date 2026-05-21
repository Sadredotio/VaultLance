const express = require('express');
const router = express.Router();
const { getWallet, addFunds, withdrawFunds, getTransactionHistory } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

// Base Route: /api/wallet
router.get('/', protect, getWallet);
router.post('/add-funds', protect, addFunds);
router.post('/withdraw', protect, withdrawFunds);
router.get('/transactions', protect, getTransactionHistory);

module.exports = router;
