const express = require('express');
const { authenticate } = require('../middlewares/auth');
const pollController = require('../controllers/poll.controller');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get polls for a room
router.get('/room/:roomId', pollController.getRoomPolls);

// Create a new poll
router.post('/room/:roomId', pollController.createPoll);

// Vote in a poll
router.post('/:pollId/vote', pollController.votePoll);

// Close a poll
router.post('/:pollId/close', pollController.closePoll);

// Get poll results
router.get('/:pollId/results', pollController.getPollResults);

module.exports = router;