// Consolidated Socket.io Server
// All components merged into a single file

// Required dependencies
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const cors = require('cors');

// ===============================================================
// LOGGER SETUP
// ===============================================================

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'socket-server' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// ===============================================================
// SOCKET HANDLERS
// ===============================================================

// Store for active polls
const activePolls = new Map();

/**
 * Room handler - Manages room-related socket events
 */
function roomHandler(io, socket) {
  /**
   * Joins a room
   * @param {Object} data - Room data
   * @param {string} data.roomId - ID of the room to join
   * @param {Function} callback - Acknowledgement callback
   */
  socket.on('join_room', (data, callback) => {
    try {
      const { roomId } = data;
      const userId = socket.user.user_id;
      const userName = socket.user.name || 'Anonymous';
      
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      
      // Join the room
      socket.join(`room:${roomId}`);
      
      // Notify other users in the room
      socket.to(`room:${roomId}`).emit('user_joined', {
        userId,
        userName,
        roomId,
        timestamp: new Date()
      });
      
      // Emit room joined event to the user
      socket.emit('room_joined', {
        roomId,
        roomName: data.roomName || 'Revision Room', // Use provided name or default
        userId,
        userName
      });
      
      // Log the event
      console.log(`User ${userId} joined room ${roomId}`);
      logger.info(`User ${userId} joined room ${roomId}`);
      
      // Send successful acknowledgement
      if (callback) callback({ success: true, roomId });
    } catch (error) {
      console.error('Error joining room:', error);
      logger.error('Error joining room:', error);
      
      // Send error acknowledgement
      if (callback) callback({ success: false, error: error.message });
    }
  });
  
  /**
   * Leaves a room
   * @param {Object} data - Room data
   * @param {string} data.roomId - ID of the room to leave
   * @param {Function} callback - Acknowledgement callback
   */
  socket.on('leave_room', (data, callback) => {
    try {
      const { roomId } = data;
      const userId = socket.user.user_id;
      const userName = socket.user.name || 'Anonymous';
      
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      
      // Leave the room
      socket.leave(`room:${roomId}`);
      
      // Notify other users in the room
      socket.to(`room:${roomId}`).emit('user_left', {
        userId,
        userName,
        roomId,
        timestamp: new Date()
      });
      
      // Emit room left event to the user
      socket.emit('room_left', {
        roomId,
        roomName: data.roomName || 'Revision Room', // Use provided name or default
        userId
      });
      
      // Log the event
      console.log(`User ${userId} left room ${roomId}`);
      logger.info(`User ${userId} left room ${roomId}`);
      
      // Send successful acknowledgement
      if (callback) callback({ success: true, roomId });
    } catch (error) {
      console.error('Error leaving room:', error);
      logger.error('Error leaving room:', error);
      
      // Send error acknowledgement
      if (callback) callback({ success: false, error: error.message });
    }
  });
  
  /**
   * Gets users in a room
   * @param {Object} data - Room data
   * @param {string} data.roomId - ID of the room
   * @param {Function} callback - Acknowledgement callback
   */
  socket.on('get_room_users', async (data, callback) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      
      // Get sockets in the room
      const sockets = await io.in(`room:${roomId}`).fetchSockets();
      
      // Extract user information
      const users = sockets.map(socket => ({
        user_id: socket.user.user_id,
        user_name: socket.user.name || 'Anonymous',
        status: 'active',
        joined_at: new Date().toISOString()
      }));
      
      // Emit room participants to the requesting user
      socket.emit('room_participants', {
        roomId,
        participants: users
      });
      
      // Send users list via callback
      if (callback) callback({ success: true, users });
    } catch (error) {
      console.error('Error getting room users:', error);
      logger.error('Error getting room users:', error);
      
      // Send error acknowledgement
      if (callback) callback({ success: false, error: error.message });
    }
  });
  
  /**
   * List available rooms
   * Simplified implementation just for testing
   */
  socket.on('list_rooms', (callback) => {
    try {
      // In a real implementation, this would fetch rooms from a database
      // Here we'll just send a demo room for testing
      
      const demoRooms = [
        {
          id: '1234567890',
          name: 'Demo Revision Room',
          topic: 'Socket.io Testing',
          participant_count: 1,
          is_active: true
        }
      ];
      
      socket.emit('room_list', { rooms: demoRooms });
      
      if (callback) callback({ success: true, rooms: demoRooms });
    } catch (error) {
      console.error('Error listing rooms:', error);
      logger.error('Error listing rooms:', error);
      
      if (callback) callback({ success: false, error: error.message });
    }
  });
  
  /**
   * Create room
   * Simplified implementation just for testing
   */
  socket.on('create_room', (data, callback) => {
    try {
      const { name, topic } = data;
      const userId = socket.user.user_id;
      
      if (!name) {
        throw new Error('Room name is required');
      }
      
      // In a real implementation, this would create a room in a database
      // Here we'll just send a demo room for testing
      
      const roomId = Date.now().toString();
      const newRoom = {
        id: roomId,
        name,
        topic: topic || 'General',
        created_by: userId,
        is_active: true,
        participant_count: 0
      };
      
      socket.emit('room_created', newRoom);
      
      if (callback) callback({ success: true, room: newRoom });
    } catch (error) {
      console.error('Error creating room:', error);
      logger.error('Error creating room:', error);
      
      if (callback) callback({ success: false, error: error.message });
    }
  });
}

