const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true, lowercase: true, trim: true },
  category:         { type: String, default: 'Venue Tips' },
  tags:             [{ type: String, trim: true }],
  shortDescription: { type: String, trim: true },
  content:          { type: String, default: '' }, // HTML from Tiptap
  author:           { type: String, default: 'Admin' },
  status:           { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  readTime:         { type: Number, default: 1 }, // minutes, auto-calculated
  featuredImage:    { type: String, default: null },
  featuredImageAlt: { type: String, default: '' },

  // SEO
  seo: {
    focusKeyword:   { type: String, default: '' },
    metaTitle:      { type: String, default: '' },
    metaDescription:{ type: String, default: '' },
    canonicalUrl:   { type: String, default: '' },
    ogTitle:        { type: String, default: '' },
    ogDescription:  { type: String, default: '' },
    ogImage:        { type: String, default: '' },
    noIndex:        { type: Boolean, default: false },
  },

  // Schema toggles
  schemaMarkup: {
    article:      { type: Boolean, default: true },
    faqPage:      { type: Boolean, default: false },
    breadcrumb:   { type: Boolean, default: true },
  },

  // FAQ
  faqs: [{
    question: { type: String },
    answer:   { type: String },
  }],

  // Stats
  views:     { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

// Auto-calculate read time from content (avg 200 words/min)
blogSchema.pre('save', function(next) {
  if (this.isModified('content') && this.content) {
    const text = this.content.replace(/<[^>]+>/g, ' ');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    this.readTime = Math.max(1, Math.ceil(words / 200));
  }
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);

// Indexes for performance
blogSchema.index({ slug: 1 }, { unique: true });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ createdBy: 1 });
