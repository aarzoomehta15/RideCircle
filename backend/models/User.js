const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(phone) {
        return /^\d{10}$/.test(phone);
      },
      message: 'Phone number must be 10 digits'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  community: {
    type: String,
    trim: true,
    maxlength: [100, 'Community name cannot be more than 100 characters']
  },
  preferences: {
    womenOnly: { type: Boolean, default: false },
    communityOnly: { type: Boolean, default: false },
    verifiedOnly: { type: Boolean, default: true }
  },
  trustScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String, // URL to profile picture
    default: null
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
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
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