/**
 * Message handler - Manages message-related socket events
 */
function messageHandler(io, socket) {
  /**
   * Handles sending a message to a room
   * @param {Object} data - Message data
   * @param {string} data.roomId - Room ID
   * @param {string} data.content - Message content
   * @param {string} data.type - Message type (text, resource, poll)
   * @param {Object} data.data - Additional data for special message types
   * @param {Function} callback - Acknowledgement callback
   */
  socket.on('send_message', (data, callback) => {
    try {
      const { roomId, content, parentId, type = 'text', data: additionalData } = data;
      const userId = socket.user.user_id;
      const userName = socket.user.name || 'Anonymous';
      
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      
      if (!content || typeof content !== 'string' || content.trim() === '') {
        throw new Error('Message content is required');
      }
      
      // Create message object
      const message = {
        id: Date.now().toString(), // Simple ID generation
        roomId,
        userId,
        userName,
        content: content.trim(),
        type,
        timestamp: new Date(),
        likes: 0,
        parentId: parentId || null
      };
      
      // Add additional data for special message types
      if (additionalData) {
        if (type === 'resource' && additionalData.resourceData) {
          message.resourceData = additionalData.resourceData;
        } else if (type === 'poll' && additionalData.pollData) {
          message.pollData = additionalData.pollData;
        }
      }
      
      // Send message to all users in the room (including sender for consistency)
      io.to(`room:${roomId}`).emit('new_message', message);
      
      // Log the event
      console.log(`User ${userId} sent message to room ${roomId}`);
      logger.info(`User ${userId} sent message to room ${roomId}`);
      
      // Send successful acknowledgement
      if (callback) callback({ success: true, messageId: message.id });
    } catch (error) {
      console.error('Error sending message:', error);
      logger.error('Error sending message:', error);
      
      // Send error event to notify the user
      socket.emit('error', { message: error.message });
      
      // Send error acknowledgement
      if (callback) callback({ success: false, error: error.message });
    }
  });
  
  /**
   * Get messages for a room
   * @param {Object} data - Room data
   * @param {string} data.roomId - Room ID
   * @param {Function} callback - Acknowledgement callback
   */
  socket.on('get_messages', (data, callback) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      
      // In a real implementation, this would fetch messages from a database
      // Here we'll just send an empty array for testing
      
      socket.emit('message_history', {
        roomId,
        messages: []
      });
      
      if (callback) callback({ success: true, messages: [] });
    } catch (error) {
      console.error('Error getting messages:', error);
      logger.error('Error getting messages:', error);
      
      // Send error event to notify the user
      socket.emit('error', { message: error.message });
      
      // Send error acknowledgement
      if (callback) callback({ success: false, error: error.message });
    }
  });
  
  /**
   * Handles typing indicator
   * @param {Object} data - Typing data
   * @param {string} data.roomId - Room ID
   */
  socket.on('typing', (data) => {
    try {
      const { roomId } = data;
      const userId = socket.user.user_id;
      const userName = socket.user.name || 'Anonymous';
      
      if (!roomId) {
        return; // Silently fail
      }
      
      // Broadcast typing status to others in the room
      socket.to(`room:${roomId}`).emit('user_typing', {
        userId,
        userName
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
      logger.error('Error sending typing indicator:', error);
    }
  });
  
  /**
   * Like a message
   * @param {Object} data - Like data
   * @param {string} data.messageId - Message ID
   * @param {Function} callback - Acknowledgement callback
   */
  socket.on('like_message', (data, callback) => {
    try {
      const { messageId } = data;
      const userId = socket.user.user_id;
      const userName = socket.user.name || 'Anonymous';
      
      if (!messageId) {
        throw new Error('Message ID is required');
      }
      
      // In a real implementation, this would update a message in a database
      // Here we'll just send a mock response for testing
      
      // Emit like event to all users in the room
      // The room ID would normally be retrieved from the database
      // For testing, we'll use 'all' as a broadcast to all connected clients
      io.emit('message_liked', {
        messageId,
        userId,
        userName,
        likes: 1 // Mock value
      });
      
      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error liking message:', error);
      logger.error('Error liking message:', error);
      
      // Send error event to notify the user
      socket.emit('error', { message: error.message });
      
      // Send error acknowledgement
      if (callback) callback({ success: false, error: error.message });
    }
  });
  
  /**
   * Unlike a message
   * @param {Object} data - Unlike data
   * @param {string} data.messageId - Message ID
   * @param {Function} callback - Acknowledgement callback
   */
  socket.on('unlike_message', (data, callback) => {
    try {
      const { messageId } = data;
      const userId = socket.user.user_id;
      const userName = socket.user.name || 'Anonymous';
      
      if (!messageId) {
        throw new Error('Message ID is required');
      }
      
      // In a real implementation, this would update a message in a database
      // Here we'll just send a mock response for testing
      
      // Emit unlike event to all users in the room
      // The room ID would normally be retrieved from the database
      // For testing, we'll use 'all' as a broadcast to all connected clients
      io.emit('message_unliked', {
        messageId,
        userId,
        userName,
        likes: 0 // Mock value
      });
      
      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error unliking message:', error);
      logger.error('Error unliking message:', error);
      
      // Send error event to notify the user
      socket.emit('error', { message: error.message });
      
      // Send error acknowledgement
      if (callback) callback({ success: false, error: error.message });
    }
  });
}

/**
 * Poll handler - Manages poll-related socket events
 */
function pollHandler(io, socket) {
  /**
   * Creates a new poll in a room
   * @param {Object} data - Poll data
   * @param {string} data.roomId - Room ID
   * @param {string} data.question - Poll question
   * @param {string[]} data.options - Poll options
   * @param {number} data.duration - Poll duration in seconds (optional)
   * @param {Function} callback - Acknowledgement callback
   */
  socket.on('create_poll', (data, callback) => {
    try {
      const { roomId, question, options, duration = 300 } = data; // Default 5 minutes
      const creatorId = socket.user.user_id;
      const creatorName = socket.user.name || 'Anonymous';
      
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      
      if (!question) {
        throw new Error('Question is required');
      }
      
      if (!Array.isArray(options) || options.length < 2) {
        throw new Error('At least two options are required');
      }
      
      // Create a unique poll ID
      const pollId = `poll_${Date.now()}`;
      
      // Create poll object
      const poll = {
        id: pollId,
        roomId,
        creatorId,
        creatorName,
        question,
        options: options.map(text => ({ text, votes: 0 })),
        voters: new Set(),
        createdAt: new Date(),
        endsAt: new Date(Date.now() + duration * 1000)
      };
      
      // Store the poll
      activePolls.set(pollId, poll);
      
      // Send poll to all users in the room
      io.to(`room:${roomId}`).emit('new_poll', {
        id: poll.id,
        roomId: poll.roomId,
        creatorId: poll.creatorId,
        creatorName: poll.creatorName,
        question: poll.question,
        options: poll.options.map(option => ({ text: option.text, votes: option.votes })),
        createdAt: poll.createdAt,
        endsAt: poll.endsAt
      });
      
      // Log the event
      console.log(`User ${creatorId} created poll in room ${roomId}`);
      logger.info(`User ${creatorId} created poll in room ${roomId}`);
      
      // Set timeout to end the poll
      setTimeout(() => {
        const poll = activePolls.get(pollId);
        if (poll) {
          // Send poll results to all users in the room
          io.to(`room:${roomId}`).emit('poll_ended', {
            id: poll.id,
            roomId: poll.roomId,
            question: poll.question,
            options: poll.options.map(option => ({ text: option.text, votes: option.votes })),
            totalVotes: Array.from(poll.voters).length
          });
          
          // Remove the poll
          activePolls.delete(pollId);
          
          console.log(`Poll ${pollId} in room ${roomId} has ended`);
          logger.info(`Poll ${pollId} in room ${roomId} has ended`);
        }
      }, duration * 1000);
      
      // Send successful acknowledgement
      if (callback) callback({ success: true, pollId });
    } catch (error) {
      console.error('Error creating poll:', error);
      logger.error('Error creating poll:', error);
      
      // Send error acknowledgement
      if (callback) callback({ success: false, error: error.message });
    }
  });
  
  /**
   * Votes on a poll
   * @param {Object} data - Vote data
   * @param {string} data.pollId - Poll ID
   * @param {number} data.optionIndex - Index of the selected option
   * @param {Function} callback - Acknowledgement callback
   */
  socket.on('vote_poll', (data, callback) => {
    try {
      const { pollId, optionIndex } = data;
      const userId = socket.user.user_id;
      
      if (!pollId) {
        throw new Error('Poll ID is required');
      }
      
      if (optionIndex === undefined || optionIndex < 0) {
        throw new Error('Valid option index is required');
      }
      
      // Get the poll
      const poll = activePolls.get(pollId);
      
      if (!poll) {
        throw new Error('Poll not found or has ended');
      }
      
      // Check if user has already voted
      if (poll.voters.has(userId)) {
        throw new Error('You have already voted in this poll');
      }
      
      // Check if option exists
      if (optionIndex >= poll.options.length) {
        throw new Error('Invalid option index');
      }
      
      // Record the vote
      poll.options[optionIndex].votes += 1;
      poll.voters.add(userId);
      
      // Send updated poll to all users in the room
      io.to(`room:${poll.roomId}`).emit('poll_updated', {
        id: poll.id,
        options: poll.options.map(option => ({ text: option.text, votes: option.votes })),
        totalVotes: Array.from(poll.voters).length
      });
      
      // Log the event
      console.log(`User ${userId} voted on poll ${pollId}`);
      logger.info(`User ${userId} voted on poll ${pollId}`);
      
      // Send successful acknowledgement
      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error voting on poll:', error);
      logger.error('Error voting on poll:', error);
      
      // Send error acknowledgement
      if (callback) callback({ success: false, error: error.message });
    }
  });
  
  /**
   * Gets active poll in a room
   * @param {Object} data - Room data
   * @param {string} data.roomId - Room ID
   * @param {Function} callback - Acknowledgement callback
   */
  socket.on('get_active_poll', (data, callback) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      
      // Find poll for the room
      const pollForRoom = Array.from(activePolls.values()).find(poll => poll.roomId === roomId);
      
      if (!pollForRoom) {
        if (callback) callback({ success: true, hasPoll: false });
        return;
      }
      
      // Send poll data
      if (callback) callback({
        success: true,
        hasPoll: true,
        poll: {
          id: pollForRoom.id,
          roomId: pollForRoom.roomId,
          creatorId: pollForRoom.creatorId,
          creatorName: pollForRoom.creatorName,
          question: pollForRoom.question,
          options: pollForRoom.options.map(option => ({ text: option.text, votes: option.votes })),
          createdAt: pollForRoom.createdAt,
          endsAt: pollForRoom.endsAt,
          totalVotes: Array.from(pollForRoom.voters).length
        }
      });
    } catch (error) {
      console.error('Error getting active poll:', error);
      logger.error('Error getting active poll:', error);
      
      // Send error acknowledgement
      if (callback) callback({ success: false, error: error.message });
    }
  });
}

