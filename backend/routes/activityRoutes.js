const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const activityController = require('../controllers/activityController');

// Add logging for debugging
console.log('Setting up activity routes');

router.get('/recent', verifyToken, checkRole(['admin', 'developer']), activityController.getRecentActivities);

module.exports = router; 