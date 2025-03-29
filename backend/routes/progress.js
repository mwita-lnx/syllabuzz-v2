const express = require('express');
const { authenticate } = require('../middleware/auth');
const progressController = require('../controllers/progress.controller');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get user study progress
router.get('/', progressController.getProgress);

// Record study time
router.post('/timer', progressController.recordStudyTime);

// Get skills assessment
router.get('/skills', progressController.getSkillsAssessment);

// Update unit progress
router.post('/unit/:unitId', progressController.updateUnitProgress);

// Get unit progress
router.get('/unit/:unitId', progressController.getUnitProgress);

module.exports = router;