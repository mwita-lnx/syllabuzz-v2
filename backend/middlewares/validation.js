// backend/middlewares/validation.js
// Express validation middleware

const mongoose = require('mongoose');

// Custom error classes
class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
    this.details = details;
  }
}

// Validate ObjectId
const validateObjectId = (value, fieldName = 'ID') => {
  if (!value) {
    throw new ValidationError(`${fieldName} is required`);
  }
  
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
  
  return new mongoose.Types.ObjectId(value);
};

// Validate pagination parameters
const validatePagination = (page = 1, limit = 20, maxLimit = 100) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    throw new ValidationError('Page must be a positive integer');
  }
  
  if (isNaN(limitNum) || limitNum < 1) {
    throw new ValidationError('Limit must be a positive integer');
  }
  
  if (limitNum > maxLimit) {
    throw new ValidationError(`Limit cannot exceed ${maxLimit}`);
  }
  
  return { page: pageNum, limit: limitNum };
};

// Validate JSON body middleware
const validateJsonBody = (requiredFields = [], optionalFields = null) => {
  return (req, res, next) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        throw new ValidationError('Request body is required');
      }
      
      // Check required fields
      for (const field of requiredFields) {
        if (!(field in req.body) || req.body[field] === null || req.body[field] === undefined) {
          throw new ValidationError(`Field '${field}' is required`);
        }
      }
      
      // Check for unexpected fields if optionalFields is specified
      if (optionalFields !== null) {
        const allowedFields = new Set([...requiredFields, ...optionalFields]);
        const bodyFields = new Set(Object.keys(req.body));
        const unexpectedFields = [...bodyFields].filter(field => !allowedFields.has(field));
        
        if (unexpectedFields.length > 0) {
          throw new ValidationError(`Unexpected fields: ${unexpectedFields.join(', ')}`);
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Validate query parameters
const validateQuery = (allowedParams = []) => {
  return (req, res, next) => {
    try {
      const queryKeys = Object.keys(req.query);
      const unexpectedParams = queryKeys.filter(key => !allowedParams.includes(key));
      
      if (unexpectedParams.length > 0) {
        throw new ValidationError(`Unexpected query parameters: ${unexpectedParams.join(', ')}`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Validate room data
const validateRoomData = (req, res, next) => {
  try {
    const { name, unit_code, topic, max_participants } = req.body;
    
    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      throw new ValidationError('Room name must be at least 3 characters long');
    }
    
    if (name.length > 100) {
      throw new ValidationError('Room name cannot exceed 100 characters');
    }
    
    // Validate unit_code
    if (!unit_code || typeof unit_code !== 'string' || unit_code.trim().length < 2) {
      throw new ValidationError('Unit code must be at least 2 characters long');
    }
    
    if (unit_code.length > 20) {
      throw new ValidationError('Unit code cannot exceed 20 characters');
    }
    
    // Validate topic
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      throw new ValidationError('Topic must be at least 3 characters long');
    }
    
    if (topic.length > 200) {
      throw new ValidationError('Topic cannot exceed 200 characters');
    }
    
    // Validate max_participants
    if (max_participants !== undefined) {
      const maxPart = parseInt(max_participants);
      if (isNaN(maxPart) || maxPart < 2 || maxPart > 100) {
        throw new ValidationError('Max participants must be between 2 and 100');
      }
    }
    
    // Sanitize data
    req.body.name = name.trim();
    req.body.unit_code = unit_code.trim().toUpperCase();
    req.body.topic = topic.trim();
    
    next();
  } catch (error) {
    next(error);
  }
};

// Validate message data
const validateMessageData = (req, res, next) => {
  try {
    const { content, type = 'text' } = req.body;
    
    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new ValidationError('Message content is required');
    }
    
    if (content.length > 1000) {
      throw new ValidationError('Message content cannot exceed 1000 characters');
    }
    
    // Validate type
    const allowedTypes = ['text', 'resource', 'announcement', 'poll', 'timer', 'system'];
    if (!allowedTypes.includes(type)) {
      throw new ValidationError(`Invalid message type. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    // Sanitize content
    req.body.content = content.trim();
    
    next();
  } catch (error) {
    next(error);
  }
};

// Validate file upload
const validateFileUpload = (allowedMimeTypes = [], maxSizeMB = 50) => {
  return (req, res, next) => {
    try {
      if (!req.file && !req.files) {
        throw new ValidationError('No file uploaded');
      }
      
      const file = req.file || (req.files && req.files[0]);
      
      if (!file) {
        throw new ValidationError('No file found in request');
      }
      
      // Check MIME type
      if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
        throw new ValidationError(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
      }
      
      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new ValidationError(`File size exceeds ${maxSizeMB}MB limit`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting validation
const validateRateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    try {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old entries
      if (requests.has(key)) {
        const userRequests = requests.get(key).filter(time => time > windowStart);
        requests.set(key, userRequests);
      }
      
      const currentRequests = requests.get(key) || [];
      
      if (currentRequests.length >= maxRequests) {
        throw new ValidationError('Too many requests, please try again later', 429);
      }
      
      currentRequests.push(now);
      requests.set(key, currentRequests);
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validateObjectId,
  validatePagination,
  validateJsonBody,
  validateQuery,
  validateRoomData,
  validateMessageData,
  validateFileUpload,
  validateRateLimit
};