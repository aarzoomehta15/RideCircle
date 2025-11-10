const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Pool = require('../models/Pool');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit feedback for a ride
// @access  Private
router.post('/', protect, [
  body('rideId').isMongoId().withMessage('Valid ride ID is required'),
  body('ratedUserId').isMongoId().withMessage('Valid user ID is required'),
  body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment too long'),
  body('safetyFlag').optional().isBoolean().withMessage('Safety flag must be boolean'),
  body('categories.punctuality').optional().isInt({ min: 1, max: 5 }).withMessage('Invalid punctuality rating'),
  body('categories.safety').optional().isInt({ min: 1, max: 5 }).withMessage('Invalid safety rating'),
  body('categories.communication').optional().isInt({ min: 1, max: 5 }).withMessage('Invalid communication rating'),
  body('categories.vehicle').optional().isInt({ min: 1, max: 5 }).withMessage('Invalid vehicle rating')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { rideId, ratedUserId, score, comment, safetyFlag, categories } = req.body;
    const raterId = req.user._id;

    // Check if ride exists and is completed
    const pool = await Pool.findById(rideId);
    if (!pool) {
      return res.status(404).json({
        message: 'Ride not found'
      });
    }

    if (pool.status !== 'completed') {
      return res.status(400).json({
        message: 'Can only submit feedback for completed rides'
      });
    }

    // Check if rater was a participant in the ride
    const wasParticipant = pool.participants.some(
      p => p.user.toString() === raterId.toString() && p.status === 'joined'
    );

    if (!wasParticipant) {
      return res.status(403).json({
        message: 'Only ride participants can submit feedback'
      });
    }

    // Check if rated user was a participant
    const ratedUserWasParticipant = pool.participants.some(
      p => p.user.toString() === ratedUserId.toString() && p.status === 'joined'
    );

    if (!ratedUserWasParticipant) {
      return res.status(400).json({
        message: 'Rated user was not a participant in this ride'
      });
    }

    // Prevent self-feedback
    if (raterId.toString() === ratedUserId.toString()) {
      return res.status(400).json({
        message: 'Cannot submit feedback for yourself'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      rideId,
      raterId,
      ratedUserId
    });

    if (existingFeedback) {
      return res.status(400).json({
        message: 'Feedback already submitted for this user in this ride'
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      rideId,
      raterId,
      ratedUserId,
      score,
      comment,
      safetyFlag: safetyFlag || false,
      categories: categories || {}
    });

    // Update user's trust score based on feedback
    await updateTrustScore(ratedUserId);

    // Populate feedback data
    await feedback.populate('raterId', 'name email');
    await feedback.populate('ratedUserId', 'name email');

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      message: 'Server error during feedback submission'
    });
  }
});

// @route   GET /api/feedback/user/:userId
// @desc    Get feedback for a specific user
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ ratedUserId: req.params.userId })
      .populate('raterId', 'name email')
      .populate('rideId', 'source destination date')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const totalScore = feedbacks.reduce((sum, f) => sum + f.score, 0);
    const averageRating = feedbacks.length > 0 ? (totalScore / feedbacks.length).toFixed(1) : 0;

    res.json({
      feedbacks,
      summary: {
        totalFeedbacks: feedbacks.length,
        averageRating: parseFloat(averageRating)
      }
    });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      message: 'Server error during feedback retrieval'
    });
  }
});

// @route   GET /api/feedback/pool/:poolId
// @desc    Get feedback for a specific pool
// @access  Private
router.get('/pool/:poolId', protect, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ rideId: req.params.poolId })
      .populate('raterId', 'name email')
      .populate('ratedUserId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ feedbacks });
  } catch (error) {
    console.error('Get pool feedback error:', error);
    res.status(500).json({
      message: 'Server error during feedback retrieval'
    });
  }
});

// @route   GET /api/feedback/my-feedback
// @desc    Get feedback submitted by current user
// @access  Private
router.get('/my-feedback', protect, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ raterId: req.user._id })
      .populate('ratedUserId', 'name email')
      .populate('rideId', 'source destination date')
      .sort({ createdAt: -1 });

    res.json({ feedbacks });
  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({
      message: 'Server error during feedback retrieval'
    });
  }
});

// Helper function to update trust score
async function updateTrustScore(userId) {
  try {
    const feedbacks = await Feedback.find({ ratedUserId: userId });

    if (feedbacks.length === 0) return;

    // Calculate weighted average (recent feedback has more weight)
    const now = new Date();
    let totalScore = 0;
    let totalWeight = 0;

    feedbacks.forEach(feedback => {
      const daysDiff = Math.max(1, (now - feedback.createdAt) / (1000 * 60 * 60 * 24));
      const weight = 1 / daysDiff; // More recent = higher weight
      totalScore += feedback.score * weight;
      totalWeight += weight;
    });

    const averageScore = totalScore / totalWeight;
    const trustScore = Math.min(100, Math.max(0, (averageScore / 5) * 100));

    // Update user's trust score
    await User.findByIdAndUpdate(userId, { trustScore: Math.round(trustScore) });
  } catch (error) {
    console.error('Error updating trust score:', error);
  }
}

module.exports = router;
