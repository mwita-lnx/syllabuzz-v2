/**
 * Route to generate test tokens for development
 */
const express = require('express');
const { generateTestToken } = require('../middlewares/auth');
const router = express.Router();

/**
 * GET /api/dev/token
 * Generates a test JWT token for development purposes
 */
router.get('/token', (req, res) => {
  try {
    const token = generateTestToken({
      user_id: req.query.user_id || '64a2b3fc7e955b1234567890',
      name: req.query.name || 'Test User',
      email: req.query.email || 'test@example.com',
      role: req.query.role || 'user'
    });
    
    res.status(200).json({
      success: true,
      token,
      expiresIn: '1 day',
      user: {
        userId: req.query.user_id || '64a2b3fc7e955b1234567890',
        name: req.query.name || 'Test User',
        email: req.query.email || 'test@example.com',
        role: req.query.role || 'user'
      }
    });
  } catch (error) {
    // Handle errors explicitly here rather than relying on the global error handler
    console.error('Error generating test token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test token'
    });
  }
});

module.exports = router;