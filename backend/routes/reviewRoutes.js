const express = require('express');
const router  = express.Router();
const { submitReview, getUserReviews, checkReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',                   protect, submitReview);
router.get('/user/:userId',        protect, getUserReviews);
router.get('/check/:contractId',   protect, checkReview);

module.exports = router;