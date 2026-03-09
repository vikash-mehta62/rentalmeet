const mongoose = require('mongoose');

const venueTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 2,
    minlength: 2
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: '🏢'
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

module.exports = mongoose.model('VenueType', venueTypeSchema);
