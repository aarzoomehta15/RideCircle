const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          message: 'No user found with this token'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Server error during authentication'
    });
  }
};

// Grant access to specific roles (for future use)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user owns the resource or is admin
const ownerOrAdmin = (req, res, next) => {
  // For now, just check if user owns the resource
  // In the future, we can add admin roles
  if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Not authorized to access this resource'
    });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  ownerOrAdmin
};
