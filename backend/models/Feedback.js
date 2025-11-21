const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pool',
    required: [true, 'Ride ID is required']
  },
  raterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rater ID is required']
  },
  ratedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rated user ID is required']
  },
  score: {
    type: Number,
    required: [true, 'Rating score is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters'],
    default: ''
  },
  safetyFlag: {
    type: Boolean,
    default: false
  },

  // ⭐ FIXED: categories ALWAYS exists now
  categories: {
    type: Object,
    default: {
      punctuality: null,
      safety: null,
      communication: null,
      vehicle: null
    }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate feedback for the same ride and users
feedbackSchema.index(
  { rideId: 1, raterId: 1, ratedUserId: 1 },
  { unique: true }
);

// Index for efficient queries
feedbackSchema.index({ ratedUserId: 1 });
feedbackSchema.index({ raterId: 1 });
feedbackSchema.index({ rideId: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
