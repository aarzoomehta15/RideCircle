const express = require('express');
const { body, validationResult } = require('express-validator');
const Pool = require('../models/Pool');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/pools
// @desc    Create a new pool
// @access  Private
router.post('/', protect, [
  body('source').trim().notEmpty().withMessage('Source location is required'),
  body('destination').trim().notEmpty().withMessage('Destination is required'),
  body('sourceCoords.lat').isNumeric().withMessage('Source latitude is required'),
  body('sourceCoords.lng').isNumeric().withMessage('Source longitude is required'),
  body('destCoords.lat').isNumeric().withMessage('Destination latitude is required'),
  body('destCoords.lng').isNumeric().withMessage('Destination longitude is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
  body('maxSeats').isInt({ min: 2, max: 6 }).withMessage('Max seats must be between 2 and 6'),
  body('fare').isFloat({ min: 1 }).withMessage('Fare must be at least 1'),
  body('type').optional().isIn(['open', 'women-only', 'community']).withMessage('Invalid pool type')
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

    const { type } = req.body;
    const creator = await User.findById(req.user._id);

    // NEW SECURITY LOGIC: Restrict pool creation based on user attributes
    if (type === 'women-only' && creator.gender === 'male') {
        return res.status(403).json({
            message: 'Male users cannot create "Women Only" pools.'
        });
    }

    if (type === 'community' && (!creator.community || creator.community.length === 0)) {
        return res.status(400).json({
            message: 'You must belong to at least one community to create a "Community Members Only" pool.'
        });
    }

    const poolData = {
      ...req.body,
      createdBy: req.user._id,
      participants: [{
        user: req.user._id,
        joinedAt: new Date(),
        status: 'joined'
      }]
    };

    const pool = await Pool.create(poolData);

    // Populate creator info
    await pool.populate('createdBy', 'name email phone trustScore community');
    await pool.populate('participants.user', 'name email phone trustScore');

    res.status(201).json({
      message: 'Pool created successfully',
      pool
    });
  } catch (error) {
    console.error('Create pool error:', error);
    res.status(500).json({
      message: 'Server error during pool creation'
    });
  }
});

// @route   GET /api/pools
// @desc    Get pools with filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // CHANGE: Removed 'community' from destructuring, filtering is now client-side logic
    const { status = 'upcoming', type, date } = req.query;

    let filter = { status };

    // Add type filter
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Add date filter
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    // CHANGE: Removed server-side community filtering entirely to rely on robust client-side visibility logic.
    
    const pools = await Pool.find(filter)
      .populate('createdBy', 'name email phone trustScore community')
      .populate('participants.user', 'name email phone trustScore')
      .sort({ date: 1, time: 1 });

    res.json({
      pools,
      count: pools.length
    });
  } catch (error) {
    console.error('Get pools error:', error);
    res.status(500).json({
      message: 'Server error during pool retrieval'
    });
  }
});

// @route   GET /api/pools/my-pools
// @desc    Get user's pools (created and joined)
// @access  Private
router.get('/my-pools', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find pools created by user
    const createdPools = await Pool.find({ createdBy: userId })
      .populate('createdBy', 'name email phone trustScore')
      .populate('participants.user', 'name email phone trustScore')
      .sort({ date: -1 });

    // Find pools where user is a participant
    const joinedPools = await Pool.find({
      'participants.user': userId,
      'participants.status': 'joined',
      createdBy: { $ne: userId } // Exclude pools created by user
    })
      .populate('createdBy', 'name email phone trustScore')
      .populate('participants.user', 'name email phone trustScore')
      .sort({ date: -1 });

    res.json({
      pools: [...createdPools, ...joinedPools]
    });
  } catch (error) {
    console.error('Get my pools error:', error);
    res.status(500).json({
      message: 'Server error during pool retrieval'
    });
  }
});

// @route   GET /api/pools/:id
// @desc    Get pool by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id)
      .populate('createdBy', 'name email phone trustScore community')
      .populate('participants.user', 'name email phone trustScore');

    if (!pool) {
      return res.status(404).json({
        message: 'Pool not found'
      });
    }

    res.json({ pool });
  } catch (error) {
    console.error('Get pool by ID error:', error);
    res.status(500).json({
      message: 'Server error during pool retrieval'
    });
  }
});

