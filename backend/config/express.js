const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('../routes');
const { errorHandler } = require('../middleware/error-handler');
const logger = require('../utils/logger');

// Initialize Express app
const app = express();

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Serve static files (if needed)
// app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'syllabuzz-realtime-service'
  });
});

// API routes
app.use('/api', routes);

// 404 - Not found handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;