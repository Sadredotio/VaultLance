const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

// Track which userId is connected on which socket(s)
const onlineUsers = new Map(); // userId (string) -> Set of socket ids

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Authenticate every socket connection using the same JWT as the REST API ──
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🟢 Socket connected: ${socket.user.name} (${userId})`);

    // Track this user as online
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Let everyone know this user is online (broadcast minimal info)
    io.emit('user_online', { userId });

    // ── JOIN a conversation room ──
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // ── SEND a message ──
    socket.on('send_message', async ({ conversationId, text }, callback) => {
      try {
        if (!text || !text.trim()) {
          return callback?.({ error: 'Message cannot be empty' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return callback?.({ error: 'Conversation not found' });
        }
        if (!conversation.participants.some((p) => p.toString() === userId)) {
          return callback?.({ error: 'Not authorized' });
        }

        const message = await Message.create({
          conversationId,
          senderId: userId,
          text: text.trim(),
          readBy: [userId], // sender has implicitly "read" their own message
        });

        conversation.lastMessage = {
          text: message.text,
          senderId: userId,
          createdAt: message.createdAt,
        };
        await conversation.save();

        const payload = {
          _id: message._id,
          conversationId,
          senderId: userId,
          text: message.text,
          createdAt: message.createdAt,
        };

        // Send to everyone in the conversation room (including sender, for confirmation)
        io.to(`conversation_${conversationId}`).emit('new_message', payload);

        // Also notify the other participant directly in case they're not in the room
        // (e.g. they have the app open but aren't viewing this specific chat)
        const otherParticipantId = conversation.participants
          .find((p) => p.toString() !== userId)
          ?.toString();

        if (otherParticipantId && onlineUsers.has(otherParticipantId)) {
          io.to(`conversation_${conversationId}`).emit('conversation_updated', {
            conversationId,
            lastMessage: conversation.lastMessage,
          });
        }

        callback?.({ success: true, message: payload });
      } catch (err) {
        console.error('send_message error:', err.message);
        callback?.({ error: 'Failed to send message' });
      }
    });

    // ── TYPING indicator ──
    socket.on('typing', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('typing', {
        conversationId,
        userId,
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('stop_typing', {
        conversationId,
        userId,
      });
    });

    // ── MARK messages as read while actively viewing a conversation ──
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        await Message.updateMany(
          { conversationId, senderId: { $ne: userId }, readBy: { $ne: userId } },
          { $push: { readBy: userId } }
        );
        socket.to(`conversation_${conversationId}`).emit('messages_read', {
          conversationId,
          readerId: userId,
        });
      } catch (err) {
        console.error('mark_read error:', err.message);
      }
    });

    // ── DISCONNECT ──
    socket.on('disconnect', () => {
      console.log(`🔴 Socket disconnected: ${socket.user.name} (${userId})`);
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId });
        }
      }
    });
  });

  return io;
}

module.exports = initSocket;