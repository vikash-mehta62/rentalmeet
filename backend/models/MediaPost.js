const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const mediaPostSchema = new mongoose.Schema({
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mediaType: {
    type: String,
    enum: ['photo', 'video'],
    required: true,
    default: 'photo'
  },
  mediaUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  title: {
    type: String,
    trim: true,
    maxlength: 120
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  hashtags: [{
    type: String,
    trim: true
  }],
  locationTag: {
    type: String,
    trim: true
  },
  bookingUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['published', 'draft', 'archived'],
    default: 'published',
    index: true
  },
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  savesCount: {
    type: Number,
    default: 0
  },
  comments: [commentSchema]
}, {
  timestamps: true
});

mediaPostSchema.index({ venue: 1, mediaType: 1, createdAt: -1 });
mediaPostSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('MediaPost', mediaPostSchema);
