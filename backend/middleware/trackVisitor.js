const User = require('../models/user');
const Visitor = require('../models/visitor');

// ── Track registered user visit ──────────────────────────────
// Attach after `protect` middleware on any route you want to track.
// Updates lastVisited + visitCount on the User document.
const trackUser = async (req, res, next) => {
  try {
    if (req.user?._id) {
      // Fire-and-forget — don't await so it never slows down the response
      User.findByIdAndUpdate(req.user._id, {
        lastVisited: new Date(),
        $inc: { visitCount: 1 },
      }).catch(() => {}); // silently ignore errors
    }
  } catch (_) {}
  next();
};

// ── Track anonymous visitor ───────────────────────────────────
// Call this on the public GET /api/track endpoint hit by the frontend
// on every page load for non-authenticated users.
const trackAnonymous = async (req, res) => {
  try {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const page = req.body?.page || req.query?.page || '/';
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';

    // Deduplicate: don't log the same IP on the same page within 30 minutes
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recent = await Visitor.findOne({
      ip,
      page,
      createdAt: { $gte: thirtyMinAgo },
    });

    if (!recent) {
      await Visitor.create({ ip, page, userAgent, referrer });
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { trackUser, trackAnonymous };