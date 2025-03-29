const mongoose = require('mongoose');
const Poll = require('../models/poll');
const Message = require('../models/message');
const RevisionRoom = require('../models/revision-room');
const logger = require('../utils/logger');
const { getIo } = require('../config/socket');

/**
 * Get active polls for a room
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const getRoomPolls = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Validate roomId
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    // Check if room exists
    const room = await RevisionRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    // Get active polls
    const polls = await Poll.getActivePolls(roomId);
    
    return res.status(200).json({
      success: true,
      data: polls
    });
  } catch (error) {
    logger.error(`Error getting room polls: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get room polls'
    });
  }
};

/**
 * Create a new poll
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const createPoll = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    const { question, options, duration, allowMultipleVotes } = req.body;
    
    // Validate roomId
    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    // Validate poll data
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Question and at least 2 options are required'
      });
    }
    
    // Check if room exists and is active
    const room = await RevisionRoom.findOne({
      _id: roomId,
      is_active: true
    });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found or not active'
      });
    }
    
    // Check if user is a participant in the room
    const isParticipant = room.participants.some(
      p => p.user_id.toString() === userId
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You must join the room to create polls'
      });
    }
    
    // Get user name from participants
    const participant = room.participants.find(p => p.user_id.toString() === userId);
    const userName = participant ? participant.user_name : 'Anonymous User';
    
    // Create poll options
    const pollOptions = options.map(option => ({
      text: option,
      votes: 0,
      voted_by: []
    }));
    
    // Set expiration if provided
    let expiresAt = null;
    if (duration && typeof duration === 'number' && duration > 0) {
      expiresAt = new Date(Date.now() + duration * 60000); // Convert minutes to milliseconds
    }
    
    // Create poll
    const poll = new Poll({
      room_id: roomId,
      question,
      options: pollOptions,
      created_by: userId,
      expires_at: expiresAt,
      allow_multiple_votes: !!allowMultipleVotes
    });
    
    await poll.save();
    
    // Create a message announcing the poll
    const message = new Message({
      room_id: roomId,
      user_id: userId,
      user_name: userName,
      content: `Poll: ${question}`,
      type: 'poll',
      poll_data: {
        poll_id: poll._id,
        question: poll.question,
        options: poll.options.map(opt => opt.text),
        allow_multiple_votes: poll.allow_multiple_votes,
        expires_at: poll.expires_at
      }
    });
    
    await message.save();
    
    // Update poll with message ID
    poll.message_id = message._id;
    await poll.save();
    
    // Format response
    const response = {
      id: poll._id.toString(),
      messageId: message._id.toString(),
      question: poll.question,
      options: poll.options.map((opt, index) => ({ 
        index, 
        text: opt.text,
        votes: 0
      })),
      createdBy: {
        userId,
        userName
      },
      allowMultipleVotes: poll.allow_multiple_votes,
      expiresAt: poll.expires_at,
      timestamp: poll.created_at
    };
    
    // Broadcast new poll to all clients in the room
    const io = getIo();
    io.to(`room:${roomId}`).emit('poll_created', response);
    
    // Also send the message
    io.to(`room:${roomId}`).emit('new_message', {
      id: message._id.toString(),
      roomId,
      userId,
      userName,
      content: message.content,
      type: message.type,
      timestamp: message.timestamp,
      likes: 0,
      pollData: message.poll_data
    });
    
    // Set auto-close timer if expiration is set
    if (expiresAt) {
      const timeUntilExpiry = expiresAt.getTime() - Date.now();
      setTimeout(async () => {
        try {
          // Close the poll
          const updatedPoll = await Poll.closePoll(poll._id);
          
          // Broadcast poll closed event
          if (updatedPoll) {
            io.to(`room:${roomId}`).emit('poll_closed', {
              pollId: updatedPoll._id.toString(),
              messageId: updatedPoll.message_id.toString(),
              results: updatedPoll.options.map((opt, index) => ({
                index,
                text: opt.text,
                votes: opt.votes
              })),
              totalVotes: updatedPoll.total_votes
            });
            
            logger.info(`Poll ${poll._id} automatically closed after expiry`);
          }
        } catch (error) {
          logger.error(`Error auto-closing poll: ${error.message}`, error);
        }
      }, timeUntilExpiry);
    }
    
    return res.status(201).json({
      success: true,
      data: response,
      message: 'Poll created successfully'
    });
  } catch (error) {
    logger.error(`Error creating poll: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create poll'
    });
  }
};

/**
 * Vote in a poll
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const votePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.userId;
    const { optionIndex } = req.body;
    
    // Validate poll ID
    if (!pollId || !mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid poll ID'
      });
    }
    
    // Validate option index
    if (typeof optionIndex !== 'number' || optionIndex < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid option index'
      });
    }
    
    // Cast vote
    let poll;
    try {
      poll = await Poll.castVote(pollId, optionIndex, userId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Get user name for broadcasting
    const room = await RevisionRoom.findById(poll.room_id);
    const participant = room.participants.find(p => p.user_id.toString() === userId);
    const userName = participant ? participant.user_name : 'Anonymous User';
    
    // Broadcast vote to all clients in the room
    const io = getIo();
    io.to(`room:${poll.room_id}`).emit('poll_vote', {
      pollId: poll._id.toString(),
      messageId: poll.message_id ? poll.message_id.toString() : null,
      optionIndex,
      votes: poll.options[optionIndex].votes,
      voter: {
        userId,
        userName
      },
      totalVotes: poll.total_votes
    });
    
    return res.status(200).json({
      success: true,
      data: {
        votes: poll.options[optionIndex].votes,
        totalVotes: poll.total_votes
      },
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    logger.error(`Error voting in poll: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to vote in poll'
    });
  }
};

/**
 * Close a poll
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const closePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.userId;
    
    // Validate poll ID
    if (!pollId || !mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid poll ID'
      });
    }
    
    // Get poll
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }
    
    // Check if user is authorized to close poll
    if (poll.created_by.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the poll creator can close it'
      });
    }
    
    // Close poll
    const updatedPoll = await Poll.closePoll(pollId);
    
    // Get user name for broadcasting
    const room = await RevisionRoom.findById(poll.room_id);
    const participant = room.participants.find(p => p.user_id.toString() === userId);
    const userName = participant ? participant.user_name : 'Anonymous User';
    
    // Broadcast poll closed event
    const io = getIo();
    io.to(`room:${poll.room_id}`).emit('poll_closed', {
      pollId: updatedPoll._id.toString(),
      messageId: updatedPoll.message_id ? updatedPoll.message_id.toString() : null,
      results: updatedPoll.options.map((opt, index) => ({
        index,
        text: opt.text,
        votes: opt.votes
      })),
      totalVotes: updatedPoll.total_votes,
      closedBy: {
        userId,
        userName
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        results: updatedPoll.options.map((opt, index) => ({
          index,
          text: opt.text,
          votes: opt.votes
        })),
        totalVotes: updatedPoll.total_votes
      },
      message: 'Poll closed successfully'
    });
  } catch (error) {
    logger.error(`Error closing poll: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to close poll'
    });
  }
};

/**
 * Get poll results
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const getPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;
    
    // Validate poll ID
    if (!pollId || !mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid poll ID'
      });
    }
    
    // Get poll
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }
    
    // Format results
    const results = {
      id: poll._id.toString(),
      question: poll.question,
      options: poll.options.map((opt, index) => ({
        index,
        text: opt.text,
        votes: opt.votes
      })),
      totalVotes: poll.total_votes,
      isActive: poll.is_active,
      createdAt: poll.created_at,
      expiresAt: poll.expires_at
    };
    
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Error getting poll results: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get poll results'
    });
  }
};

module.exports = {
  getRoomPolls,
  createPoll,
  votePoll,
  closePoll,
  getPollResults
};