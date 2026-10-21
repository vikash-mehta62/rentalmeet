const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { protect, authorize, checkPermission } = require('../middleware/auth');

// Simple HTML sanitizer — strips script/iframe/event handlers
function sanitizeHTML(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')  // remove event handlers
    .replace(/javascript:/gi, '');
}

function getMimeType(url = '') {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.webp')) return 'image/webp';
  if (cleanUrl.endsWith('.png')) return 'image/png';
  if (cleanUrl.endsWith('.gif')) return 'image/gif';
  if (cleanUrl.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

function escapeCdata(str = '') {
  return String(str || '').replace(/]]>/g, ']]]]><![CDATA[>');
}

function stripHtml(html = '') {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildBlogRssXml(blogs, siteUrl = 'https://www.rentalmeet.com') {
  const feedUrl = `${siteUrl}/blog/feed.xml`;
  const latestDate = blogs[0]?.publishedAt || blogs[0]?.createdAt || new Date();
  const buildDate = new Date(latestDate).toUTCString();

  let itemsXml = '';
  for (const b of blogs) {
    const postUrl = `${siteUrl}/blog/${b.slug}`;
    const pubDate = new Date(b.publishedAt || b.createdAt).toUTCString();
    const title = escapeCdata(b.title || '');
    const desc = escapeCdata(stripHtml(b.shortDescription || b.seo?.metaDescription || b.title || ''));
    const author = escapeCdata(b.author || 'RentalMeet');
    const category = escapeCdata(b.category || 'Venue Tips');
    const imageUrl = b.featuredImage || `${siteUrl}/logo.png`;
    const mimeType = getMimeType(imageUrl);

    itemsXml += `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${author}]]></dc:creator>
      <category><![CDATA[${category}]]></category>
      <description><![CDATA[${desc}]]></description>
      <content:encoded><![CDATA[<p><img src="${imageUrl}" alt="${title}" /></p><p>${desc}</p>]]></content:encoded>
      <enclosure url="${imageUrl}" length="0" type="${mimeType}" />
      <media:content url="${imageUrl}" medium="image" type="${mimeType}">
        <media:title><![CDATA[${title}]]></media:title>
        <media:description><![CDATA[${desc}]]></media:description>
      </media:content>
      <media:thumbnail url="${imageUrl}" />
    </item>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
  xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>RentalMeet Blog - Venue &amp; Event Booking Insights</title>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <link>${siteUrl}/blog</link>
    <description>Guides, marketing strategies, compliance checklists, and booking best practices for banquet halls, event venues, and rental spaces across India.</description>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <language>en-IN</language>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>RentalMeet Blog</title>
      <link>${siteUrl}/blog</link>
      <width>144</width>
      <height>36</height>
    </image>${itemsXml}
  </channel>
</rss>`;
}

// ── ADMIN ROUTES (must come BEFORE /:slug to avoid conflict) ─────────────────

// GET all blogs (admin — all statuses)
router.get('/admin/all', protect, authorize('admin'), checkPermission('blogs'), async (req, res) => {
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
router.get('/admin/:id', protect, authorize('admin'), checkPermission('blogs'), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, blog });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create blog
router.post('/', protect, authorize('admin'), checkPermission('blogs'), async (req, res) => {
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
router.put('/:id', protect, authorize('admin'), checkPermission('blogs'), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const { content, title, slug, ...rest } = req.body;
    if (title !== undefined) blog.title = title.trim();
    if (slug  !== undefined) blog.slug  = slug.trim().toLowerCase();
    if (content !== undefined) blog.content = sanitizeHTML(content);

    // Apply all other fields (exclude internal/meta fields like __v, _id, etc.)
    const excludedKeys = ['_id', '__v', 'createdAt', 'updatedAt', 'createdBy', 'views'];
    Object.keys(rest).forEach(key => {
      if (!excludedKeys.includes(key)) {
        blog[key] = rest[key];
      }
    });

    await blog.save(); // triggers pre('save') for readTime + publishedAt
    res.json({ success: true, blog });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'Slug already exists' });
    if (e.name === 'VersionError') {
      return res.status(409).json({ success: false, message: 'Blog was updated in another session. Please refresh and try again.' });
    }
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE blog
router.delete('/:id', protect, authorize('admin'), checkPermission('blogs'), async (req, res) => {
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
    const limitNum = Math.min(parseInt(limit) || 10, 500); // allow up to 500
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

// GET RSS 2.0 Feed for Pinterest auto-publishing & RSS readers (all published blogs)
const handleRssFeed = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .select('title slug category author shortDescription featuredImage seo publishedAt createdAt')
      .sort('-publishedAt');
    const xml = buildBlogRssXml(blogs);
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.send(xml);
  } catch (e) {
    res.status(500).send('Error generating RSS feed');
  }
};

router.get('/feed.xml', handleRssFeed);
router.get('/feed', handleRssFeed);
router.get('/rss.xml', handleRssFeed);

// GET single blog by slug (public) — slug cannot be 'admin', 'categories', 'sitemap'
router.get('/:slug', async (req, res) => {
  try {
    const reserved = ['admin', 'categories', 'sitemap', 'feed.xml', 'feed', 'rss.xml'];
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