// ===============================================================
// SERVER SETUP
// ===============================================================

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(cors({
      origin: '*',
      credentials: true
    }));

// Create HTTP server
const server = http.createServer(app);

// For testing - create a demo token endpoint
app.post('/api/dev/token', (req, res) => {
  const { user_id, name } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  const token = jwt.sign(
    { user_id, name: name || 'Test User' },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '1h' }
  );
  
  res.json({ token });
});

// ===============================================================
// SOCKET.IO SETUP
// ===============================================================

// Create Socket.IO instance
const io = socketIo(server, {
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

// Authentication middleware
io.use((socket, next) => {
  console.log('Auth middleware running for socket:', socket.id);
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.error('No token provided for socket:', socket.id);
    logger.error('No token provided for socket:', socket.id);
    return next(new Error('Authentication error: Token not provided'));
  }
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    socket.user = decoded; // Attach user info to socket
    console.log('Socket authenticated for user:', decoded.user_id);
    logger.debug('Socket authenticated for user:', decoded.user_id);
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Connection event handler
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

// ===============================================================
// START SERVER
// ===============================================================

// Start the server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server available at http://localhost:${PORT}`);
  console.log(`JWT_SECRET is ${process.env.JWT_SECRET ? 'configured' : 'using default dev-secret-key'}`);
});