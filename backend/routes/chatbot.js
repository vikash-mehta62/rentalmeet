const express = require('express');
const router = express.Router();
const ChatbotSettings = require('../models/ChatbotSettings');
const { protect, authorize } = require('../middleware/auth');

// GET /api/chatbot/quick-replies  — public
router.get('/quick-replies', async (req, res) => {
  try {
    let settings = await ChatbotSettings.findOne();
    if (!settings) settings = await ChatbotSettings.create({});
    res.json({ success: true, quickReplies: settings.quickReplies, welcomeMessage: settings.welcomeMessage });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/chatbot/settings  — admin
router.get('/settings', protect, authorize('admin', 'subadmin'), async (req, res) => {
  try {
    let settings = await ChatbotSettings.findOne();
    if (!settings) settings = await ChatbotSettings.create({});
    res.json({ success: true, settings });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/chatbot/settings  — admin
router.put('/settings', protect, authorize('admin', 'subadmin'), async (req, res) => {
  try {
    const { quickReplies, welcomeMessage, isEnabled } = req.body;
    let settings = await ChatbotSettings.findOne();
    if (!settings) settings = new ChatbotSettings();
    if (quickReplies !== undefined) settings.quickReplies = quickReplies;
    if (welcomeMessage !== undefined) settings.welcomeMessage = welcomeMessage;
    if (isEnabled !== undefined) settings.isEnabled = isEnabled;
    await settings.save();
    res.json({ success: true, settings });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
