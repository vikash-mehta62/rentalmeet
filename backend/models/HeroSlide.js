const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
    default: '',
    trim: true
  },
  subtitle: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  image: {
    type: String,
    default: ''
  },
  video: {
    type: String,
    default: ''
  },
  imageOpacity: {
    type: Number,
    default: 100, // 0 to 100%
    min: 0,
    max: 100
  },
  overlayOpacity: {
    type: Number,
    default: 50, // 0 to 100%
    min: 0,
    max: 100
  },
  buttonText: {
    type: String,
    default: 'Browse Venues'
  },
  buttonLink: {
    type: String,
    default: '/venues'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for sorting
heroSlideSchema.index({ order: 1 });

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
