const express = require('express');
const { authenticate } = require('../middlewares/auth');
const roomController = require('../controllers/room.controller');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all active revision rooms
router.get('/', roomController.getRooms);

// Get rooms by unit
router.get('/unit/:unitId', roomController.getRoomsByUnit);

// Get rooms where user is a participant
router.get('/my-rooms', roomController.getMyRooms);

// Get specific revision room
router.get('/:id', roomController.getRoom);

// Create new revision room
router.post('/', roomController.createRoom);

// Update revision room
router.put('/:id', roomController.updateRoom);

// Close revision room
router.delete('/:id', roomController.closeRoom);

// Get room participants
router.get('/:id/participants', roomController.getRoomParticipants);

// Get room resources
router.get('/:id/resources', roomController.getRoomResources);

// Add resource to room
router.post('/:id/resources', roomController.addResource);

module.exports = router;