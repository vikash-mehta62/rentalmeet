const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const connectDB = require('./config/database');

const app = express();

const parseTrustProxy = (value) => {
  if (value === undefined || value === null || value === '') return 1;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'false' || normalized === '0') return false;
  if (normalized === 'true') return 1;
  const numericValue = Number(normalized);
  if (Number.isInteger(numericValue) && numericValue >= 0) return numericValue;
  return value;
};

app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));

const { startAutoCancelCron, startAutoDeleteCron } = require('./utils/cronJobs');
const { calculateServiceConfirmationDeadline } = require('./utils/confirmationDeadline');
const { normalizeRefundAttempt } = require('./utils/refundHelper');
const { sendBookingNotifications } = require('./utils/bookingNotificationHelper');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Force HTTPS in production
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
}));

// CORS — only allow known origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://rentalmeet.com',
  'https://www.rentalmeet.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request timing logger — logs method, path, status, and response time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const color = ms < 200 ? '\x1b[32m' : ms < 1000 ? '\x1b[33m' : '\x1b[31m';
    console.log(`${color}[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)\x1b[0m`);
  });
  next();
});

// Body parsers — normal routes get 1mb, upload routes get 50mb
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/payment/webhook/razorpay')) return next();
  const isUpload = req.path.startsWith('/api/upload') || req.path.startsWith('/api/vendor/upload');
  express.json({ limit: isUpload ? '50mb' : '1mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/payment/webhook/razorpay')) return next();
  const isUpload = req.path.startsWith('/api/upload') || req.path.startsWith('/api/vendor/upload');
  express.urlencoded({ extended: true, limit: isUpload ? '50mb' : '1mb' })(req, res, next);
});

// NoSQL injection protection — strip $ operators from req.body, query, params
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (key.startsWith('$')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      });
    }
    return obj;
  };
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
});

// Rate limiting — apply strictly to auth routes to prevent brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400, // 4x increase from 100
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 80, // 4x increase from 20
  message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes.' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgotpassword', authLimiter);
