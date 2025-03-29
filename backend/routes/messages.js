const express = require('express');
const { authenticate } = require('../middlewares/auth');
const messageController = require('../controllers/message.controller');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get messages in a room
router.get('/:roomId/messages', messageController.getRoomMessages);

// Create a new message
router.post('/:roomId/messages', messageController.createMessage);

// Get replies to a message
router.get('/:roomId/messages/:messageId/replies', messageController.getMessageReplies);

// Like a message
router.post('/:roomId/messages/:messageId/like', messageController.likeMessage);

// Unlike a message
router.delete('/:roomId/messages/:messageId/like', messageController.unlikeMessage);

module.exports = router;