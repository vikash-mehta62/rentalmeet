const crypto = require('crypto');
const Razorpay = require('razorpay');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const OfflineBooking = require('../models/OfflineBooking');
const MediaPost = require('../models/MediaPost');
const { SUBSCRIPTION_PLANS } = require('../config/subscriptionPlans');

// Helper to get active subscription or default to starter
const getActiveOwnerSubscription = async (ownerId) => {
  const now = new Date();
  let sub = await Subscription.findOne({
    owner: ownerId,
    status: 'active'
  }).sort({ createdAt: -1 });

  if (sub && sub.expiryDate && now > new Date(sub.expiryDate)) {
    sub.status = 'expired';
    await sub.save();
    sub = null;
  }

  // Ensure default plans are present in DB
  try {
    await SubscriptionPlan.seedDefaultsIfEmpty();
  } catch {}

  const planKey = sub ? sub.plan : 'starter';
  let planDetails = await SubscriptionPlan.findOne({ planId: planKey });
  if (!planDetails) {
    planDetails = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.starter;
  }

  if (!sub) {
    return {
      plan: 'starter',
      status: 'active',
      isFree: true,
      expiryDate: null,
      daysRemaining: null,
      details: planDetails
    };
  }

  const daysRemaining = sub.expiryDate
    ? Math.max(0, Math.ceil((new Date(sub.expiryDate) - now) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    _id: sub._id,
    subscriptionId: sub.subscriptionId,
    plan: sub.plan,
    status: sub.status,
    startDate: sub.startDate,
    expiryDate: sub.expiryDate,
    daysRemaining,
    isFree: sub.plan === 'starter',
    details: planDetails
  };
};

// @desc    Get all available subscription plans
// @route   GET /api/subscription/plans
// @access  Public
exports.getPlans = async (req, res) => {
  try {
    await SubscriptionPlan.seedDefaultsIfEmpty();
    const plans = await SubscriptionPlan.find({ isActive: true }).sort('displayOrder');
    if (plans && plans.length > 0) {
      return res.json({
        success: true,
        plans
      });
    }

    res.json({
      success: true,
      plans: Object.values(SUBSCRIPTION_PLANS)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged-in owner subscription status and usage
// @route   GET /api/subscription/my-status
// @access  Private (Owner)
exports.getOwnerSubscriptionStatus = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const activeSub = await getActiveOwnerSubscription(ownerId);
    const planLimits = activeSub.details.limits || {};

    // Calculate usage
    const venues = await Venue.find({ owner: ownerId }).select('_id images');
    const venueIds = venues.map(v => v._id);
    const venuesCount = venues.length;

    // Start of current calendar month for booking limit
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Only successfully accepted/confirmed bookings count against Starter monthly limit
    const [confirmedOnlineCount, offlineCount, mediaPosts] = await Promise.all([
      Booking.countDocuments({
        venue: { $in: venueIds },
        status: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: startOfMonth }
      }),
      OfflineBooking.countDocuments({
        venue: { $in: venueIds },
        status: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: startOfMonth }
      }),
      MediaPost.find({ owner: ownerId, status: { $ne: 'archived' } }).select('mediaType venue')
    ]);

    // Count photos and videos across venues & media posts
    let totalPhotos = 0;
    let totalVideos = 0;
    venues.forEach(v => {
      totalPhotos += (v.images || []).length;
    });
    mediaPosts.forEach(p => {
      if (p.mediaType === 'video') totalVideos += 1;
      else totalPhotos += 1;
    });

    const maxVenues = planLimits.maxVenues ?? 1;
    const monthlyOnlineBookings = planLimits.monthlyOnlineBookings ?? 3;
    const monthlyOfflineBookings = planLimits.monthlyOfflineBookings ?? 3;

    const usage = {
      venuesCount,
      maxVenues,
      venuesRemaining: maxVenues >= 99999 ? 'Unlimited' : Math.max(0, maxVenues - venuesCount),
      
      monthlyOnlineBookingsUsed: confirmedOnlineCount,
      monthlyOnlineBookingsLimit: monthlyOnlineBookings,
      
      monthlyOfflineBookingsUsed: offlineCount,
      monthlyOfflineBookingsLimit: monthlyOfflineBookings,

      photosUsed: totalPhotos,
      photosPerVenueLimit: planLimits.photosPerVenue ?? 5,

      videosUsed: totalVideos,
      videosPerVenueLimit: planLimits.videosPerVenue ?? 3
    };

    res.json({
      success: true,
      subscription: activeSub,
      usage,
      limits: planLimits
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Razorpay Order for Subscription Upgrade
// @route   POST /api/subscription/create-order
// @access  Private (Owner)
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const { plan, billingCycle = 'monthly', venueCount = 8 } = req.body;

    let planConfig = await SubscriptionPlan.findOne({ planId: plan, isActive: true });
    if (!planConfig) {
      planConfig = SUBSCRIPTION_PLANS[plan];
    }
    if (!planConfig) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan' });
    }

    let basePrice = planConfig.price || 0;

    if (plan === 'pro') {
      basePrice = billingCycle === 'annual' ? (planConfig.annualPrice || 2999) : (planConfig.price || 299);
    } else if (plan === 'business') {
      basePrice = billingCycle === 'annual' ? (planConfig.annualPrice || 6999) : (planConfig.price || 699);
    } else if (plan === 'custom') {
      const minV = planConfig.minVenues || 8;
      const vCount = Math.max(minV, parseInt(venueCount) || minV);
      const monthlyPerVenue = planConfig.perVenueMonthlyPrice || 90;
      basePrice = billingCycle === 'annual' ? (monthlyPerVenue * 12 * vCount) : (monthlyPerVenue * vCount);
    } else {
      basePrice = billingCycle === 'annual' ? (planConfig.annualPrice || planConfig.price || 0) : (planConfig.price || 0);
    }

    const gstRate = 0.18; // 18% GST exclusive
    const taxAmount = Math.round(basePrice * gstRate);
    const totalAmount = basePrice + taxAmount;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const receipt = `SUB_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 1000)}`;

    const options = {
      amount: Math.round(totalAmount * 100), // in paise
      currency: 'INR',
      receipt,
      notes: {
        subscriptionType: 'venue_owner',
        plan,
        billingCycle,
        venueCount: plan === 'custom' ? venueCount : undefined,
        ownerId: req.user._id.toString(),
        ownerEmail: req.user.email,
        basePrice,
        taxAmount,
        totalAmount
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      planDetails: {
        plan,
        billingCycle,
        basePrice,
        taxAmount,
        totalAmount,
        planName: planConfig.name,
        badge: planConfig.badge
      },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create subscription order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment and Activate Subscription
// @route   POST /api/subscription/verify
// @access  Private (Owner)
exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      billingCycle = 'monthly'
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    // Verify signature
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    let planConfig = await SubscriptionPlan.findOne({ planId: plan });
    if (!planConfig) {
      planConfig = SUBSCRIPTION_PLANS[plan];
    }
    if (!planConfig) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const durationDays = billingCycle === 'annual' ? 365 : (planConfig.durationDays || 30);
    const now = new Date();
    const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Expire any existing active subscriptions for this owner
    await Subscription.updateMany(
      { owner: req.user._id, status: 'active' },
      { $set: { status: 'expired' } }
    );

    const basePrice = billingCycle === 'annual' ? (planConfig.annualPrice || planConfig.price || 0) : (planConfig.price || 0);
    const taxAmount = Math.round(basePrice * 0.18);
    const totalAmount = basePrice + taxAmount;
    const subscriptionId = `SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSub = await Subscription.create({
      owner: req.user._id,
      subscriptionId,
      plan,
      billingCycle,
      amount: basePrice,
      taxAmount,
      totalAmount,
      status: 'active',
      startDate: now,
      expiryDate,
      paymentDetails: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        paidAt: now
      },
      paymentStatus: 'paid'
    });

    res.json({
      success: true,
      message: `Congratulations! Your ${planConfig.name} is now active.`,
      subscription: newSub
    });
  } catch (error) {
    console.error('Verify subscription payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveOwnerSubscription = getActiveOwnerSubscription;
