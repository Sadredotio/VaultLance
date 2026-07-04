const express = require('express');
const router = express.Router();
const {
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.get('/withdrawals', protect, getPendingWithdrawals);
router.put('/withdrawals/:id/approve', protect, approveWithdrawal);
router.put('/withdrawals/:id/reject', protect, rejectWithdrawal);

module.exports = router;