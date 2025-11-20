const express = require('express');
const { body, validationResult } = require('express-validator');
const Pool = require('../models/Pool');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper to check if time has passed today (for input validation)
const isTimeInPast = (date, time) => {
  const today = new Date().toISOString().split('T')[0];
  if (date !== today) return false;

  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  
  // Create a Date object for the selected time today. Allow a 5 minute buffer.
  const selectedTime = new Date();
  selectedTime.setHours(hours, minutes, 0, 0);

  return selectedTime.getTime() < now.getTime() - 5 * 60 * 1000;
};

// Helper to calculate late cancellation penalty (within 60 minutes)
const isLateCancellation = (poolDate, poolTime) => {
  const [hours, minutes] = poolTime.split(':').map(Number);
  const poolDateTime = new Date(poolDate);
  poolDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const diffInMinutes = (poolDateTime.getTime() - now.getTime()) / (1000 * 60);

  // Late cancellation if ride is in the future but less than 60 minutes away.
  return diffInMinutes > 0 && diffInMinutes < 60;
};

// Helper to update user trust score - deducts 5 points
async function deductTrustScore(userId) {
    try {
        const user = await User.findById(userId);
        if (user) {
            // Deduct 5 points, but ensure score doesn't go below 0
            const newScore = Math.max(0, user.trustScore - 5);
            await User.findByIdAndUpdate(userId, { trustScore: newScore });
            return true;
        }
    } catch (error) {
        console.error('Error deducting trust score:', error);
    }
    return false;
}

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

    const { type, date, time } = req.body;
    const creator = await User.findById(req.user._id);

    // NEW VALIDATION: Prevent setting a time that is in the past for today
    if (isTimeInPast(date, time)) {
        return res.status(400).json({
            message: 'Cannot create a pool for a time that has already passed today.'
        });
    }

    // SECURITY LOGIC: Restrict pool creation based on user attributes
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

    // FIX: Include 'gender' in population
    await pool.populate('createdBy', 'name email phone trustScore community gender');
    await pool.populate('participants.user', 'name email phone trustScore gender');

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
    
    const pools = await Pool.find(filter)
      // FIX: Include 'gender' in population
      .populate('createdBy', 'name email phone trustScore community gender')
      .populate('participants.user', 'name email phone trustScore gender')
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
      // FIX: Include 'gender' in population
      .populate('createdBy', 'name email phone trustScore gender')
      .populate('participants.user', 'name email phone trustScore gender')
      .sort({ date: -1 });

    // Find pools where user is a participant
    const joinedPools = await Pool.find({
      'participants.user': userId,
      'participants.status': 'joined',
      createdBy: { $ne: userId } // Exclude pools created by user
    })
      // FIX: Include 'gender' in population
      .populate('createdBy', 'name email phone trustScore gender')
      .populate('participants.user', 'name email phone trustScore gender')
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

