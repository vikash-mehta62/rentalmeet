const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Start cron jobs
const { startAutoCancelCron, startAutoDeleteCron } = require('./utils/cronJobs');
startAutoCancelCron();
startAutoDeleteCron();

// Security middleware
app.use(helmet({
  // Relax CSP so Swagger UI assets load correctly
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
app.use(cors());

// Increase payload limit for large requests (images, etc.)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
// app.use('/api/', limiter);

//Swagger API Documentation only for developement not for Production
if (process.env.NODE_ENV !== 'production') {
  const swaggerOutput = require('./swagger-output.json');

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerOutput, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,   // keeps JWT across page refreshes
        displayRequestDuration: true, // shows response time in UI
        filter: true,                 // enables tag/endpoint search bar
        tryItOutEnabled: true,        // "Try it out" open by default
      },
      customSiteTitle: 'Venue Booking API Docs',
    })
  );
  console.log(`Swagger UI  → http://localhost:${process.env.PORT || 5000}/api-docs`);
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/venue-types', require('./routes/venueTypes'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api/vendor', require('./routes/vendor'));
app.use('/api/admin', require('./routes/admin'));

// Public: get service platform settings (for quotation calculation)
app.get('/api/service-platform-settings', async (req, res) => {
  try {
    const PlatformSettings = require('./models/PlatformSettings');
    const settings = await PlatformSettings.getSettings();
    res.json({
      success: true,
      settings: {
        serviceCGST: settings.serviceCGST,
        serviceSGST: settings.serviceSGST,
        serviceHSN: settings.serviceHSN,
        servicePlatformFee: settings.servicePlatformFee,
        serviceCategoryRates: settings.serviceCategoryRates || [],
        platformCGST: settings.platformCGST,
        platformSGST: settings.platformSGST,
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Public — service categories with vendor count & min price
app.get('/api/vendor-services/categories', async (req, res) => {
  try {
    const VendorService = require('./models/VendorService');
    const filter = { status: { $in: ['approved', 'pending', 'resubmitted'] } };
    const services = await VendorService.find(filter, 'category startingPrice featuredImage');
    const map = {};
    services.forEach(svc => {
      const cat = svc.category || 'Other';
      if (!map[cat]) map[cat] = { category: cat, vendors: 0, minPrice: null, featuredImage: null };
      map[cat].vendors += 1;
      if (svc.startingPrice && (map[cat].minPrice === null || svc.startingPrice < map[cat].minPrice)) {
        map[cat].minPrice = svc.startingPrice;
      }
      if (!map[cat].featuredImage && svc.featuredImage) {
        map[cat].featuredImage = svc.featuredImage;
      }
    });
    const categories = Object.values(map).sort((a, b) => b.vendors - a.vendors);
    res.json({ success: true, categories });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Public vendor services (no auth required)
app.get('/api/vendor-services', async (req, res) => {
  try {
    const VendorService = require('./models/VendorService');
    const { category, city, search, limit = 20, page = 1, maxPrice } = req.query;
    const filter = { status: { $in: ['approved', 'pending', 'resubmitted'] } };
    if (category) filter.category = category;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (maxPrice) filter.startingPrice = { $lte: parseInt(maxPrice) };
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
      { companyName: { $regex: search, $options: 'i' } }
    ];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [services, total] = await Promise.all([
      VendorService.find(filter)
        .populate('vendor', 'name companyName vendorCategory city state')
        .sort('-createdAt').skip(skip).limit(parseInt(limit)),
      VendorService.countDocuments(filter)
    ]);
    res.json({ success: true, services, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/vendor-services/:id', async (req, res) => {
  try {
    const VendorService = require('./models/VendorService');
    const service = await VendorService.findOne({ _id: req.params.id, status: 'approved' })
      .populate('vendor', 'name companyName vendorCategory city state phone email');
    if (!service) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, service });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST service booking (public — no auth required, guest allowed)
app.post('/api/service-bookings', async (req, res) => {
  try {
    const ServiceBooking = require('./models/ServiceBooking');
    const VendorService  = require('./models/VendorService');
    const Coupon = require('./models/Coupon');
    const crypto = require('crypto');
    const {
      serviceId, eventDate, customerInfo, items, pricing, couponCode,
      status, paymentStatus, paymentDetails, amount
    } = req.body;

    const svc = await VendorService.findById(serviceId);
    if (!svc) return res.status(404).json({ success: false, message: 'Service not found' });

    // Coupon validation
    let appliedCoupon = null;
    let discountAmount = 0;
    let finalTotal = pricing.total;

    if (couponCode) {
      let coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), service: serviceId, isActive: true });
      if (!coupon) coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), service: null, venue: null, isActive: true });
      if (coupon) {
        const now = new Date();
        const valid = (!coupon.expiryDate || now <= new Date(coupon.expiryDate)) &&
          (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
          (pricing.total >= coupon.minBookingAmount);
        if (valid) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (pricing.total * coupon.discountValue) / 100;
            if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
          } else {
            discountAmount = Math.min(coupon.discountValue, pricing.total);
          }
          discountAmount = Math.round(discountAmount);
          finalTotal = pricing.total - discountAmount;
          appliedCoupon = coupon;
        }
      }
    }

    let verifiedPaymentDetails = null;
    if (paymentDetails?.razorpay_order_id && paymentDetails?.razorpay_payment_id && paymentDetails?.razorpay_signature) {
      const sign = `${paymentDetails.razorpay_order_id}|${paymentDetails.razorpay_payment_id}`;
      const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest('hex');

      if (paymentDetails.razorpay_signature !== expectedSign) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }

      verifiedPaymentDetails = {
        razorpay_order_id: paymentDetails.razorpay_order_id,
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        razorpay_signature: paymentDetails.razorpay_signature,
        paidAt: new Date()
      };
    }

    const isPaidBooking = Boolean(verifiedPaymentDetails);
    const booking = await ServiceBooking.create({
      service: serviceId,
      vendor:  svc.vendor,
      eventDate: new Date(eventDate),
      customerInfo,
      serviceSnapshot: { title: svc.title, category: svc.category, companyName: svc.companyName, city: svc.city, state: svc.state },
      items,
      pricing: { ...pricing, discount: discountAmount, total: finalTotal },
      coupon: appliedCoupon ? { couponId: appliedCoupon._id, code: appliedCoupon.code, discountAmount } : undefined,
      amount: isPaidBooking ? Number(amount || finalTotal) : undefined,
      status: isPaidBooking ? 'confirmed' : (status || 'enquiry'),
      paymentStatus: isPaidBooking ? 'paid' : (paymentStatus || 'pending'),
      paymentDetails: isPaidBooking ? verifiedPaymentDetails : undefined,
    });

    // Bump enquiry count + coupon usage
    await VendorService.findByIdAndUpdate(serviceId, { $inc: { totalEnquiries: 1 } });
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      appliedCoupon.usages.push({ discountAmount, usedAt: new Date() });
      await appliedCoupon.save();
    }

    res.status(201).json({ success: true, booking, bookingNumber: booking.bookingNumber, quotationNumber: booking.quotationNumber || booking.bookingNumber, discountAmount, finalTotal });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET/POST service coupons (public)
app.get('/api/service-coupons', async (req, res) => {
  try {
    const Coupon = require('./models/Coupon');
    const { serviceId } = req.query;
    if (!serviceId) return res.status(400).json({ success: false, message: 'serviceId is required' });

    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [{ service: serviceId }, { service: null, venue: null }],
      $and: [
        { $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }] },
        { $or: [{ maxUses: null }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }] }
      ]
    })
      .select('code discountType discountValue maxDiscount minBookingAmount')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, coupons });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/service-coupons/validate', async (req, res) => {
  try {
    const Coupon = require('./models/Coupon');
    const { code, serviceId, bookingAmount } = req.body;
    let coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), service: serviceId, isActive: true });
    if (!coupon) coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), service: null, venue: null, isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    const now = new Date();
    if (coupon.expiryDate && now > new Date(coupon.expiryDate)) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ success: false, message: 'Coupon limit reached' });
    if (bookingAmount < coupon.minBookingAmount) return res.status(400).json({ success: false, message: `Min booking ₹${coupon.minBookingAmount} required` });
    let discountAmount = coupon.discountType === 'percentage'
      ? Math.min((bookingAmount * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
      : Math.min(coupon.discountValue, bookingAmount);
    discountAmount = Math.round(discountAmount);
    res.json({ success: true, coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue }, discountAmount });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET customer's own service bookings (by email match since guest allowed)
app.get('/api/customer/service-bookings', async (req, res) => {
  try {
    const ServiceBooking = require('./models/ServiceBooking');
    const { protect } = require('./middleware/auth');
    // inline auth check
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'Not authorized' });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const User = require('./models/User');
    const user = await User.findById(decoded.id).select('email phone');
    if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });

    const bookings = await ServiceBooking.find({
      $or: [
        { customer: user._id },
        { 'customerInfo.email': user.email }
      ]
    }).populate('service', 'title category featuredImage city state')
      .populate('vendor', 'name companyName')
      .sort('-createdAt');

    res.json({ success: true, bookings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
app.patch('/api/service-bookings/:id/downloaded', async (req, res) => {
  try {
    const ServiceBooking = require('./models/ServiceBooking');
    const ServiceQuotationDownload = require('./models/ServiceQuotationDownload');
    const { action = 'download' } = req.body;

    const booking = await ServiceBooking.findById(req.params.id)
      .populate('service', 'title category companyName city state')
      .populate('vendor', 'name');

    if (!booking) return res.status(404).json({ success: false, message: 'Not found' });

    // Update downloadedAt on booking
    booking.downloadedAt = new Date();
    await booking.save();

    // Store in ServiceQuotationDownload
    await ServiceQuotationDownload.create({
      serviceBooking: booking._id,
      service:  booking.service?._id,
      vendor:   booking.vendor?._id,
      quotationNumber: booking.quotationNumber || booking.bookingNumber,
      action,
      totalAmount: booking.pricing?.total,
      serviceSnapshot: booking.serviceSnapshot,
      customerSnapshot: {
        name:      booking.customerInfo?.name,
        email:     booking.customerInfo?.email,
        phone:     booking.customerInfo?.phone,
        company:   booking.customerInfo?.company,
        eventName: booking.customerInfo?.eventName,
      },
      eventDate: booking.eventDate,
      priceSnapshot: {
        subtotal:      booking.pricing?.subtotal,
        serviceCGST:   booking.pricing?.serviceCGST,
        serviceSGST:   booking.pricing?.serviceSGST,
        platformFee:   booking.pricing?.platformFee,
        platformFeeGST: booking.pricing?.platformFeeGST,
        discount:      booking.pricing?.discount || 0,
        couponCode:    booking.coupon?.code,
        total:         booking.pricing?.total,
      },
    });

    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/terms', require('./routes/terms'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/venues', require('./routes/venueReviews'));

// Public coupon validation
const { validateCoupon } = require('./controllers/couponController');
app.post('/api/coupons/validate', require('./middleware/auth').protect, validateCoupon);

// Public hero slides route
const { getActiveHeroSlides, getPublicContactSettings } = require('./controllers/adminController');
app.get('/api/hero-slides', getActiveHeroSlides);
app.get('/api/contact-settings', getPublicContactSettings);

// FAQ routes
app.use('/api/faqs', require('./routes/faqs'));

// Chatbot routes
app.use('/api/chatbot', require('./routes/chatbot'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