// @route   POST /api/pools/:id/join
// @desc    Join a pool
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);

    if (!pool) {
      return res.status(404).json({
        message: 'Pool not found'
      });
    }

    // Check if pool is upcoming
    if (pool.status !== 'upcoming') {
      return res.status(400).json({
        message: 'Cannot join a pool that is not upcoming'
      });
    }

    // Check if user is already a participant
    const existingParticipant = pool.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (existingParticipant && existingParticipant.status === 'joined') {
      return res.status(400).json({
        message: 'You are already a participant in this pool'
      });
    }

    // Check available seats
    const activeParticipants = pool.participants.filter(p => p.status === 'joined').length;
    if (activeParticipants >= pool.maxSeats) {
      return res.status(400).json({
        message: 'Pool is full'
      });
    }

    const user = await User.findById(req.user._id);

    // Check pool type restrictions
    if (pool.type === 'women-only') {
      if (user.gender !== 'female') {
        return res.status(403).json({
          message: 'This pool is restricted to women only'
        });
      }
    }

    if (pool.type === 'community') {
      const creator = await User.findById(pool.createdBy);
      
      // CORE LOGIC: Check for intersection between creator's communities and user's communities.
      const creatorCommunities = creator.community || [];
      const userCommunities = user.community || [];
      
      const isCommunityMember = creatorCommunities.some(c => userCommunities.includes(c));

      if (!isCommunityMember) {
        return res.status(403).json({
          message: 'This pool is restricted to community members only'
        });
      }
    }

    // Add user to participants
    if (existingParticipant) {
      existingParticipant.status = 'joined';
      existingParticipant.joinedAt = new Date();
    } else {
      pool.participants.push({
        user: req.user._id,
        joinedAt: new Date(),
        status: 'joined'
      });
    }

    await pool.save();

    // Populate and return updated pool
    await pool.populate('createdBy', 'name email phone trustScore');
    await pool.populate('participants.user', 'name email phone trustScore');

    res.json({
      message: 'Successfully joined the pool',
      pool
    });
  } catch (error) {
    console.error('Join pool error:', error);
    res.status(500).json({
      message: 'Server error during pool join'
    });
  }
});

// @route   POST /api/pools/:id/leave
// @desc    Leave a pool
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);

    if (!pool) {
      return res.status(404).json({
        message: 'Pool not found'
      });
    }

    // Check if user is the creator
    if (pool.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Pool creator cannot leave the pool. Delete the pool instead.'
      });
    }

    // Find user in participants
    const participantIndex = pool.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );

    if (participantIndex === -1 || pool.participants[participantIndex].status !== 'joined') {
      return res.status(400).json({
        message: 'You are not a participant in this pool'
      });
    }

    // Update participant status
    pool.participants[participantIndex].status = 'left';

    await pool.save();

    res.json({
      message: 'Successfully left the pool'
    });
  } catch (error) {
    console.error('Leave pool error:', error);
    res.status(500).json({
      message: 'Server error during pool leave'
    });
  }
});

// @route   PATCH /api/pools/:id/status
// @desc    Update pool status
// @access  Private
router.patch('/:id/status', protect, [
  body('status').isIn(['upcoming', 'ongoing', 'completed', 'cancelled']).withMessage('Invalid status')
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

    const pool = await Pool.findById(req.params.id);

    if (!pool) {
      return res.status(404).json({
        message: 'Pool not found'
      });
    }

    // Check if user is the creator
    if (pool.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Only pool creator can update pool status'
      });
    }

    pool.status = req.body.status;
    await pool.save();

    res.json({
      message: 'Pool status updated successfully',
      pool
    });
  } catch (error) {
    console.error('Update pool status error:', error);
    res.status(500).json({
      message: 'Server error during status update'
    });
  }
});

// @route   DELETE /api/pools/:id
// @desc    Delete a pool
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);

    if (!pool) {
      return res.status(404).json({
        message: 'Pool not found'
      });
    }

    // Check if user is the creator
    if (pool.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Only pool creator can delete the pool'
      });
    }

    // Check if pool has other participants
    const activeParticipants = pool.participants.filter(p => p.status === 'joined').length;
    if (activeParticipants > 1) {
      return res.status(400).json({
        message: 'Cannot delete pool with active participants. Cancel the pool instead.'
      });
    }

    await Pool.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Pool deleted successfully'
    });
  } catch (error) {
    console.error('Delete pool error:', error);
    res.status(500).json({
      message: 'Server error during pool deletion'
    });
  }
});

module.exports = router;