app.use('/api/', limiter);

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
        servicePlatformCGST: settings.servicePlatformCGST ?? settings.platformCGST,
        servicePlatformSGST: settings.servicePlatformSGST ?? settings.platformSGST,
        serviceCategoryRates: settings.serviceCategoryRates || [],
        // keep legacy fields for backward compat
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
    const filter = { status: 'approved', isActive: true };
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
    const filter = { status: 'approved', isActive: true };
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
        .select('-bankDetails -ownerDocs -businessDocs')
        .populate('vendor', 'name companyName vendorCategory city state')
        .sort('-createdAt').skip(skip).limit(parseInt(limit)),
      VendorService.countDocuments(filter)
    ]);
    res.json({ success: true, services, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Lookup by slug (must be before /:id to avoid collision)
app.get('/api/vendor-services/slug/:slug', async (req, res) => {
  try {
    const VendorService = require('./models/VendorService');
    const service = await VendorService.findOne({ slug: req.params.slug, status: 'approved' })
      .select('-bankDetails -ownerDocs -businessDocs')
      .populate('vendor', 'name companyName vendorCategory city state');
    if (!service) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, service });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/vendor-services/:id', async (req, res) => {
  try {
    const VendorService = require('./models/VendorService');
    const service = await VendorService.findOne({ _id: req.params.id, status: 'approved' })
      .select('-bankDetails -ownerDocs -businessDocs')
      .populate('vendor', 'name companyName vendorCategory city state');
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
      serviceId: rawServiceId, eventDate, customerInfo, items, pricing, couponCode,
      status, paymentStatus, paymentDetails, amount
    } = req.body;

    // Resolve slug → ObjectId if a slug was accidentally passed
    const serviceId = await resolveServiceId(rawServiceId);
    if (!serviceId) return res.status(404).json({ success: false, message: 'Service not found' });

    const svc = await VendorService.findById(serviceId);
    if (!svc) return res.status(404).json({ success: false, message: 'Service not found' });

    const authUser = await getOptionalAuthenticatedUser(req);

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
    const confirmationHours = svc.confirmationHours || 3;
    const confirmationDeadline = isPaidBooking
      ? calculateServiceConfirmationDeadline(svc, confirmationHours)
      : undefined;

    const booking = await ServiceBooking.create({
      service: serviceId,
      vendor:  svc.vendor,
      customer: authUser?._id,
      eventDate: new Date(eventDate),
      customerInfo: {
        ...customerInfo,
        gstNumber: customerInfo?.gstNumber || authUser?.gstNumber || '',  // Save customer GST
      },
      serviceSnapshot: { 
        title: svc.title, 
        category: svc.category, 
        companyName: svc.companyName, 
        city: svc.city, 
        state: svc.state,
        gstNumber: svc.gstNumber || ''  // Save vendor GST
      },
      items,
      pricing: {
        ...pricing,
        // Normalize field names — store both camelCase and UPPERCASE for compatibility
        serviceCGST:    pricing.serviceCGST    ?? pricing.serviceCgst    ?? 0,
        serviceSGST:    pricing.serviceSGST    ?? pricing.serviceSgst    ?? 0,
        platformFeeGST: pricing.platformFeeGST ?? pricing.platformFeeGst ?? 0,
        discount: discountAmount,
        total: finalTotal
      },
      coupon: appliedCoupon ? { 
        couponId: appliedCoupon._id, 
        code: appliedCoupon.code, 
        discountAmount,
        isVendorSponsored: !!(appliedCoupon.service || appliedCoupon.serviceVendor)
      } : undefined,
      amount: isPaidBooking ? Number(amount || finalTotal) : undefined,
      status: isPaidBooking ? 'pending' : (status || 'enquiry'),
      paymentStatus: isPaidBooking ? 'paid' : (paymentStatus || 'pending'),
      paymentDetails: isPaidBooking ? verifiedPaymentDetails : undefined,
      confirmationDeadline
    });
    console.log('[ServiceBooking] Created:', booking.bookingNumber, '| pricing:', JSON.stringify(booking.pricing));

    // Bump enquiry count + coupon usage
    await VendorService.findByIdAndUpdate(serviceId, { $inc: { totalEnquiries: 1 } });
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      appliedCoupon.usages.push({ discountAmount, usedAt: new Date() });
      await appliedCoupon.save();
    }

    try {
      await sendBookingNotifications(booking, isPaidBooking ? 'created' : 'enquiry', { bookingType: 'service' });
    } catch (notifyErr) {
      console.error('[ServiceBooking] Failed to send creation notifications:', notifyErr.message);
    }

    res.status(201).json({ success: true, booking, bookingNumber: booking.bookingNumber, quotationNumber: booking.quotationNumber || booking.bookingNumber, discountAmount, finalTotal });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Helper: resolve serviceId which may be a MongoDB ObjectId OR a slug
async function resolveServiceId(serviceId) {
  if (!serviceId) return null;
  const VendorService = require('./models/VendorService');
  const isObjectId = /^[a-f\d]{24}$/i.test(serviceId);
  if (isObjectId) return serviceId; // already an ObjectId string
  const svc = await VendorService.findOne({ slug: serviceId }).select('_id');
  return svc ? svc._id.toString() : null;
}

async function getOptionalAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const jwt = require('jsonwebtoken');
    const User = require('./models/User');
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    return await User.findById(decoded.id).select('name email phone role gstNumber companyName');
  } catch (error) {
    console.warn('[ServiceBooking] Ignoring invalid optional auth token:', error.message);
    return null;
  }
}

