const mongoose = require('mongoose');
const Message = require('../models/message');
const RevisionRoom = require('../models/revision-room');
const logger = require('../utils/logger');
const { getIo } = require('../config/socket');

// HTTP Status codes as constants
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Get messages in a room
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;
    
    // Validate roomId
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    // Check if room exists
    const room = await RevisionRoom.findById(roomId);
    if (!room) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    // Parse before timestamp if provided
    let beforeTimestamp = null;
    if (before) {
      beforeTimestamp = new Date(before);
      if (isNaN(beforeTimestamp.getTime())) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Invalid before timestamp'
        });
      }
    }
    
    // Get messages
    const messages = await Message.getRoomMessages(
      roomId,
      parseInt(limit),
      beforeTimestamp
    );
    
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: messages
    });
  } catch (error) {
    logger.error(`Error getting room messages: ${error.message}`, error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to get room messages'
    });
  }
};

/**
 * Create a new message
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const createMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    const { content, parent_id, type, resource_data, poll_data } = req.body;
    
    // Validate roomId
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    // Validate content
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Message content is required'
      });
    }
    
    // Check if room exists and is active
    const room = await RevisionRoom.findOne({
      _id: roomId,
      is_active: true
    });
    
    if (!room) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Room not found or not active'
      });
    }
    
    // Check if user is a participant in the room
    const isParticipant = room.participants.some(
      p => p.user_id.toString() === userId
    );
    
    if (!isParticipant) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'You must join the room to send messages'
      });
    }
    
    // Get user name from participants
    const participant = room.participants.find(p => p.user_id.toString() === userId);
    const userName = participant ? participant.user_name : 'Anonymous User';
    
    // Create message
    const messageData = {
      room_id: roomId,
      user_id: userId,
      user_name: userName,
      content: content.trim(),
      type: type || 'text',
      timestamp: new Date()
    };
    
    // Add parent ID if this is a reply
    if (parent_id && mongoose.Types.ObjectId.isValid(parent_id)) {
      // Check if parent message exists
      const parentMessage = await Message.findOne({
        _id: parent_id,
        room_id: roomId
      });
      
      if (parentMessage) {
        messageData.parent_id = parent_id;
      }
    }
    
    // Add additional data for special message types
    if (type === 'resource' && resource_data) {
      messageData.resource_data = resource_data;
    } else if (type === 'poll' && poll_data) {
      messageData.poll_data = poll_data;
    }
    
    // Save message
    const message = new Message(messageData);
    await message.save();
    
    // Format message for response
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
    const io = getIo();
    io.to(`room:${roomId}`).emit('new_message', messageToSend);
    
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: messageToSend,
      message: 'Message sent successfully'
    });
  } catch (error) {
    logger.error(`Error creating message: ${error.message}`, error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to send message'
    });
  }
};

/**
 * Get replies to a message
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const getMessageReplies = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    
    // Validate IDs
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid message ID'
      });
    }
    
    // Check if message exists
    const message = await Message.findOne({
      _id: messageId,
      room_id: roomId
    });
    
    if (!message) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    // Get replies
    const replies = await Message.getReplies(messageId);
    
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: replies
    });
  } catch (error) {
    logger.error(`Error getting message replies: ${error.message}`, error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to get message replies'
    });
  }
};

/**
 * Like a message
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const likeMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const userId = req.user.userId;
    
    // Validate IDs
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid message ID'
      });
    }
    
    // Check if message exists
    const message = await Message.findOne({
      _id: messageId,
      room_id: roomId
    });
    
    if (!message) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    // Add like to message
    const updatedMessage = await Message.addLike(messageId, userId);
    
    if (!updatedMessage) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Message already liked by you'
      });
    }
    
    // Get user name for broadcasting
    const room = await RevisionRoom.findById(roomId);
    const participant = room.participants.find(p => p.user_id.toString() === userId);
    const userName = participant ? participant.user_name : 'Anonymous User';
    
    // Broadcast like event to all clients in the room
    const io = getIo();
    io.to(`room:${roomId}`).emit('message_liked', {
      messageId,
      userId,
      userName,
      likes: updatedMessage.likes
    });
    
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        likes: updatedMessage.likes
      },
      message: 'Message liked successfully'
    });
  } catch (error) {
    logger.error(`Error liking message: ${error.message}`, error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to like message'
    });
  }
};

/**
 * Unlike a message
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const unlikeMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const userId = req.user.userId;
    
    // Validate IDs
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid message ID'
      });
    }
    
    // Check if message exists
    const message = await Message.findOne({
      _id: messageId,
      room_id: roomId
    });
    
    if (!message) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    // Remove like from message
    const updatedMessage = await Message.removeLike(messageId, userId);
    
    if (!updatedMessage) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Message not liked by you'
      });
    }
    
    // Get user name for broadcasting
    const room = await RevisionRoom.findById(roomId);
    const participant = room.participants.find(p => p.user_id.toString() === userId);
    const userName = participant ? participant.user_name : 'Anonymous User';
    
    // Broadcast unlike event to all clients in the room
    const io = getIo();
    io.to(`room:${roomId}`).emit('message_unliked', {
      messageId,
      userId,
      userName,
      likes: updatedMessage.likes
    });
    
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        likes: updatedMessage.likes
      },
      message: 'Message unliked successfully'
    });
  } catch (error) {
    logger.error(`Error unliking message: ${error.message}`, error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to unlike message'
    });
  }
};

module.exports = {
  getRoomMessages,
  createMessage,
  getMessageReplies,
  likeMessage,
  unlikeMessage
};