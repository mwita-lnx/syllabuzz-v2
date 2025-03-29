const express = require('express');
const roomRoutes = require('./rooms');
const messageRoutes = require('./messages');
const pollRoutes = require('./polls');
const progressRoutes = require('./progress');

const router = express.Router();

// Mount routes
router.use('/rooms', roomRoutes);
router.use('/rooms', messageRoutes); // Nested under rooms
router.use('/polls', pollRoutes);
router.use('/progress', progressRoutes);

// Export assembled router
module.exports = router;