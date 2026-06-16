const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: true // S3 URL
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
