const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const { protect, authorize } = require('../middleware/auth');

// Public: get all active FAQs
router.get('/', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    const faqs = await FAQ.find(filter).sort('order createdAt');
    res.json({ success: true, faqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: get all FAQs (including inactive)
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const faqs = await FAQ.find().sort('order createdAt');
    res.json({ success: true, faqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: create FAQ
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { question, answer, category, order } = req.body;
    if (!question || !answer) return res.status(400).json({ success: false, message: 'Question and answer required' });
    const faq = await FAQ.create({ question, answer, category: category || 'general', order: order || 0 });
    res.status(201).json({ success: true, faq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: update FAQ
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.json({ success: true, faq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: delete FAQ
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
