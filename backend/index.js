// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');
const pollRoutes = require('./routes/polls');
const devRoutes = require('./routes/dev'); // Import the dev routes

// Import socket setup (using the fixed version)
const { setupSocket } = require('./config/socket');

// Import middlewares
const { verifyToken } = require('./middlewares/auth');
const { errorHandler, notFoundHandler } = require('./middlewares/error-handler');

// Import configuration
const config = require('./config/config');

// Import logger
const logger = require('./utils/logger');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Setup database connection
async function startServer() {
  try {
    // Connect to database using the method from config
    const dbConnection = await config.connectDatabase();
    
    // Setup middleware
    app.use(cors({
      origin: config.corsOrigins || '*',
      credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Health check route
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: 'revision_room_service',
        environment: config.env || process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });
    
    // Development routes for testing
    app.use('/api/dev', devRoutes);
    
    // Protected routes
    app.use('/api/rooms', verifyToken, roomRoutes);
    app.use('/api/rooms', verifyToken, messageRoutes); // Fixed path
    app.use('/api/polls', verifyToken, pollRoutes);
    
    // Error handlers
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    // Setup socket.io AFTER all middleware and routes
    const io = setupSocket(server);
    
    // Start server
    const port = config.port || process.env.PORT || 4000;
    // Change this part in your startServer function
server.listen(port, '0.0.0.0', () => {
  logger.info(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Socket.IO server available at http://0.0.0.0:${port}`);
  console.log(`JWT_SECRET is ${process.env.JWT_SECRET ? 'configured' : 'using default dev-secret-key'}`);
});
    
  } catch (err) {
    console.error('Failed to start server:', err);
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  logger.error('Failed to start server:', err);
  process.exit(1);
});