const mongoose = require('mongoose');

const poolSchema = new mongoose.Schema({
  source: {
    type: String,
    required: [true, 'Source location is required'],
    trim: true
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true
  },
  sourceCoords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  destCoords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    validate: {
      validator: function(time) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Time must be in HH:MM format'
    }
  },
  maxSeats: {
    type: Number,
    required: [true, 'Maximum seats is required'],
    min: [2, 'Minimum 2 seats required'],
    max: [6, 'Maximum 6 seats allowed']
  },
  fare: {
    type: Number,
    required: [true, 'Fare is required'],
    min: [1, 'Fare must be at least 1']
  },
  type: {
    type: String,
    enum: ['open', 'women-only', 'community'],
    default: 'open'
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['joined', 'left', 'removed'],
      default: 'joined'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
poolSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for available seats
poolSchema.virtual('availableSeats').get(function() {
  const activeParticipants = this.participants.filter(p => p.status === 'joined').length;
  return this.maxSeats - activeParticipants;
});

// Virtual for total participants
poolSchema.virtual('totalParticipants').get(function() {
  return this.participants.filter(p => p.status === 'joined').length;
});

// Ensure virtual fields are serialized
poolSchema.set('toJSON', { virtuals: true });
poolSchema.set('toObject', { virtuals: true });

// Index for efficient queries
poolSchema.index({ date: 1, status: 1 });
poolSchema.index({ createdBy: 1 });
poolSchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('Pool', poolSchema);
