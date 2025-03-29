const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Set a consistent JWT secret - must match what the main authentication service uses
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

/**
 * Middleware to verify JWT tokens from the Authorization header
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
const authenticate = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token is missing'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify JWT token using the consistent secret
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user in request object
    req.user = {
      userId: decoded.user_id || decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token has expired'
      });
    }
    
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

/**
 * Alternative middleware that doesn't require authentication but adds user if token is valid
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
const verifyToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For development/testing purposes, set a mock user
    if (process.env.NODE_ENV === 'development') {
      req.user = {
        userId: '64a2b3fc7e955b1234567890',
        email: 'test@example.com',
        role: 'user'
      };
      return next();
    }
    
    return res.status(401).json({
      success: false,
      error: 'Authentication token is missing'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user in request object
    req.user = {
      userId: decoded.user_id || decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    // For development/testing purposes, set a mock user even on failure
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Using mock user in development mode due to token verification failure', error);
      req.user = {
        userId: '64a2b3fc7e955b1234567890',
        email: 'test@example.com',
        role: 'user'
      };
      return next();
    }
    
    logger.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (roles) => {
  return (req, res, next) => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to access this resource'
      });
    }
    
    // Check if user's role is in the allowed roles
    if (roles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      error: 'You are not authorized to access this resource'
    });
  };
};

/**
 * Socket.IO authentication middleware
 * @param {socketIo.Socket} socket - Socket connection
 * @param {Function} next - Next function
 */
const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    // For development/testing, allow connections without token
    if (process.env.NODE_ENV === 'development') {
      socket.user = {
        user_id: '64a2b3fc7e955b1234567890',
        email: 'test@example.com',
        role: 'user',
        name: 'Test User'
      };
      return next();
    }
    
    return next(new Error('Authentication token is missing'));
  }
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to socket
    socket.user = {
      user_id: decoded.user_id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name || 'Anonymous User'
    };
    
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    
    // For development/testing, allow connections with invalid tokens
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Using mock user for socket in development mode');
      socket.user = {
        user_id: '64a2b3fc7e955b1234567890',
        email: 'test@example.com',
        role: 'user',
        name: 'Test User'
      };
      return next();
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Authentication token has expired'));
    }
    
    return next(new Error('Invalid authentication token'));
  }
};

/**
 * Generate a test JWT token for development purposes
 * @param {Object} userData - User data to encode in the token
 * @returns {string} JWT token
 */
const generateTestToken = (userData = {}) => {
  const defaultUser = {
    user_id: '64a2b3fc7e955b1234567890',
    email: 'test@example.com',
    role: 'user',
    name: 'Test User'
  };
  
  const payload = { ...defaultUser, ...userData };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

// Export authentication middleware
module.exports = {
  authenticate,
  verifyToken,
  authorize,
  socketAuth,
  generateTestToken,
  JWT_SECRET
};