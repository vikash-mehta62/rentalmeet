const mongoose = require('mongoose');

const authImageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['customer', 'venue', 'vendor', 'employee']
  },
  type: {
    type: String,
    required: true,
    enum: ['Login', 'Register']
  },
  imageUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String
  }
}, { timestamps: true });

// Ensure only one image per role and type combination
authImageSchema.index({ role: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('AuthImage', authImageSchema);
