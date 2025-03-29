// config/socket.js
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const roomHandler = require('../sockets/room-handler');
const messageHandler = require('../sockets/message-handler');
const pollHandler = require('../sockets/poll-handler');

let io;

/**
 * Sets up Socket.IO with the HTTP server
 * @param {http.Server} server - HTTP server instance
 * @returns {socketIo.Server} Socket.IO server instance
 */
const setupSocket = (server) => {
  console.log('Setting up Socket.IO...');
  logger.info('Setting up Socket.IO...');
  
  // Create Socket.IO instance only if it doesn't exist
  if (!io) {
    io = socketIo(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Add global logger for all events
    io.engine.on('connection_error', (err) => {
      console.error('Connection error:', err);
      logger.error('Connection error:', err);
    });

    // Authentication middleware with better error logging
    io.use((socket, next) => {
      console.log('Auth middleware running for socket:', socket.id);
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.error('No token provided for socket:', socket.id);
        logger.error('No token provided for socket:', socket.id);
        return next(new Error('Authentication error: Token not provided'));
      }
      
      try {
        // Add fallback for JWT secret just like in consolidated version
        const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
        // Verify JWT token using the secret with fallback
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded; // Attach user info to socket
        console.log('Socket authenticated for user:', decoded.user);
        logger.debug('Socket authenticated for user:', decoded.user);
        next();
      } catch (error) {
        console.error('JWT verification failed:', error.message);
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection event handler with more logging
    io.on('connection', (socket) => {
      console.log('New socket connection:', socket.id);
      
      // If user object is missing, log the error
      if (!socket.user || !socket.user.user_id) {
        console.error('Socket connected but user data is missing:', socket.id);
        logger.error('Socket connected but user data is missing:', socket.id);
        socket.disconnect();
        return;
      }
      
      const userId = socket.user.user_id;
      console.log(`User ${userId} connected with socket ${socket.id}`);
      logger.info(`User connected: ${userId}`);

      // Add user to their own private channel for direct messages
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined private channel user:${userId}`);
      
      // Register all available events to debug which ones are triggered
      socket.onAny((event, ...args) => {
        console.log(`[${socket.id}] Event '${event}' received:`, JSON.stringify(args));
        logger.debug(`[${socket.id}] Event '${event}' received:`, JSON.stringify(args));
      });

      // Register event handlers
      roomHandler(io, socket);
      messageHandler(io, socket);
      pollHandler(io, socket);

      // Disconnect event
      socket.on('disconnect', (reason) => {
        console.log(`User ${userId} disconnected. Reason: ${reason}`);
        logger.info(`User disconnected: ${userId}, Reason: ${reason}`);
      });
    });
  }

  return io;
};

/**
 * Get the Socket.IO instance
 * @returns {socketIo.Server} Socket.IO server instance
 */
const getIo = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call setupSocket first.');
  }
  return io;
};

module.exports = {
  setupSocket,
  getIo
};