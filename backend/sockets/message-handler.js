const mongoose = require('mongoose');
const Message = require('../models/message');
const RevisionRoom = require('../models/revision-room');
const logger = require('../utils/logger');

/**
 * Socket.IO handler for message events
 * @param {socketIo.Server} io - Socket.IO server instance
 * @param {socketIo.Socket} socket - Socket connection
 */
const messageHandler = (io, socket) => {
  const userId = socket.user.user_id;
  const userName = socket.user.name || 'Anonymous Use';
  console.log('User connected:', socket.user);
  
  // Send a message to a room
  socket.on('send_message', async ({ roomId, content, parentId, type = 'text', data = null }) => {
    console.log('send_message event received:', { roomId, content, parentId, type, data });
    try {
      // Validate input
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        return socket.emit('error', { message: 'Invalid room ID' });
      }
      
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return socket.emit('error', { message: 'Message content is required' });
      }
      
      // Check if room exists and is active
      const room = await RevisionRoom.findOne({
        _id: roomId,
        is_active: true
      });
      
      if (!room) {
        return socket.emit('error', { message: 'Room not found or not active' });
      }
      
      // Check if user is a participant in the room
      const isParticipant = room.participants.some(
        p => p.user_id.toString() === userId
      );
      
      if (!isParticipant) {
        return socket.emit('error', { message: 'You must join the room to send messages' });
      }
      
      // Create message
      const messageData = {
        room_id: roomId,
        user_id: userId,
        user_name: userName,
        content: content.trim(),
        type,
        timestamp: new Date()
      };
      
      // Add parent ID if this is a reply
      if (parentId && mongoose.Types.ObjectId.isValid(parentId)) {
        // Check if parent message exists
        const parentMessage = await Message.findOne({
          _id: parentId,
          room_id: roomId
        });
        
        if (parentMessage) {
          messageData.parent_id = parentId;
        }
      }
      
      // Add additional data for special message types
      if (data) {
        if (type === 'resource' && data.resourceData) {
          messageData.resource_data = data.resourceData;
        } else if (type === 'poll' && data.pollData) {
          messageData.poll_data = data.pollData;
        }
      }
      
      // Save message
      const message = new Message(messageData);
      await message.save();
      
      // Format message for broadcasting
      const messageToSend = {
        id: message._id.toString(),
        roomId,
        userId,
        userName,
        content: message.content,
        type: message.type,
        timestamp: message.timestamp,
        likes: 0,
        parentId: message.parent_id ? message.parent_id.toString() : null
      };
      
      // Add resource or poll data if present
      if (message.resource_data) {
        messageToSend.resourceData = message.resource_data;
      }
      
      if (message.poll_data) {
        messageToSend.pollData = message.poll_data;
      }
      
      // Broadcast message to all clients in the room
      io.to(`room:${roomId}`).emit('new_message', messageToSend);
      
      logger.info(`Message sent to room ${roomId} by user ${userId}`);
    } catch (error) {
      logger.error(`Error sending message: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Show typing indicator
  socket.on('typing', ({ roomId }) => {
    try {
      // Validate input
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        return socket.emit('error', { message: 'Invalid room ID' });
      }
      
      // Broadcast typing event to all other clients in the room
      socket.to(`room:${roomId}`).emit('user_typing', {
        userId,
        userName
      });
    } catch (error) {
      logger.error(`Error with typing indicator: ${error.message}`, error);
    }
  });
  
  // Like a message
  socket.on('like_message', async ({ messageId }) => {
    try {
      // Validate input
      if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
        return socket.emit('error', { message: 'Invalid message ID' });
      }
      
      // Add like to message
      const message = await Message.addLike(messageId, userId);
      
      if (!message) {
        return socket.emit('error', { message: 'Message not found or already liked' });
      }
      
      // Broadcast like event to all clients in the room
      io.to(`room:${message.room_id}`).emit('message_liked', {
        messageId,
        userId,
        userName,
        likes: message.likes
      });
      
      logger.info(`Message ${messageId} liked by user ${userId}`);
    } catch (error) {
      logger.error(`Error liking message: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to like message' });
    }
  });
  
  // Unlike a message
  socket.on('unlike_message', async ({ messageId }) => {
    try {
      // Validate input
      if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
        return socket.emit('error', { message: 'Invalid message ID' });
      }
      
      // Remove like from message
      const message = await Message.removeLike(messageId, userId);
      
      if (!message) {
        return socket.emit('error', { message: 'Message not found or not liked by you' });
      }
      
      // Broadcast unlike event to all clients in the room
      io.to(`room:${message.room_id}`).emit('message_unliked', {
        messageId,
        userId,
        userName,
        likes: message.likes
      });
      
      logger.info(`Message ${messageId} unliked by user ${userId}`);
    } catch (error) {
      logger.error(`Error unliking message: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to unlike message' });
    }
  });
};

module.exports = messageHandler;