const express = require('express');
const router = express.Router();
const { 
  createContract, 
  fundContract, 
  releaseFunds,
  approveWork,
  getContracts,
  getFreelancerStats,
  getContractById,
  applyForJob, 
  acceptApplication, 
  rejectApplication,
  submitWork,
  cancelContract
} = require('../controllers/contractController');
const { protect } = require('../middleware/authMiddleware');

// Base Route: /api/contracts

// IMPORTANT: Specific routes MUST come BEFORE generic :id route

router.post('/apply', protect, applyForJob); // Freelancer applies to job

router.get('/', protect, getContracts); // Get all user's contracts
router.post('/', protect, createContract); // Create a proposal (client creates for freelancer)

router.get('/stats/freelancer', protect, getFreelancerStats); // Freelancer dashboard stats

router.get('/:id', protect, getContractById); // Get specific contract
router.put('/:id/accept', protect, acceptApplication); // Client accepts application
router.put('/:id/reject', protect, rejectApplication); // Client rejects application
router.post('/:id/fund', protect, fundContract); // Client funds contract (money locked in escrow)
router.put('/:id/submit-work', protect, submitWork); // Freelancer submits work
router.post('/:id/approve', protect, approveWork); // Client approves work & releases funds
router.post('/:id/release', protect, releaseFunds); // Legacy: Client approves and releases funds
router.put('/:id/cancel', protect, cancelContract); // Cancel contract (if not started)

module.exports = router;