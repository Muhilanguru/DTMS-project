const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware - JWT-based authentication
 * Validates token on EVERY request independently
 * Supports multiple concurrent users across different sessions/devices
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token independently for each request (stateless)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user from database (fresh on each request)
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // User authenticated - proceed to next middleware
      next();
    } catch (error) {
      // Token invalid or expired
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else if (!token) {
    // No token provided
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
