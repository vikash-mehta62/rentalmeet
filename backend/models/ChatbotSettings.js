const mongoose = require('mongoose');

const chatbotSettingsSchema = new mongoose.Schema({
  quickReplies: {
    type: [String],
    default: [
      'How to book a venue?',
      'Pricing & rates',
      'List my venue',
      'Premium services',
      'Contact support',
    ]
  },
  welcomeMessage: {
    type: String,
    default: "Hello! I'm your RentalMeet booking assistant. How can I help you today?"
  },
  isEnabled: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatbotSettings', chatbotSettingsSchema);
