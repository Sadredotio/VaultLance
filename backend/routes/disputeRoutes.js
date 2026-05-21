const express = require('express');
const router = express.Router();
const {
  fileDispute,
  getAllDisputes,
  getMyDisputes,
  getDisputeById,
  addDisputeComment,
  resolveDispute
} = require('../controllers/disputeController');
const { protect } = require('../middleware/authMiddleware');

// Base Route: /api/disputes

// IMPORTANT: Specific routes and POST operations MUST come BEFORE generic :id route
router.post('/', protect, fileDispute); // File a dispute
router.get('/user/me', protect, getMyDisputes); // Get user's disputes

router.get('/', protect, getAllDisputes); // Admin view all disputes
router.get('/:id', protect, getDisputeById); // Get specific dispute
router.put('/:id/comment', protect, addDisputeComment); // Add comment/evidence
router.put('/:id/resolve', protect, resolveDispute); // Admin resolve dispute

module.exports = router;
