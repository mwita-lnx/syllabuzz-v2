const mongoose = require('mongoose');
const RevisionRoom = require('../models/revision-room');
const logger = require('../utils/logger');
const { getIo } = require('../config/socket');

/**
 * Get all active revision rooms
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const getRooms = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    // Build query
    const query = { is_active: true };
    
    // Add search if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { unit_code: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const rooms = await RevisionRoom.find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const total = await RevisionRoom.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      data: rooms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Error getting rooms: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get rooms'
    });
  }
};

/**
 * Get rooms by unit ID
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const getRoomsByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    
    // Validate unitId
    if (!unitId || !mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid unit ID'
      });
    }
    
    // Get rooms for unit
    const rooms = await RevisionRoom.getActiveRoomsByUnit(unitId);
    
    return res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (error) {
    logger.error(`Error getting rooms by unit: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get rooms by unit'
    });
  }
};

/**
 * Get rooms where the current user is a participant
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const getMyRooms = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get rooms where user is a participant
    const rooms = await RevisionRoom.getRoomsByParticipant(userId);
    
    return res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (error) {
    logger.error(`Error getting user's rooms: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get your rooms'
    });
  }
};

/**
 * Get a specific revision room by ID
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const getRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    // Get room
    const room = await RevisionRoom.findById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    logger.error(`Error getting room: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get room'
    });
  }
};

/**
 * Create a new revision room
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const createRoom = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, unit_id, unit_code, faculty_code, topic, tags } = req.body;
    
    // Validate required fields
    if (!name || !unit_id || !unit_code || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, unit_id, unit_code, and topic are required'
      });
    }
    
    // Create room
    const room = new RevisionRoom({
      name,
      description,
      unit_id,
      unit_code,
      faculty_code,
      topic,
      created_by: userId,
      is_active: true,
      current_focus: topic,
      participants: [{
        user_id: userId,
        user_name: req.body.user_name || 'Room Creator',
        status: 'active',
        joined_at: new Date()
      }],
      tags: tags || []
    });
    
    await room.save();
    
    // Notify clients about new room (optional, depends on requirements)
    const io = getIo();
    io.emit('new_room', {
      id: room._id.toString(),
      name: room.name,
      unit_code: room.unit_code,
      topic: room.topic,
      created_at: room.created_at
    });
    
    return res.status(201).json({
      success: true,
      data: room,
      message: 'Revision room created successfully'
    });
  } catch (error) {
    logger.error(`Error creating room: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create room'
    });
  }
};

/**
 * Update a revision room
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description, topic, current_focus, tags } = req.body;
    
    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    // Get room
    const room = await RevisionRoom.findById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    // Check if user is the creator
    if (room.created_by.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the room creator can update the room'
      });
    }
    
    // Update fields
    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (topic) room.topic = topic;
    if (current_focus) room.current_focus = current_focus;
    if (tags) room.tags = tags;
    
    await room.save();
    
    // Notify clients about updated room
    const io = getIo();
    io.to(`room:${id}`).emit('room_updated', {
      id: room._id.toString(),
      name: room.name,
      description: room.description,
      topic: room.topic,
      current_focus: room.current_focus,
      tags: room.tags
    });
    
    return res.status(200).json({
      success: true,
      data: room,
      message: 'Revision room updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating room: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update room'
    });
  }
};

/**
 * Close a revision room
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const closeRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    // Get room
    const room = await RevisionRoom.findById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    // Check if user is the creator
    if (room.created_by.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the room creator can close the room'
      });
    }
    
    // Close room
    room.is_active = false;
    await room.save();
    
    // Notify clients about closed room
    const io = getIo();
    io.to(`room:${id}`).emit('room_closed', {
      id: room._id.toString(),
      closed_by: userId,
      timestamp: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: 'Revision room closed successfully'
    });
  } catch (error) {
    logger.error(`Error closing room: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to close room'
    });
  }
};

/**
 * Get participants in a room
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const getRoomParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    // Get room
    const room = await RevisionRoom.findById(id, 'participants');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: room.participants
    });
  } catch (error) {
    logger.error(`Error getting room participants: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get room participants'
    });
  }
};

/**
 * Get resources in a room
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const getRoomResources = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    // Get room
    const room = await RevisionRoom.findById(id, 'resources');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: room.resources
    });
  } catch (error) {
    logger.error(`Error getting room resources: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get room resources'
    });
  }
};

/**
 * Add a resource to a room
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
const addResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { type, resource_id, title, url } = req.body;
    
    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    // Validate resource data
    if (!type || !title) {
      return res.status(400).json({
        success: false,
        error: 'Resource type and title are required'
      });
    }
    
    // Create resource object
    const resource = {
      type,
      title,
      added_by: userId,
      added_at: new Date()
    };
    
    if (resource_id && mongoose.Types.ObjectId.isValid(resource_id)) {
      resource.resource_id = resource_id;
    }
    
    if (url) {
      resource.url = url;
    }
    
    // Add resource to room
    const room = await RevisionRoom.findByIdAndUpdate(
      id,
      { $push: { resources: resource } },
      { new: true }
    );
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    // Get the added resource
    const addedResource = room.resources[room.resources.length - 1];
    
    // Notify clients about new resource
    const io = getIo();
    io.to(`room:${id}`).emit('resource_shared', {
      resource: addedResource,
      sharedBy: {
        userId,
        userName: req.body.user_name || 'User'
      },
      timestamp: addedResource.added_at
    });
    
    return res.status(201).json({
      success: true,
      data: addedResource,
      message: 'Resource added to room successfully'
    });
  } catch (error) {
    logger.error(`Error adding resource to room: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add resource to room'
    });
  }
};

module.exports = {
  getRooms,
  getRoomsByUnit,
  getMyRooms,
  getRoom,
  createRoom,
  updateRoom,
  closeRoom,
  getRoomParticipants,
  getRoomResources,
  addResource
};