// NEW ROUTE: Automated cleanup endpoint
// @route   GET /api/pools/cleanup-old-pools
// @desc    Cleans up pools older than 14 days
// @access  Private (Accessed on Dashboard load)
router.get('/cleanup-old-pools', protect, async (req, res) => {
    try {
        // Calculate the date 14 days ago
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

        // Delete pools that are 'completed' and were last updated over 14 days ago.
        const result = await Pool.deleteMany({
            status: 'completed',
            updatedAt: { $lt: fourteenDaysAgo }
        });

        res.json({
            message: `Cleanup successful. Deleted ${result.deletedCount} old completed pools.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Cleanup old pools error:', error);
        res.status(500).json({
            message: 'Server error during pool cleanup'
        });
    }
});


// @route   GET /api/pools/:id
// @desc    Get pool by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id)
      // FIX: Include 'gender' in population
      .populate('createdBy', 'name email phone trustScore community gender')
      .populate('participants.user', 'name email phone trustScore gender');

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

    // FIX: Include 'gender' in population
    await pool.populate('createdBy', 'name email phone trustScore gender');
    await pool.populate('participants.user', 'name email phone trustScore gender');

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
// @desc    Leave a pool (Participant Action)
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);

    if (!pool) {
      return res.status(404).json({
        message: 'Pool not found'
      });
    }

    // Check if pool is upcoming - cannot leave an ongoing/completed ride
    if (pool.status !== 'upcoming') {
        return res.status(400).json({
            message: 'Cannot leave a pool that is not upcoming.'
        });
    }

    // Check if user is the creator (Creator must use 'Cancel Pool' via status update)
    if (pool.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Pool creator cannot leave the pool. Use the "Cancel Pool" option instead.'
      });
    }

    // Find user in participants
    const participantIndex = pool.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );

    if (participantIndex === -1 || pool.participants[participantIndex].status !== 'joined') {
      return res.status(400).json({
        message: 'You are not an active participant in this pool'
      });
    }
    
    // NEW LOGIC: Check for late cancellation penalty
    const isLate = isLateCancellation(pool.date, pool.time);
    let penaltyApplied = false;

    if (isLate) {
        const deductionSuccess = await deductTrustScore(req.user._id);
        if (deductionSuccess) {
            penaltyApplied = true;
        }
    }

    // Update participant status to 'left'
    pool.participants[participantIndex].status = 'left';

    await pool.save();
    
    let message = 'Successfully left the pool.';
    if (penaltyApplied) {
        message += ' A 5-point Trust Score penalty was applied for late cancellation.';
    }

    res.json({
      message,
      penaltyApplied
    });
  } catch (error) {
    console.error('Leave pool error:', error);
    res.status(500).json({
      message: 'Server error during pool leave'
    });
  }
});

// @route   PATCH /api/pools/:id/status
// @desc    Update pool status (Used by creator for completion and cancellation)
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
    const newStatus = req.body.status;

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

    // LOGIC FOR CANCELLATION (creator)
    if (newStatus === 'cancelled') {
        const activeParticipants = pool.participants.filter(p => p.status === 'joined').length;

        // If there is more than just the creator (activeParticipants > 1), apply penalty.
        if (activeParticipants > 1) {
            // Apply penalty for cancelling a ride with active co-riders
            const deductionSuccess = await deductTrustScore(req.user._id);
            if (!deductionSuccess) {
                console.warn(`Could not deduct trust score for user ${req.user._id} upon cancellation.`);
            }
            
            // Mark all active participants as 'removed' to clearly indicate they were dropped
            pool.participants.forEach(p => {
                if (p.status === 'joined' && p.user.toString() !== req.user._id.toString()) {
                    p.status = 'removed';
                }
            });
            
            // Allow cancellation, but warn of penalty
            pool.status = newStatus;
            pool.updatedAt = new Date(); // Update timestamp for potential cleanup
            await pool.save();

            return res.json({
                message: 'Pool cancelled. A 5-point Trust Score penalty was applied for cancelling a ride with other participants.',
                penaltyApplied: true,
                pool
            });
        }
        
        // If only the creator is in the pool, no penalty, just a normal transition to cancelled status
        pool.status = newStatus;
        pool.updatedAt = new Date(); // Update timestamp for potential cleanup
        await pool.save();

        return res.json({
            message: 'Pool cancelled successfully.',
            penaltyApplied: false,
            pool
        });
    }
    
    // LOGIC FOR COMPLETION (creator)
    if (newStatus === 'completed') {
        // Ensure the ride time has actually passed before marking as completed
        const [hours, minutes] = pool.time.split(':').map(Number);
        const poolDateTime = new Date(pool.date);
        poolDateTime.setHours(hours, minutes, 0, 0);

        if (poolDateTime.getTime() > Date.now()) {
            return res.status(400).json({
                message: 'Cannot mark a pool as completed before its scheduled time.'
            });
        }
        
        // Normal transition to completed
        pool.status = newStatus;
        // Also update updatedAt to use as a cleanup timestamp
        pool.updatedAt = new Date(); 
        await pool.save();
        
        return res.json({
            message: 'Pool status updated to completed.',
            pool
        });
    }
    
    // Default status update for other cases (e.g., ongoing, upcoming if somehow triggered)
    pool.status = newStatus;
    pool.updatedAt = new Date(); 
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
// @desc    Delete a pool (only possible if only the creator is the sole participant)
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

    // Check if pool has other participants (only allow hard delete if ONLY the creator is active)
    const activeParticipants = pool.participants.filter(p => p.status === 'joined').length;
    if (activeParticipants > 1) {
      return res.status(400).json({
        message: 'Cannot delete pool with active participants. Please cancel the pool using the status update option instead.'
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