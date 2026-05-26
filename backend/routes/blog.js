const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { protect, authorize } = require('../middleware/auth');

// Simple HTML sanitizer — strips script/iframe/event handlers
function sanitizeHTML(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')  // remove event handlers
    .replace(/javascript:/gi, '');
}

// ── ADMIN ROUTES (must come BEFORE /:slug to avoid conflict) ─────────────────

// GET all blogs (admin — all statuses)
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select('title slug category status readTime views publishedAt createdAt author tags')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Blog.countDocuments(query),
    ]);
    res.json({ success: true, blogs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET single blog by ID (admin)
router.get('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, blog });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create blog
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, slug, content, ...rest } = req.body;
    // Validate required fields
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' });
    if (!slug?.trim())  return res.status(400).json({ success: false, message: 'Slug is required' });
    if (title.length > 200) return res.status(400).json({ success: false, message: 'Title too long (max 200 chars)' });
    const blog = await Blog.create({
      ...rest,
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      content: sanitizeHTML(content),
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, blog });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'Slug already exists — choose a different one' });
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT update blog — use findById + save so pre('save') hooks run (readTime, publishedAt)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const { content, title, slug, ...rest } = req.body;
    if (title !== undefined) blog.title = title.trim();
    if (slug  !== undefined) blog.slug  = slug.trim().toLowerCase();
    if (content !== undefined) blog.content = sanitizeHTML(content);

    // Apply all other fields
    Object.keys(rest).forEach(key => {
      if (!['_id','createdAt','updatedAt','createdBy','views'].includes(key)) {
        blog[key] = rest[key];
      }
    });

    await blog.save(); // triggers pre('save') for readTime + publishedAt
    res.json({ success: true, blog });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'Slug already exists' });
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE blog
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, message: 'Blog deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────

// GET all published blogs (with pagination + filters)
router.get('/', async (req, res) => {
  try {
    const { category, tag, search, page = 1, limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 10, 50); // cap at 50
    const query = { status: 'published' };
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
    const skip = (parseInt(page) - 1) * limitNum;
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select('title slug category tags shortDescription featuredImage featuredImageAlt author readTime publishedAt createdAt')
        .sort('-publishedAt')
        .skip(skip)
        .limit(limitNum),
      Blog.countDocuments(query),
    ]);
    res.json({ success: true, blogs, total, page: parseInt(page), pages: Math.ceil(total / limitNum) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET categories list (only from published blogs)
router.get('/categories', async (req, res) => {
  try {
    const cats = await Blog.distinct('category', { status: 'published' });
    res.json({ success: true, categories: cats.sort() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET sitemap data for blogs (for SEO)
router.get('/sitemap', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .select('slug publishedAt updatedAt')
      .sort('-publishedAt')
      .limit(500);
    res.json({ success: true, blogs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET single blog by slug (public) — slug cannot be 'admin', 'categories', 'sitemap'
router.get('/:slug', async (req, res) => {
  try {
    const reserved = ['admin', 'categories', 'sitemap'];
    if (reserved.includes(req.params.slug)) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    // Increment views (non-blocking)
    Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).exec();
    res.json({ success: true, blog });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
