const express = require('express');
const router = express.Router();
const { getGlobalChatMessages, sendGlobalChatMessage } = require('../controllers/globalChatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getGlobalChatMessages)
  .post(protect, sendGlobalChatMessage);

module.exports = router;
