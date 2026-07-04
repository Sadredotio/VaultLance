const Conversation = require('../models/conversation');
const Message = require('../models/message');
const User = require('../models/user');

// @desc    Get or create a conversation between the logged-in user and another user
// @route   POST /api/messages/conversations
// @access  Private
// body: { otherUserId, jobId? }
const getOrCreateConversation = async (req, res) => {
  try {
    const { otherUserId, jobId } = req.body;
    const myId = req.user._id;

    if (!otherUserId) {
      return res.status(400).json({ message: 'otherUserId is required' });
    }
    if (otherUserId.toString() === myId.toString()) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    const otherUser = await User.findById(otherUserId).select('name avatar role headline');
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const query = {
      participants: { $all: [myId, otherUserId], $size: 2 },
    };
    if (jobId) query.jobId = jobId;

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [myId, otherUserId],
        jobId: jobId || null,
      });
    }

    res.json({
      _id: conversation._id,
      jobId: conversation.jobId,
      contractId: conversation.contractId,
      otherUser,
      lastMessage: conversation.lastMessage,
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List all conversations for the logged-in user, with unread counts
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const myId = req.user._id;

    const conversations = await Conversation.find({ participants: myId })
      .populate('participants', 'name avatar role headline')
      .populate('jobId', 'title')
      .sort({ updatedAt: -1 });

    // Attach unread count + the "other" participant for each conversation
    const withMeta = await Promise.all(
      conversations.map(async (convo) => {
        const otherUser = convo.participants.find(
          (p) => p._id.toString() !== myId.toString()
        );

        const unreadCount = await Message.countDocuments({
          conversationId: convo._id,
          senderId: { $ne: myId },
          readBy: { $ne: myId },
        });

        return {
          _id: convo._id,
          jobId: convo.jobId,
          contractId: convo.contractId,
          otherUser,
          lastMessage: convo.lastMessage,
          unreadCount,
          updatedAt: convo.updatedAt,
        };
      })
    );

    res.json(withMeta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get message history for a conversation (and mark as read)
// @route   GET /api/messages/conversations/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const myId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    if (!conversation.participants.some((p) => p.toString() === myId.toString())) {
      return res.status(401).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    // Mark all messages not sent by me as read
    await Message.updateMany(
      { conversationId, senderId: { $ne: myId }, readBy: { $ne: myId } },
      { $push: { readBy: myId } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get total unread message count across all conversations (for navbar badge)
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const myId = req.user._id;

    const myConversations = await Conversation.find({ participants: myId }).select('_id');
    const conversationIds = myConversations.map((c) => c._id);

    const count = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      senderId: { $ne: myId },
      readBy: { $ne: myId },
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  getUnreadCount,
};