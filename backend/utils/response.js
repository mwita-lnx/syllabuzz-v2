/**
 * Utility functions for standardizing API responses
 */

/**
 * Create a success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Standardized success response
 */
const successResponse = (data = null, message = 'Operation successful', statusCode = 200) => {
  return {
    status: statusCode,
    body: {
      success: true,
      message,
      data
    }
  };
};

/**
 * Create an error response
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Additional error details
 * @returns {Object} Standardized error response
 */
const errorResponse = (error = 'An error occurred', statusCode = 500, details = null) => {
  return {
    status: statusCode,
    body: {
      success: false,
      error,
      details: details || undefined
    }
  };
};

/**
 * Create a validation error response
 * @param {Object} errors - Validation errors
 * @returns {Object} Standardized validation error response
 */
const validationErrorResponse = (errors) => {
  return errorResponse('Validation error', 400, { errors });
};

/**
 * Send a success response
 * @param {express.Response} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = null, message = 'Operation successful', statusCode = 200) => {
  const response = successResponse(data, message, statusCode);
  res.status(response.status).json(response.body);
};

/**
 * Send an error response
 * @param {express.Response} res - Express response object
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Additional error details
 */
const sendError = (res, error = 'An error occurred', statusCode = 500, details = null) => {
  const response = errorResponse(error, statusCode, details);
  res.status(response.status).json(response.body);
};

/**
 * Send a validation error response
 * @param {express.Response} res - Express response object
 * @param {Object} errors - Validation errors
 */
const sendValidationError = (res, errors) => {
  const response = validationErrorResponse(errors);
  res.status(response.status).json(response.body);
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  sendSuccess,
  sendError,
  sendValidationError
};