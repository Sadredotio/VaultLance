const User = require('../models/user');
const Visitor = require('../models/visitor');

const ADMIN_EMAIL = 'mdsadrealam@gmail.com';

// ── Admin guard middleware ────────────────────────────────────
// Use this on every admin route
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

// ── GET /api/admin/analytics ─────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    // Registered users — sorted by most recent visit
    const registeredUsers = await User.find({})
      .select('name email role avatar walletBalance lastVisited visitCount createdAt')
      .sort({ lastVisited: -1 });

    // Anonymous visitors — last 500, most recent first
    const anonymousVisitors = await Visitor.find({})
      .sort({ createdAt: -1 })
      .limit(500);

    // Summary stats
    const totalRegistered = registeredUsers.length;
    const totalAnonymous = await Visitor.countDocuments();
    const clients = registeredUsers.filter(u => u.role === 'client').length;
    const freelancers = registeredUsers.filter(u => u.role === 'freelancer').length;

    // Active today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = registeredUsers.filter(
      u => u.lastVisited && new Date(u.lastVisited) >= today
    ).length;

    const anonymousToday = await Visitor.countDocuments({
      createdAt: { $gte: today }
    });

    res.json({
      stats: {
        totalRegistered,
        totalAnonymous,
        clients,
        freelancers,
        activeToday,
        anonymousToday,
      },
      registeredUsers,
      anonymousVisitors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { isAdmin, getAnalytics };