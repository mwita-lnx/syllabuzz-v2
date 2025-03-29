const httpStatus = require('http-status');
const logger = require('../utils/logger');

/**
 * Global error handler middleware for Express
 * @param {Error} err - Error object
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error with useful details
  const logMessage = `${err.message || 'Unknown error'} - ${req.originalUrl} - ${req.method} - ${req.ip}`;
  logger.error(logMessage, { 
    service: 'syllabuzz-realtime-service', 
    error: err 
  });
  
  // Set default status code - make sure it's a valid HTTP status code
  let statusCode = err.statusCode || err.status || 500;
  
  // Ensure the status code is a valid number between 100-599
  if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
    statusCode = 500; // Default to 500 if invalid
  }
  
  // Customize response based on environment
  const response = {
    success: false,
    error: err.message || 'Internal server error'
  };
  
  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    
    // Add more debug info if available
    if (err.details) {
      response.details = err.details;
    }
  }
  
  // Send the error response
  res.status(statusCode).json(response);
};

/**
 * Not found middleware for handling 404 errors
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};