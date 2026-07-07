const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { isAdmin, getAnalytics } = require('../controllers/adminController');
const { trackAnonymous } = require('../middleware/trackVisitor');

const {
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} = require('../controllers/walletController');

// Public tracking
router.post('/track', trackAnonymous);
router.get('/track', trackAnonymous);

// Admin Analytics
router.get('/analytics', protect, isAdmin, getAnalytics);

// Admin Withdrawals
router.get('/withdrawals', protect, isAdmin, getPendingWithdrawals);
router.put('/withdrawals/:id/approve', protect, isAdmin, approveWithdrawal);
router.put('/withdrawals/:id/reject', protect, isAdmin, rejectWithdrawal);

module.exports = router;