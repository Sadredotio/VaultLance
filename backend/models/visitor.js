const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      default: 'unknown',
    },
    page: {
      type: String,
      default: '/',
    },
    userAgent: {
      type: String,
      default: '',
    },
    referrer: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visitor', visitorSchema);