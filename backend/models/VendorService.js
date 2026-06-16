const mongoose = require('mongoose');

// ── Slug helper ───────────────────────────────────────────────────────────────
function buildSlug(title, city) {
  const base = [title, city]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
    .trim()
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-');           // collapse multiple hyphens
  return base;
}

async function generateUniqueSlug(title, city, existingId = null) {
  const base = buildSlug(title, city);
  let slug = base;
  let i = 1;
  while (true) {
    const query = { slug };
    if (existingId) query._id = { $ne: existingId };
    const exists = await mongoose.model('VendorService').findOne(query).select('_id');
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

const vendorServiceSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Step 1 — Contact Info
  contactInfo: {
    fullName:        String,
    primaryMobile:   String,
    secondaryMobile: String,
    role:            { type: String, enum: ['owner', 'manager', 'representative'], default: 'owner' }
  },

  // Step 2 — Business Info
  title:           { type: String, required: true, trim: true },
  slug:            { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  category:        { type: String, required: true },
  companyName:     String,
  brandName:       String,
  experienceYears: Number,
  description:     String,
  specialization:  [String],
  tags:            [String],

  // Step 3 — Address
  officeAddress:    String,
  state:            String,
  city:             String,
  area:             String,
  village:          String,
  pincode:          String,
  serviceableAreas: [String],
  website:          String,
  instagram:        String,
  facebook:         String,

  // Step 4 — Pricing
  startingPrice:     Number,
  minimumOrderPrice: Number,
  packages: [{
    sno:      Number,
    name:     String,
    price:    Number,
    unit:     String,
    minQty:   { type: Number, default: 1 },
    maxQty:   { type: Number, default: null }
  }],

  // Step 5 — Portfolio
  featuredImage:     String,
  images:            [String],
  videoLinks:        [String],
  previousWorkLinks: [String],

  // Step 6 — Documents
  businessDocs: {
    registrationCertificate: String,
    msme:         String,
    gst:          String,
    pan:          String,
    tradeLicense: String,
    fssai:        String
  },
  ownerDocs: {
    aadhaarFront: String,
    aadhaarBack:  String,
    pan:          String,
    selfie:       String
  },

  // Step 7 — Bank
  bankDetails: {
    accountHolderName: String,
    accountNumber:     String,
    ifsc:              String,
    bankName:          String,
    branchName:        String,
    accountType:       { type: String, enum: ['savings', 'current'], default: 'savings' },
    upiId:             String,
    proof:             String
  },

  // Step 8 — Availability
  availability: [{
    day:         String,
    isAvailable: { type: Boolean, default: true },
    startTime:   String,
    endTime:     String
  }],
  publicHoliday: {
    isAvailable: { type: Boolean, default: false },
    startTime:   String,
    endTime:     String
  },
  advanceBooking: {
    type: String,
    enum: ['same-day', '24h', '48h', '1week', 'custom'],
    default: '24h'
  },
  customAdvanceDays: Number,

  // Confirmation deadline hours
  confirmationHours: {
    type: Number,
    default: 3,
    min: 1,
    max: 3
  },

  // Terms
  termsAccepted: { type: Boolean, default: false },

  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'resubmitted'],
    default: 'draft'
  },
  rejectionReason: String,
  rejectionHistory: [{
    reason:     String,
    rejectedAt: { type: Date, default: Date.now },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  resubmittedAt: Date,
  currentStep:     { type: Number, default: 1 },

  // Stats
  totalEnquiries: { type: Number, default: 0 },
  totalBookings:  { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },

  // Owner-blocked dates
  blockedDates: [{
    date:   { type: Date, required: true },
    reason: { type: String, default: 'Blocked by vendor' }
  }]
}, { timestamps: true });

// ── Auto-generate slug on create / title/city change (via .save()) ──────────
vendorServiceSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('title') || this.isModified('city') || !this.slug) {
    this.slug = await generateUniqueSlug(this.title, this.city, this._id);
  }
  next();
});

// ── Also handle findOneAndUpdate / findByIdAndUpdate ─────────────────────────
// These bypass pre('save'), so we regenerate slug if title or city is being changed.
vendorServiceSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  // Support both $set and top-level field updates
  const newTitle = update?.$set?.title || update?.title;
  const newCity  = update?.$set?.city  || update?.city;

  if (!newTitle && !newCity) return next(); // nothing slug-relevant changed

  // Get the existing document to fill missing title/city
  const doc = await this.model.findOne(this.getQuery()).select('title city slug _id');
  if (!doc) return next();

  const title = newTitle || doc.title;
  const city  = newCity  || doc.city;
  const newSlug = await generateUniqueSlug(title, city, doc._id);

  // Inject slug into the update
  if (update.$set) {
    update.$set.slug = newSlug;
  } else {
    update.slug = newSlug;
  }
  next();
});

module.exports = mongoose.model('VendorService', vendorServiceSchema);
