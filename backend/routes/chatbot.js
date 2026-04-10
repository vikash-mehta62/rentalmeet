const express = require('express');
const router = express.Router();
const ChatbotSettings = require('../models/ChatbotSettings');
const { protect, authorize } = require('../middleware/auth');

// @route  GET /api/chatbot/quick-replies
// @desc   Public — get quick replies for chatbot widget
router.get('/quick-replies', async (req, res) => {
  try {
    let settings = await ChatbotSettings.findOne();
    if (!settings) settings = await ChatbotSettings.create({});
    res.json({ success: true, quickReplies: settings.quickReplies, welcomeMessage: settings.welcomeMessage });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// @route  GET /api/chatbot/settings
// @desc   Admin — get full chatbot settings
router.get('/settings', protect, authorize('admin', 'subadmin'), async (req, res) => {
  try {
    let settings = await ChatbotSettings.findOne();
    if (!settings) settings = await ChatbotSettings.create({});
    res.json({ success: true, settings });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// @route  PUT /api/chatbot/settings
// @desc   Admin — update chatbot settings
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
