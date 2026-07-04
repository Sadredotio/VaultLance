const express = require('express');
const router = express.Router();
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  getUnreadCount,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Base Route: /api/messages

router.get('/unread-count', protect, getUnreadCount);

router.route('/conversations')
  .get(protect, getConversations)
  .post(protect, getOrCreateConversation);

router.get('/conversations/:conversationId', protect, getMessages);

module.exports = router;