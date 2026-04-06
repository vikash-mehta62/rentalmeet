const Coupon = require('../models/Coupon');
const Venue = require('../models/Venue');

// ─── Owner: Create coupon ────────────────────────────────────────────────────
exports.createCoupon = async (req, res) => {
  try {
    const { venueId, code, discountType, discountValue, maxDiscount, minBookingAmount, maxUses, expiryDate } = req.body;

    // Verify venue belongs to this owner
    const venue = await Venue.findOne({ _id: venueId, owner: req.user._id });
    if (!venue) return res.status(404).json({ success: false, message: 'Venue not found or not yours' });

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      venue: venueId,
      owner: req.user._id,
      discountType,
      discountValue,
      maxDiscount: maxDiscount || null,
      minBookingAmount: minBookingAmount || 0,
      maxUses: maxUses || null,
      expiryDate: expiryDate || null
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
    const { code, venueId, bookingAmount } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      venue: venueId,
      isActive: true
    });

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    // Expiry check
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    // Max uses check
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    // Min booking amount check
    if (bookingAmount < coupon.minBookingAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking amount ₹${coupon.minBookingAmount} required`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (bookingAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      discountAmount = Math.min(coupon.discountValue, bookingAmount);
    }

    res.json({
      success: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount
      },
      discountAmount: Math.round(discountAmount)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Public: Get active valid coupons for a venue ───────────────────────────
exports.getVenueCoupons = async (req, res) => {
  try {
    const venueId = req.params.venueId || req.params.id;
    const now = new Date();
    const coupons = await Coupon.find({
      venue: venueId,
      isActive: true,
      $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }]
    }).select('code discountType discountValue maxDiscount minBookingAmount maxUses usedCount expiryDate');

    // Filter out limit-reached coupons
    const valid = coupons.filter(c => c.maxUses === null || c.usedCount < c.maxUses);

    res.json({ success: true, coupons: valid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
