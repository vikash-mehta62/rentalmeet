const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const VendorProfile = require('../models/VendorProfile');
const VendorService = require('../models/VendorService');
const { upload } = require('../middleware/upload');
const { uploadToCloudinary } = require('../config/cloudinary');

router.use(protect, authorize('vendor'));

// ── Dashboard Stats ───────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [total, approved, pending, draft] = await Promise.all([
      VendorService.countDocuments({ vendor: req.user.id }),
      VendorService.countDocuments({ vendor: req.user.id, status: 'approved' }),
      VendorService.countDocuments({ vendor: req.user.id, status: 'pending' }),
      VendorService.countDocuments({ vendor: req.user.id, status: 'draft' }),
    ]);
    res.json({ success: true, stats: { total, approved, pending, draft } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Profile ──────────────────────────────────────────────────────────────────

router.get('/profile', async (req, res) => {
  try {
    let profile = await VendorProfile.findOne({ user: req.user.id });
    if (!profile) profile = await VendorProfile.create({ user: req.user.id });
    res.json({ success: true, profile });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/profile', async (req, res) => {
  try {
    const allowed = ['basicInfo','businessInfo','address','online','pricing','portfolio',
                     'businessDocs','ownerDocs','bankDetails','availability','publicHoliday',
                     'bookingPolicy','termsAccepted','onboardingStep'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const profile = await VendorProfile.findOneAndUpdate(
      { user: req.user.id }, { $set: update },
      { new: true, upsert: true, runValidators: false }
    );
    res.json({ success: true, profile });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/profile/submit', async (req, res) => {
  try {
    const profile = await VendorProfile.findOneAndUpdate(
      { user: req.user.id },
      { status: 'pending', submittedAt: new Date(), onboardingStep: 9 },
      { new: true }
    );
    res.json({ success: true, profile, message: 'Submitted for review!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── File Upload ───────────────────────────────────────────────────────────────

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
    const result = await uploadToCloudinary(req.file.buffer, req.body.folder || 'vendors');
    res.json({ success: true, url: result.secure_url });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Services ──────────────────────────────────────────────────────────────────

// GET all my services
router.get('/services', async (req, res) => {
  try {
    const services = await VendorService.find({ vendor: req.user.id }).sort('-createdAt');
    res.json({ success: true, services });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET single service
router.get('/services/:id', async (req, res) => {
  try {
    const service = await VendorService.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!service) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, service });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create service
router.post('/services', async (req, res) => {
  try {
    const service = await VendorService.create({ ...req.body, vendor: req.user.id, status: 'draft' });
    res.status(201).json({ success: true, service });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT update service
router.put('/services/:id', async (req, res) => {
  try {
    const service = await VendorService.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      { $set: req.body },
      { new: true, runValidators: false }
    );
    if (!service) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, service });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE service
router.delete('/services/:id', async (req, res) => {
  try {
    await VendorService.findOneAndDelete({ _id: req.params.id, vendor: req.user.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST submit service for review
router.post('/services/:id/submit', async (req, res) => {
  try {
    const service = await VendorService.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      { status: 'pending' },
      { new: true }
    );
    if (!service) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, service, message: 'Submitted for review!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT resubmit rejected service
router.put('/services/:id/resubmit', async (req, res) => {
  try {
    const service = await VendorService.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!service) return res.status(404).json({ success: false, message: 'Not found' });
    if (service.status !== 'rejected') return res.status(400).json({ success: false, message: 'Only rejected services can be resubmitted' });
    service.status = 'resubmitted';
    service.resubmittedAt = new Date();
    await service.save();
    res.json({ success: true, service, message: 'Service resubmitted for review!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT toggle service active/inactive
router.put('/services/:id/toggle-active', async (req, res) => {
  try {
    const service = await VendorService.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!service) return res.status(404).json({ success: false, message: 'Not found' });
    service.isActive = !service.isActive;
    await service.save();
    res.json({ success: true, service, message: `Service ${service.isActive ? 'activated' : 'deactivated'}` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT block/unblock dates for a service
router.put('/services/:id/blocked-dates', async (req, res) => {
  try {
    const { blockedDates } = req.body;
    const service = await VendorService.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user.id },
      { $set: { blockedDates } },
      { new: true }
    );
    if (!service) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, service, message: 'Blocked dates updated' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET vendor's service bookings
router.get('/service-bookings', async (req, res) => {
  try {
    const ServiceBooking = require('../models/ServiceBooking');
    const bookings = await ServiceBooking.find({ vendor: req.user.id })
      .populate('service', 'title category')
      .sort('-createdAt');
    const stats = {
      total:     bookings.length,
      enquiry:   bookings.filter(b => b.status === 'enquiry').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
    };
    res.json({ success: true, bookings, stats });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET vendor's service quotation downloads
router.get('/service-quotation-downloads', async (req, res) => {
  try {
    const ServiceQuotationDownload = require('../models/ServiceQuotationDownload');
    const records = await ServiceQuotationDownload.find({ vendor: req.user.id }).sort('-downloadedAt');
    res.json({ success: true, records });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Service Coupons (vendor) ──────────────────────────────────────────────────
router.get('/service-coupons', async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const coupons = await Coupon.find({ serviceVendor: req.user.id })
      .populate('service', 'title category')
      .sort('-createdAt');
    res.json({ success: true, coupons });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/service-coupons', async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const VendorService = require('../models/VendorService');
    const Counter = require('../models/Counter');
    const { serviceId, code, discountType, discountValue, maxDiscount, minBookingAmount, maxUses, expiryDate } = req.body;
    const svc = await VendorService.findOne({ _id: serviceId, vendor: req.user.id });
    if (!svc) return res.status(404).json({ success: false, message: 'Service not found' });
    const year = new Date().getFullYear();
    const seq = await Counter.getNextSequence(`quotation_${year}`);
    const quotationNumber = `QT-${year}-${seq.toString().padStart(6, '0')}`;
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(), service: serviceId, serviceVendor: req.user.id,
      owner: req.user.id, discountType, discountValue: Number(discountValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      minBookingAmount: minBookingAmount ? Number(minBookingAmount) : 0,
      maxUses: maxUses ? Number(maxUses) : null,
      expiryDate: expiryDate || null, quotationNumber
    });
    res.status(201).json({ success: true, coupon });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/service-coupons/:id', async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.findOne({ _id: req.params.id, serviceVendor: req.user.id });
    if (!coupon) return res.status(404).json({ success: false, message: 'Not found' });
    ['discountType','discountValue','maxDiscount','minBookingAmount','maxUses','expiryDate','isActive'].forEach(f => {
      if (req.body[f] !== undefined) coupon[f] = req.body[f];
    });
    if (req.body.isActive === true) { coupon.activatedAt = new Date(); coupon.deactivatedAt = null; }
    else if (req.body.isActive === false) coupon.deactivatedAt = new Date();
    await coupon.save();
    res.json({ success: true, coupon });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/service-coupons/:id', async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    await Coupon.findOneAndDelete({ _id: req.params.id, serviceVendor: req.user.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
