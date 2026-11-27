const mongoose = require('mongoose');

const mediaEngagementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['like', 'save', 'follow', 'view'],
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionToken: {
    type: String
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MediaPost',
    index: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }
}, {
  timestamps: true
});

// Composite unique indexes to prevent double likes, double saves, double follows
mediaEngagementSchema.index({ type: 1, user: 1, post: 1 }, { unique: true, partialFilterExpression: { post: { $exists: true }, user: { $exists: true } } });
mediaEngagementSchema.index({ type: 1, user: 1, venue: 1 }, { unique: true, partialFilterExpression: { venue: { $exists: true }, type: 'follow', user: { $exists: true } } });

module.exports = mongoose.model('MediaEngagement', mediaEngagementSchema);
