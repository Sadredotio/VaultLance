const express = require('express');
const router = express.Router();
const { createJob, getJobs, getJobById, getJobsByClient, getMyJobs, getJobStats, closeJob, deleteJob } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

// Route: /api/jobs
router.route('/')
  .get(getJobs)              // Public: Anyone can see jobs
  .post(protect, createJob); // Private: Only logged-in users can post

// IMPORTANT: Specific routes MUST come BEFORE generic :id route
// Route: /api/jobs/myjobs
router.get('/myjobs', protect, getMyJobs); // Private: Get user's jobs

// Route: /api/jobs/stats
router.get('/stats', protect, getJobStats); // Private: Get dashboard stats

// Route: /api/jobs/client/:clientId (Public: Get jobs by a specific client)
router.get('/client/:clientId', getJobsByClient); // Public: Get jobs posted by a client

// Route: /api/jobs/:id (MUST be last because it's a catch-all)
router.get('/:id', getJobById); // Public: Get job details
router.put('/:id/close', protect, closeJob); // Private: Close job
router.delete('/:id', protect, deleteJob); // Private: Delete job (client only)

module.exports = router;