const Coupon = require('../models/Coupon');
const Venue = require('../models/Venue');
const Counter = require('../models/Counter');

// Generate quotation number: QT-YYYY-XXXXXX
const generateQuotationNumber = async () => {
  const year = new Date().getFullYear();
  const counterId = `quotation_${year}`;
  const seq = await Counter.getNextSequence(counterId);
  return `QT-${year}-${seq.toString().padStart(6, '0')}`;
};

// ─── Owner: Create coupon ────────────────────────────────────────────────────
exports.createCoupon = async (req, res) => {
  try {
    const { venueId, code, discountType, discountValue, maxDiscount, minBookingAmount, maxUses, expiryDate } = req.body;

    // Verify venue belongs to this owner
    const venue = await Venue.findOne({ _id: venueId, owner: req.user._id });
    if (!venue) return res.status(404).json({ success: false, message: 'Venue not found or not yours' });

    const quotationNumber = await generateQuotationNumber();

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      venue: venueId,
      owner: req.user._id,
      discountType,
      discountValue,
      maxDiscount: maxDiscount || null,
      minBookingAmount: minBookingAmount || 0,
      maxUses: maxUses || null,
      expiryDate: expiryDate || null,
      quotationNumber
    });

    res.status(201).json({ success: true, coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Coupon code already exists for this venue' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Owner: Get all coupons (optionally filter by venue) ────────────────────
exports.getOwnerCoupons = async (req, res) => {
  try {
    const filter = { owner: req.user._id };
    if (req.query.venueId) filter.venue = req.query.venueId;

    const coupons = await Coupon.find(filter)
      .populate('venue', 'businessName sku')
      .sort('-createdAt');

    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Owner: Get single coupon with usage details ─────────────────────────────
exports.getCouponUsage = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('venue', 'businessName sku')
      .populate('usages.user', 'name email phone')
      .populate('usages.booking', 'bookingNumber bookingDate amount');

    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Owner: Update coupon ────────────────────────────────────────────────────
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, owner: req.user._id });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    const allowed = ['discountType', 'discountValue', 'maxDiscount', 'minBookingAmount', 'maxUses', 'expiryDate', 'isActive'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) coupon[field] = req.body[field];
    });

    // Track activate/deactivate timestamps
    if (req.body.isActive === true) {
      coupon.activatedAt = new Date();
      coupon.deactivatedAt = null;
    } else if (req.body.isActive === false) {
      coupon.deactivatedAt = new Date();
    }

    await coupon.save();
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Owner: Delete coupon ────────────────────────────────────────────────────
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Public: Validate coupon (called from booking form) ─────────────────────
exports.validateCoupon = async (req, res) => {
  try {
    const { code, venueId, bookingAmount, baseAmount, amenitiesTotal, platformFee } = req.body;

    // Try venue-specific first, then global (venue: null)
    let coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), venue: venueId, isActive: true });
    if (!coupon) {
      coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), venue: null, isActive: true });
    }

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate))
      return res.status(400).json({ success: false, message: 'Coupon has expired' });

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });

    if (bookingAmount < coupon.minBookingAmount)
      return res.status(400).json({ success: false, message: `Minimum booking amount ₹${coupon.minBookingAmount} required` });

    // Determine the applicable amount based on appliesTo
    const appliesTo = coupon.appliesTo || 'total';
    let applicableAmount = bookingAmount; // default: total
    if (appliesTo === 'platformFee') applicableAmount = platformFee || 0;
    else if (appliesTo === 'amenities') applicableAmount = amenitiesTotal || 0;
    else if (appliesTo === 'baseAmount') applicableAmount = baseAmount || 0;

    // Calculate discount on applicable amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (applicableAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      discountAmount = Math.min(coupon.discountValue, applicableAmount);
    }

    res.json({
      success: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        appliesTo
      },
      discountAmount: Math.round(discountAmount)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Public: Get active valid coupons for a venue (venue-specific + global) ──
exports.getVenueCoupons = async (req, res) => {
  try {
    const venueId = req.params.venueId || req.params.id;
    const now = new Date();
    const coupons = await Coupon.find({
      $or: [{ venue: venueId }, { venue: null }],
      isActive: true,
      $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }]
    }).select('code discountType discountValue maxDiscount minBookingAmount maxUses usedCount expiryDate');

    const valid = coupons.filter(c => c.maxUses === null || c.usedCount < c.maxUses);
    res.json({ success: true, coupons: valid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Record a coupon/quotation download ─────────────────────────────────────
exports.recordDownload = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id).populate('venue', 'businessName sku location');

    // Owner can only access their own coupons; admin can access all
    if (req.user.role !== 'admin' && coupon?.owner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    coupon.downloads.push({
      downloadedBy: req.user._id,
      role: req.user.role,
      venueSnapshot: {
        businessName: coupon.venue?.businessName,
        sku: coupon.venue?.sku,
        city: coupon.venue?.location?.city,
        state: coupon.venue?.location?.state
      }
    });

    await coupon.save();
    res.json({ success: true, message: 'Download recorded', quotationNumber: coupon.quotationNumber });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: Get all download history (venue-wise) ────────────────────────────
exports.getAdminDownloads = async (req, res) => {
  try {
    const filter = {};
    if (req.query.venueId) filter.venue = req.query.venueId;

    const coupons = await Coupon.find({ ...filter, 'downloads.0': { $exists: true } })
      .populate('venue', 'businessName sku location')
      .populate('owner', 'name email')
      .populate('downloads.downloadedBy', 'name email role')
      .select('code quotationNumber venue owner downloads')
      .sort('-updatedAt');

    // Flatten into per-download records
    const records = [];
    coupons.forEach(c => {
      c.downloads.forEach(d => {
        records.push({
          couponId: c._id,
          couponCode: c.code,
          quotationNumber: c.quotationNumber,
          venue: c.venue,
          owner: c.owner,
          downloadedBy: d.downloadedBy,
          role: d.role,
          downloadedAt: d.downloadedAt,
          venueSnapshot: d.venueSnapshot
        });
      });
    });

    // Sort by most recent download
    records.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));

    res.json({ success: true, total: records.length, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Owner: Get download history for their coupons ───────────────────────────
exports.getOwnerDownloads = async (req, res) => {
  try {
    const filter = { owner: req.user._id, 'downloads.0': { $exists: true } };
    if (req.query.venueId) filter.venue = req.query.venueId;

    const coupons = await Coupon.find(filter)
      .populate('venue', 'businessName sku location')
      .populate('downloads.downloadedBy', 'name email')
      .select('code quotationNumber venue downloads')
      .sort('-updatedAt');

    const records = [];
    coupons.forEach(c => {
      c.downloads.forEach(d => {
        records.push({
          couponId: c._id,
          couponCode: c.code,
          quotationNumber: c.quotationNumber,
          venue: c.venue,
          downloadedBy: d.downloadedBy,
          role: d.role,
          downloadedAt: d.downloadedAt,
          venueSnapshot: d.venueSnapshot
        });
      });
    });

    records.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));

    res.json({ success: true, total: records.length, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
