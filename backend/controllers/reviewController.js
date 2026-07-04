const Review  = require('../models/review');
const Contract = require('../models/contract');
const User    = require('../models/user');

// @desc   Submit a rating for the other party after contract is released
// @route  POST /api/reviews
// @access Private
const submitReview = async (req, res) => {
  try {
    const { contractId, rating, comment } = req.body;

    if (!contractId || !rating) {
      return res.status(400).json({ message: 'contractId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Only allow reviews on released contracts
    const contract = await Contract.findById(contractId);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    if (contract.status !== 'released') {
      return res.status(400).json({ message: 'You can only review after the contract is completed' });
    }

    // Determine who is the reviewer and who is the reviewee
    const isClient     = contract.clientId.toString()     === req.user._id.toString();
    const isFreelancer = contract.freelancerId.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Not part of this contract' });
    }

    const revieweeId   = isClient ? contract.freelancerId : contract.clientId;
    const reviewerRole = isClient ? 'client' : 'freelancer';

    // Prevent duplicate review
    const existing = await Review.findOne({ contractId, reviewerId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this contract' });
    }

    // Create review
    const review = await Review.create({
      contractId,
      jobId:       contract.jobId,
      reviewerId:  req.user._id,
      revieweeId,
      rating,
      comment:     comment || '',
      reviewerRole,
    });

    // Recalculate reviewee's average rating
    const allReviews = await Review.find({ revieweeId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(revieweeId, { rating: Math.round(avg * 10) / 10 });

    await review.populate('reviewerId', 'name avatar role');

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this contract' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all reviews for a user (as reviewee)
// @route  GET /api/reviews/user/:userId
// @access Private
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ revieweeId: req.params.userId })
      .populate('reviewerId', 'name avatar role')
      .populate('jobId',      'title')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Check if current user already reviewed a contract
// @route  GET /api/reviews/check/:contractId
// @access Private
const checkReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      contractId: req.params.contractId,
      reviewerId: req.user._id,
    });
    res.json({ hasReviewed: !!review, review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitReview, getUserReviews, checkReview };