// GET/POST service coupons (public)
app.get('/api/service-coupons', async (req, res) => {
  try {
    const Coupon = require('./models/Coupon');
    const { serviceId: rawServiceId } = req.query;
    if (!rawServiceId) return res.status(400).json({ success: false, message: 'serviceId is required' });

    // Resolve slug → ObjectId if needed
    const serviceId = await resolveServiceId(rawServiceId);

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
    const { code, serviceId: rawServiceId, bookingAmount } = req.body;

    // Resolve slug → ObjectId if needed
    const serviceId = await resolveServiceId(rawServiceId);

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

    // Light ownership check — verify caller knows the booking email (guest) or is authenticated owner
    const callerEmail = req.body.callerEmail || '';
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    let isAuthorized = false;

    if (authHeader) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const User = require('./models/User');
        const user = await User.findById(decoded.id).select('email role');
        if (user && (user.role === 'admin' || user.email === booking.customerInfo?.email)) {
          isAuthorized = true;
        }
      } catch {}
    }
    // Guest: must provide matching email
    if (!isAuthorized && callerEmail && callerEmail.toLowerCase() === booking.customerInfo?.email?.toLowerCase()) {
      isAuthorized = true;
    }
    if (!isAuthorized) return res.status(403).json({ success: false, message: 'Not authorized' });

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

// PUT /api/service-bookings/:id/confirm (vendor/admin only)
app.put('/api/service-bookings/:id/confirm', require('./middleware/auth').protect, async (req, res) => {
  try {
    const ServiceBooking = require('./models/ServiceBooking');
    const VendorService = require('./models/VendorService');
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Authorization: only the service vendor or admin can confirm
    const isVendor = req.user.id === booking.vendor?.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isVendor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to confirm this booking' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Booking cannot be confirmed in its current state (status: ${booking.status})` });
    }

    booking.status = 'confirmed';
    await booking.save();

    // Increment vendor service booking count
    await VendorService.findByIdAndUpdate(booking.service, { $inc: { totalBookings: 1 } });

    try {
      await sendBookingNotifications(booking, 'confirmed', { bookingType: 'service' });
    } catch (notifyErr) {
      console.error('[ServiceBooking] Failed to send confirmed notifications:', notifyErr.message);
    }

    res.json({ success: true, message: 'Booking confirmed successfully', booking });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/service-bookings/:id/complete (vendor/admin only)
app.put('/api/service-bookings/:id/complete', require('./middleware/auth').protect, async (req, res) => {
  try {
    const ServiceBooking = require('./models/ServiceBooking');
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Authorization: only the service vendor or admin can complete
    const isVendor = req.user.id === booking.vendor?.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isVendor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this booking' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: `Booking can only be marked completed after confirmation (current status: ${booking.status})` });
    }

    // Date/time validation for completing service bookings
    if (booking.eventDate) {
      const eventDate = new Date(booking.eventDate);
      const now = new Date();
      
      // Check if current time is after event date
      if (now <= eventDate) {
        return res.status(400).json({
          success: false,
          message: 'Booking can only be completed after the event date'
        });
      }
    }

    booking.status = 'completed';
    await booking.save();

    // Trigger Automatic Settlement for Service
    try {
      const { settleBooking } = require('./utils/settlementHelper');
      settleBooking(booking._id, 'service').catch(err => {
        console.error(`[SETTLEMENT] Automatic service settlement hook failed for completed route ${booking.bookingNumber}:`, err);
      });
    } catch (settleErr) {
      console.error(`[SETTLEMENT] Failed to initialize service settlement trigger in complete route for ${booking.bookingNumber}:`, settleErr);
    }

    try {
      await sendBookingNotifications(booking, 'completed', { bookingType: 'service' });
    } catch (notifyErr) {
      console.error('[ServiceBooking] Failed to send completed notifications:', notifyErr.message);
    }

    res.json({ success: true, message: 'Booking marked as completed successfully', booking });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/service-bookings/:id/cancel (customer/vendor/admin cancellation with auto-refund)
app.put('/api/service-bookings/:id/cancel', require('./middleware/auth').protect, async (req, res) => {
  try {
    const ServiceBooking = require('./models/ServiceBooking');
    const Razorpay = require('razorpay');
    const { reason } = req.body;

    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Booking cannot be cancelled in its current state' });
    }

    // Authorization check: "customer or jiski serivce hai wo hi cancel kar sakta hai bas"
    const isCustomer = req.user.id === booking.customer?.toString() || req.user.email?.toLowerCase() === booking.customerInfo?.email?.toLowerCase();
    const isVendor = req.user.id === booking.vendor?.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this booking' });
    }

    const role = req.user.role;

    // Refund policy
    const eventDateTime = new Date(booking.eventDate);
    const now = new Date();
    const hoursUntilEvent = (eventDateTime - now) / (1000 * 60 * 60);

    let refundAmount = 0;
    let refundEligible = false;
    let refundPolicy = '';

    if (isCustomer && !isAdmin) {
      const totalPaid = booking.amount || booking.pricing?.total || 0;
      if (hoursUntilEvent >= 48) {
        refundEligible = true;
        refundAmount = totalPaid;
        refundPolicy = 'Full refund (cancelled 48+ hours before event)';
      } else if (hoursUntilEvent >= 24) {
        refundEligible = true;
        refundAmount = Math.round(totalPaid * 0.5);
        refundPolicy = '50% refund (cancelled 24–48 hours before event)';
      } else {
        refundEligible = false;
        refundAmount = 0;
        refundPolicy = 'No refund (cancelled less than 24 hours before event)';
      }
    } else {
      // Vendor or Admin cancel -> 100% refund
      refundEligible = true;
      refundAmount = booking.amount || booking.pricing?.total || 0;
      refundPolicy = `Full refund (cancelled by ${role === 'vendor' ? 'service provider' : 'admin'})`;
    }

    // Process Razorpay refund
    let refundResult = { success: false, reason: 'No refund applicable' };

    if (refundEligible && booking.paymentStatus === 'paid' && refundAmount > 0) {
      if (!booking.paymentDetails?.razorpay_payment_id) {
        refundResult = { success: false, reason: 'No Razorpay payment ID stored on booking' };
      } else {
        try {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
          });

          const refund = await razorpay.payments.refund(
            booking.paymentDetails.razorpay_payment_id,
            {
              amount: Math.round(refundAmount * 100),
              speed: 'normal',
              notes: { bookingNumber: booking.bookingNumber, reason: reason || refundPolicy }
            }
          );
          refundResult = { success: true, ...normalizeRefundAttempt(refund, refundPolicy) };
        } catch (err) {
          console.error(`[SVC-CANCEL] Refund error:`, err);
          refundResult = { success: false, reason: err.error?.description || err.message };
        }
      }
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || refundPolicy;
    booking.cancelledBy = req.user.id;
    booking.cancelledByRole = isAdmin ? 'admin' : (isVendor ? 'vendor' : 'customer');
    booking.cancellationType = 'manual';
    booking.refundDetails = {
      refundAmount,
      refundStatus: !refundEligible || booking.paymentStatus !== 'paid'
        ? 'pending'
        : refundResult.success ? refundResult.refundStatus : 'failed',
      refundId: refundResult.refundId || null,
      refundedAt: refundResult.success ? refundResult.refundedAt : null,
      refundReason: refundPolicy
    };

    if (refundResult.success && refundResult.refundStatus === 'processed') {
      booking.paymentStatus = 'refunded';
    }

    await booking.save();

    try {
      await sendBookingNotifications(booking, 'cancelled', { bookingType: 'service' });
    } catch (notifyErr) {
      console.error('[ServiceBooking] Failed to send cancelled notifications:', notifyErr.message);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      refundEligible,
      refundAmount,
      refundPolicy,
      refundProcessed: refundResult.refundStatus === 'processed',
      refundInitiated: refundResult.success,
      refundFailReason: !refundResult.success ? refundResult.reason : undefined,
      booking
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/terms', require('./routes/terms'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/venues', require('./routes/venueReviews'));
app.use('/api/notifications', require('./routes/notifications'));

// Public coupon validation
const { validateCoupon } = require('./controllers/couponController');
app.post('/api/coupons/validate', require('./middleware/auth').protect, validateCoupon);

// Public hero slides route
const { getActiveHeroSlides, getPublicContactSettings } = require('./controllers/adminController');
app.get('/api/hero-slides', getActiveHeroSlides);
app.get('/api/contact-settings', getPublicContactSettings);

// FAQ routes
app.use('/api/faqs', require('./routes/faqs'));

// Blog routes
app.use('/api/blogs', require('./routes/blog'));

// Chatbot routes
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/auth-images', require('./routes/authImages'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Global error handler — never leak stack traces in production
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) console.error(err.stack);
  else console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${err.message}`);

  // Don't expose internal error details in production
  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Something went wrong. Please try again.',
    ...(isDev && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

const getSecretDiagnostics = (value) => {
  if (!value) {
    return { configured: false, length: 0 };
  }

  const crypto = require('crypto');
  const firstCharCode = value.charCodeAt(0);
  const lastCharCode = value.charCodeAt(value.length - 1);

  return {
    configured: true,
    length: value.length,
    sha256Prefix: crypto.createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 12),
    hasEdgeWhitespace: value.trim() !== value,
    startsWithQuote: firstCharCode === 34 || firstCharCode === 39,
    endsWithQuote: lastCharCode === 34 || lastCharCode === 39,
    firstCharCode,
    lastCharCode
  };
};

const logRazorpayWebhookConfig = () => {
  console.log('[RAZORPAY_CONFIG]', JSON.stringify({
    keyIdPrefix: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.slice(0, 8) : null,
    webhookSecret: getSecretDiagnostics(process.env.RAZORPAY_WEBHOOK_SECRET)
  }));
};

const startServer = async () => {
  try {
    await connectDB();
    startAutoCancelCron();
    startAutoDeleteCron();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      logRazorpayWebhookConfig();
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
