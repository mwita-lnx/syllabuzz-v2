const httpStatus = require('http-status');
const logger = require('../utils/logger');

// Standardized response format
const createResponse = (success, data = null, error = null, message = null, statusCode = 200) => {
  const response = {
    success,
    timestamp: new Date().toISOString()
  };

  if (data !== null) response.data = data;
  if (message) response.message = message;
  if (error) {
    response.error = {
      message: error.message || error,
      code: error.code || 'UNKNOWN_ERROR',
      ...(process.env.NODE_ENV === 'development' && error.stack && { stack: error.stack }),
      ...(error.details && { details: error.details })
    };
  }

  return { response, statusCode };
};

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
    error: err,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Set default status code - make sure it's a valid HTTP status code
  let statusCode = err.statusCode || err.status || 500;
  
  // Ensure the status code is a valid number between 100-599
  if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
    statusCode = 500; // Default to 500 if invalid
  }
  
  // Use standardized response format
  const { response } = createResponse(false, null, err, null, statusCode);
  
  // Send the error response
  res.status(statusCode).json(response);
};

/**
 * Not found middleware for handling 404 errors
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const notFoundHandler = (req, res) => {
  const { response } = createResponse(
    false, 
    null, 
    { message: `Route not found: ${req.originalUrl}`, code: 'NOT_FOUND' }
  );
  res.status(404).json(response);
};

module.exports = {
  errorHandler,
  notFoundHandler
};