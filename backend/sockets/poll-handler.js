const mongoose = require('mongoose');
const Poll = require('../models/poll');
const Message = require('../models/message');
const RevisionRoom = require('../models/revision-room');
const logger = require('../utils/logger');

/**
 * Socket.IO handler for poll events
 * @param {socketIo.Server} io - Socket.IO server instance
 * @param {socketIo.Socket} socket - Socket connection
 */
const pollHandler = (io, socket) => {
  const userId = socket.user.user_id;
  const userName = socket.user.name || 'Anonymous User';
  
  // Create a new poll
  socket.on('create_poll', async ({ roomId, pollData }) => {
    try {
      // Validate input
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        return socket.emit('error', { message: 'Invalid room ID' });
      }
      
      if (!pollData || !pollData.question || !pollData.options || pollData.options.length < 2) {
        return socket.emit('error', { message: 'Invalid poll data. Question and at least 2 options are required.' });
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
        return socket.emit('error', { message: 'You must join the room to create polls' });
      }
      
      // Create poll options
      const options = pollData.options.map(option => ({
        text: option,
        votes: 0,
        voted_by: []
      }));
      
      // Set expiration if provided
      let expiresAt = null;
      if (pollData.duration && typeof pollData.duration === 'number' && pollData.duration > 0) {
        expiresAt = new Date(Date.now() + pollData.duration * 60000); // Convert minutes to milliseconds
      }
      
      // Create poll
      const poll = new Poll({
        room_id: roomId,
        question: pollData.question,
        options,
        created_by: userId,
        expires_at: expiresAt,
        allow_multiple_votes: !!pollData.allowMultipleVotes
      });
      
      await poll.save();
      
      // Create a message announcing the poll
      const message = new Message({
        room_id: roomId,
        user_id: userId,
        user_name: userName,
        content: `Poll: ${pollData.question}`,
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
      
      // Broadcast new poll to all clients in the room
      io.to(`room:${roomId}`).emit('poll_created', {
        pollId: poll._id.toString(),
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
      });
      
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
      
      logger.info(`Poll created in room ${roomId} by user ${userId}`);
      
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
    } catch (error) {
      logger.error(`Error creating poll: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to create poll' });
    }
  });
  
  // Vote in a poll
  socket.on('vote_poll', async ({ pollId, optionIndex }) => {
    try {
      // Validate input
      if (!pollId || !mongoose.Types.ObjectId.isValid(pollId)) {
        return socket.emit('error', { message: 'Invalid poll ID' });
      }
      
      if (typeof optionIndex !== 'number' || optionIndex < 0) {
        return socket.emit('error', { message: 'Invalid option index' });
      }
      
      // Cast vote
      const poll = await Poll.castVote(pollId, optionIndex, userId);
      
      // Broadcast vote to all clients in the room
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
      
      logger.info(`User ${userId} voted in poll ${pollId}, option ${optionIndex}`);
    } catch (error) {
      logger.error(`Error voting in poll: ${error.message}`, error);
      socket.emit('error', { message: error.message || 'Failed to vote in poll' });
    }
  });
  
  // Manually close a poll
  socket.on('close_poll', async ({ pollId }) => {
    try {
      // Validate input
      if (!pollId || !mongoose.Types.ObjectId.isValid(pollId)) {
        return socket.emit('error', { message: 'Invalid poll ID' });
      }
      
      // Get poll
      const poll = await Poll.findById(pollId);
      
      if (!poll) {
        return socket.emit('error', { message: 'Poll not found' });
      }
      
      // Check if user is the poll creator or has admin permissions
      if (poll.created_by.toString() !== userId) {
        return socket.emit('error', { message: 'Only the poll creator can close it' });
      }
      
      // Close poll
      const updatedPoll = await Poll.closePoll(pollId);
      
      // Broadcast poll closed event
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
      
      logger.info(`Poll ${pollId} manually closed by user ${userId}`);
    } catch (error) {
      logger.error(`Error closing poll: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to close poll' });
    }
  });
};

module.exports = pollHandler;