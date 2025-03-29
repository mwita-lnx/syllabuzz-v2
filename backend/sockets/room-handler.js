const mongoose = require('mongoose');
const RevisionRoom = require('../models/revision-room');
const logger = require('../utils/logger');

/**
 * Socket.IO handler for revision room events
 * @param {socketIo.Server} io - Socket.IO server instance
 * @param {socketIo.Socket} socket - Socket connection
 */
const roomHandler = (io, socket) => {
  if (!socket.user || !socket.user.user_id) {
    console.error('Room handler received socket without user data');
    return;
  }
  
  const userId = socket.user.user_id;
  const userName = socket.user.name || 'Anonymous User';
  
  console.log(`Room handler initialized for user ${userId} (${userName}) with socket ${socket.id}`);
  
  // Join a revision room
  socket.on('join_room', async ({ roomId }) => {
    console.log(`join_room event received for socket ${socket.id}:`, { roomId, userId });
    try {
      // Validate input
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        console.error(`Invalid room ID: ${roomId}`);
        return socket.emit('error', { message: 'Invalid room ID' });
      }
      
      console.log(`Looking for room with ID: ${roomId}`);
      // Find the room
      const room = await RevisionRoom.findById(roomId);
      
      if (!room) {
        console.error(`Room not found: ${roomId}`);
        return socket.emit('error', { message: 'Room not found' });
      }
      
      console.log(`Room found: ${room.name} (${roomId}), active: ${room.is_active}`);
      
      if (!room.is_active) {
        console.log(`Room ${roomId} is inactive`);
        return socket.emit('error', { message: 'This room is no longer active' });
      }
      
      // Add user to participants if not already present
      const existingParticipant = room.participants.find(
        p => p.user_id.toString() === userId
      );
      
      if (!existingParticipant) {
        console.log(`Adding user ${userId} to room ${roomId} participants`);
        room.participants.push({
          user_id: userId,
          user_name: userName,
          status: 'active',
          joined_at: new Date()
        });
        
        await room.save();
        console.log(`User ${userId} saved to room ${roomId} participants`);
      } else {
        // Update participant status if already in the room
        console.log(`Updating existing participant ${userId} in room ${roomId}`);
        await RevisionRoom.updateOne(
          { 
            _id: roomId,
            'participants.user_id': userId
          },
          { 
            $set: { 
              'participants.$.status': 'active',
              'participants.$.user_name': userName
            }
          }
        );
        console.log(`Updated participant ${userId} in room ${roomId}`);
      }
      
      // Join the room's Socket.IO channel
      console.log(`Joining socket ${socket.id} to channel room:${roomId}`);
      socket.join(`room:${roomId}`);
      
      // Notify other participants that a new user joined
      console.log(`Emitting user_joined event to room:${roomId}`);
      socket.to(`room:${roomId}`).emit('user_joined', {
        userId,
        userName,
        timestamp: new Date()
      });
      
      // Send room info back to the user
      console.log(`Emitting room_joined event to user ${userId}`);
      socket.emit('room_joined', {
        roomId,
        name: room.name,
        currentFocus: room.current_focus,
        participants: room.participants,
        resources: room.resources
      });
      
      logger.info(`User ${userId} joined room ${roomId}`);
      console.log(`User ${userId} joined room ${roomId} successfully`);
    } catch (error) {
      console.error(`Error joining room ${roomId} for user ${userId}:`, error);
      logger.error(`Error joining room: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // list rooms
  socket.on('list_rooms', async () => {
    try {
      // Get all active rooms for the user
      const rooms = await RevisionRoom.find({
        is_active: true
      }).select('name unit_id current_focus participants resources created_at');
      // Send the list of rooms to the user
      socket.emit('rooms_list', rooms);
      logger.info(`User ${userId} requested room list`);
      console.log(`User ${userId} requested room list:`, rooms);
    } catch (error) {
      console.error(`Error listing rooms for user ${userId}:`, error);
      logger.error(`Error listing rooms: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to list rooms' });
    }
  });

  
  // Leave a revision room
  socket.on('leave_room', async ({ roomId }) => {
    try {
      // Validate input
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        return socket.emit('error', { message: 'Invalid room ID' });
      }
      
      // Leave the room's Socket.IO channel
      socket.leave(`room:${roomId}`);
      
      // Update participant status to 'away'
      await RevisionRoom.updateOne(
        { 
          _id: roomId,
          'participants.user_id': userId
        },
        { 
          $set: { 'participants.$.status': 'away' }
        }
      );
      
      // Notify other participants that user left
      socket.to(`room:${roomId}`).emit('user_left', {
        userId,
        userName,
        timestamp: new Date()
      });
      
      logger.info(`User ${userId} left room ${roomId}`);
    } catch (error) {
      logger.error(`Error leaving room: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  });
  
  // Change user status in a room
  socket.on('change_status', async ({ roomId, status }) => {
    try {
      // Validate input
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        return socket.emit('error', { message: 'Invalid room ID' });
      }
      
      if (!['active', 'idle', 'away'].includes(status)) {
        return socket.emit('error', { message: 'Invalid status' });
      }
      
      // Update participant status
      await RevisionRoom.updateOne(
        { 
          _id: roomId,
          'participants.user_id': userId
        },
        { 
          $set: { 'participants.$.status': status }
        }
      );
      
      // Notify other participants about status change
      socket.to(`room:${roomId}`).emit('status_changed', {
        userId,
        userName,
        status,
        timestamp: new Date()
      });
      
      logger.info(`User ${userId} changed status to ${status} in room ${roomId}`);
    } catch (error) {
      logger.error(`Error changing status: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to change status' });
    }
  });
  
  // Set current focus for the room
  socket.on('set_focus', async ({ roomId, topic }) => {
    try {
      // Validate input
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        return socket.emit('error', { message: 'Invalid room ID' });
      }
      
      // Update room focus
      await RevisionRoom.updateOne(
        { _id: roomId },
        { $set: { current_focus: topic } }
      );
      
      // Notify all participants about focus change
      io.to(`room:${roomId}`).emit('focus_changed', {
        topic,
        updatedBy: {
          userId,
          userName
        },
        timestamp: new Date()
      });
      
      logger.info(`Focus changed to "${topic}" in room ${roomId} by user ${userId}`);
    } catch (error) {
      logger.error(`Error setting focus: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to set focus' });
    }
  });
  
  // Share a resource in the room
  socket.on('share_resource', async ({ roomId, resource }) => {
    try {
      // Validate input
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        return socket.emit('error', { message: 'Invalid room ID' });
      }
      
      if (!resource || !resource.type || !resource.title) {
        return socket.emit('error', { message: 'Invalid resource data' });
      }
      
      // Create resource object
      const newResource = {
        type: resource.type,
        resource_id: resource.resource_id,
        title: resource.title,
        url: resource.url,
        added_by: userId,
        added_at: new Date()
      };
      
      // Add resource to room
      await RevisionRoom.updateOne(
        { _id: roomId },
        { $push: { resources: newResource } }
      );
      
      // Get updated room to get the resource with its ID
      const updatedRoom = await RevisionRoom.findById(roomId);
      const addedResource = updatedRoom.resources[updatedRoom.resources.length - 1];
      
      // Notify all participants about the new resource
      io.to(`room:${roomId}`).emit('resource_shared', {
        resource: addedResource,
        sharedBy: {
          userId,
          userName
        },
        timestamp: new Date()
      });
      
      logger.info(`Resource "${resource.title}" shared in room ${roomId} by user ${userId}`);
    } catch (error) {
      logger.error(`Error sharing resource: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to share resource' });
    }
  });
  
  // Highlight a specific resource for everyone
  socket.on('highlight_resource', async ({ roomId, resourceId, position }) => {
    try {
      // Validate input
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        return socket.emit('error', { message: 'Invalid room ID' });
      }
      
      if (!resourceId) {
        return socket.emit('error', { message: 'Invalid resource ID' });
      }
      
      // Notify all participants about the highlighted resource
      io.to(`room:${roomId}`).emit('resource_highlighted', {
        resourceId,
        position,
        highlightedBy: {
          userId,
          userName
        },
        timestamp: new Date()
      });
      
      logger.info(`Resource ${resourceId} highlighted in room ${roomId} by user ${userId}`);
    } catch (error) {
      logger.error(`Error highlighting resource: ${error.message}`, error);
      socket.emit('error', { message: 'Failed to highlight resource' });
    }
  });
};

module.exports = roomHandler;