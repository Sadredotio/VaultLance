const express = require('express');
const router = express.Router();
const { 
  getAllTransactions, 
  getUserTransactions, 
  getTransactionById, 
  getTransactionStats 
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// Base Route: /api/transactions

// IMPORTANT: Specific routes MUST come BEFORE generic :id route
router.get('/user/me', protect, getUserTransactions); // Get user's transactions
router.get('/stats/summary', protect, getTransactionStats); // Get stats

router.get('/', protect, getAllTransactions); // Admin view all
router.get('/:id', protect, getTransactionById); // Get specific transaction

module.exports = router;
