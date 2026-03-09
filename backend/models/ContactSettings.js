const mongoose = require('mongoose');

const contactSettingsSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    default: 'G-137, Gautam Nagar, Near Chokak Bridge, Bhopal'
  },
  phone: {
    type: String,
    required: true,
    default: '+91 8423796767'
  },
  email: {
    type: String,
    required: true,
    default: 'booking@rentalmeet.in'
  },
  availability: {
    type: String,
    default: '24/7 Available'
  },
  socialMedia: {
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },
  filterSettings: {
    capacityMin: { type: Number, default: 10 },
    capacityMax: { type: Number, default: 1000 },
    priceMin: { type: Number, default: 1000 },
    priceMax: { type: Number, default: 1000000 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContactSettings', contactSettingsSchema);
