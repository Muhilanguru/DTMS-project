const express = require('express');
const router = express.Router();
const { generateAISuggestion } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/ai/suggest - Generate AI suggestion
router.post('/suggest', protect, generateAISuggestion);

module.exports = router;