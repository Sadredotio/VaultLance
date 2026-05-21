const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
  let token;

  // 1. Check if token exists in headers (Bearer TOKEN_STRING)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Token is missing from Authorization header' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      return next(); // Move to the next function (The Controller)
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token exists
  if (!token) {
    console.warn('⚠️ No authorization token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };