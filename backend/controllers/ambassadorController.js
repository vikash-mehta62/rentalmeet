const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const AmbassadorProfile = require('../models/AmbassadorProfile');
const AmbassadorReward = require('../models/AmbassadorReward');
const AmbassadorPayout = require('../models/AmbassadorPayout');
const Counter = require('../models/Counter');
const { encrypt, decrypt } = require('../utils/encryption');
const { getAmbassadorTier, getAmbassadorBadge } = require('../utils/ambassadorRewardHelper');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Helper: Generate Sequential Ambassador ID (e.g. RM-AMB-1001)
const generateSequentialAmbassadorId = async () => {
  try {
    const seq = await Counter.getNextSequence('ambassador_id');
    return `RM-AMB-${(1000 + seq).toString()}`;
  } catch (error) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `RM-AMB-${randomSuffix}`;
  }
};

// @desc    Register / Submit Ambassador Application
// @route   POST /api/ambassador/apply
// @access  Public
exports.applyAmbassador = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      referralCode,
      personalInfo,
      addressDetails,
      professionalDetails,
      profileType,
      preferredWorkingArea,
      venueNetwork,
      expectedPerformance,
      bankDetails,
      documents,
      declaration,
      deviceId
    } = req.body;

    const applicantEmail = (email || personalInfo?.email || '').toLowerCase().trim();
    const applicantPhone = (phone || personalInfo?.mobileNumber || '').trim();
    const applicantName = (name || personalInfo?.fullName || '').trim();

    if (!applicantName || !applicantEmail || !applicantPhone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Email, Phone, and Password are required'
      });
    }

    // Check if user already exists
    let existingUser = await User.findOne({
      $or: [{ email: applicantEmail }, { phone: applicantPhone }]
    });

    if (existingUser && existingUser.role !== 'ambassador') {
      return res.status(400).json({
        success: false,
        message: 'An account with this email or phone already exists with a different role.'
      });
    }

    // Check if referral code was provided
    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode: referralCode.toUpperCase().trim() });
    }

    let user = existingUser;
    if (!user) {
      // Generate unique User ID
      let userId;
      try {
        const year = new Date().getFullYear();
        const seq = await Counter.getNextSequence(`user_id_${year}`);
        userId = `RM-USR-${year}-${seq.toString().padStart(5, '0')}`;
      } catch {
        userId = `RM-USR-${Date.now()}`;
      }

      user = new User({
        userId,
        name: applicantName,
        email: applicantEmail,
        phone: applicantPhone,
        password,
        role: 'ambassador',
        city: addressDetails?.city,
        state: addressDetails?.state,
        address: addressDetails?.currentAddress,
        pincode: addressDetails?.pincode,
        referredBy: referredByUser ? referredByUser._id : undefined,
        referredByCode: referralCode ? referralCode.toUpperCase().trim() : undefined
      });

      user.referralCode = user.generateReferralCode();
      await user.save();
    } else {
      user.role = 'ambassador';
      user.city = addressDetails?.city || user.city;
      user.state = addressDetails?.state || user.state;
      user.address = addressDetails?.currentAddress || user.address;
      user.pincode = addressDetails?.pincode || user.pincode;
      if (!user.referralCode) user.referralCode = user.generateReferralCode();
      await user.save();
    }

    // Encrypt bank account number if provided
    const processedBankDetails = { ...bankDetails };
    if (processedBankDetails?.accountNumber) {
      processedBankDetails.accountNumber = encrypt(processedBankDetails.accountNumber);
    }

    // Create or update Ambassador Profile
    let profile = await AmbassadorProfile.findOne({ user: user._id });
    if (!profile) {
      const generatedAmbId = await generateSequentialAmbassadorId();
      profile = new AmbassadorProfile({
        user: user._id,
        ambassadorId: generatedAmbId,
        assignedLevel: 'LV.1',
        badge: 'Bronze Explorer',
        personalInfo: {
          fullName: applicantName,
          parentName: personalInfo?.parentName || '',
          dateOfBirth: personalInfo?.dateOfBirth || '',
          gender: personalInfo?.gender || 'Male',
          mobileNumber: applicantPhone,
          whatsAppNumber: personalInfo?.whatsAppNumber || applicantPhone,
          email: applicantEmail,
          aadhaarNumber: personalInfo?.aadhaarNumber || '',
          panNumber: personalInfo?.panNumber || ''
        },
        addressDetails: {
          currentAddress: addressDetails?.currentAddress || '',
          city: addressDetails?.city || '',
          district: addressDetails?.district || '',
          state: addressDetails?.state || '',
          pincode: addressDetails?.pincode || '',
          areaCoverage: addressDetails?.areaCoverage || addressDetails?.city || ''
        },
        professionalDetails: professionalDetails || {},
        profileType: profileType || 'Venue Explorer (Part-Time)',
        preferredWorkingArea: preferredWorkingArea || {},
        venueNetwork: venueNetwork || {},
        expectedPerformance: expectedPerformance || {},
        bankDetails: processedBankDetails || {},
        referralInfo: {
          referredByAmbassadorId: referralCode || '',
          referralCode: user.referralCode
        },
        documents: documents || {},
        declaration: declaration || { agreed: true, applicantSignatureName: applicantName, date: new Date() },
        applicationStatus: 'approved' // Automatically activated so they can start listing immediately!
      });
      await profile.save();
    } else {
      profile.personalInfo = { ...profile.personalInfo, ...personalInfo, fullName: applicantName, email: applicantEmail, mobileNumber: applicantPhone };
      profile.addressDetails = { ...profile.addressDetails, ...addressDetails };
      profile.professionalDetails = { ...profile.professionalDetails, ...professionalDetails };
      profile.profileType = profileType || profile.profileType;
      profile.preferredWorkingArea = { ...profile.preferredWorkingArea, ...preferredWorkingArea };
      profile.venueNetwork = { ...profile.venueNetwork, ...venueNetwork };
      profile.expectedPerformance = { ...profile.expectedPerformance, ...expectedPerformance };
      if (processedBankDetails?.accountNumber) profile.bankDetails = processedBankDetails;
      profile.documents = { ...profile.documents, ...documents };
      profile.applicationStatus = 'approved';
      await profile.save();
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Venue Ambassador Application submitted successfully! Welcome to the RentalMeet Network.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode
      },
      profile
    });
  } catch (error) {
    console.error('Ambassador Application error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting Ambassador application'
    });
  }
};

// @desc    Get Ambassador Dashboard stats & overview
// @route   GET /api/ambassador/dashboard
// @access  Private (Ambassador)
exports.getAmbassadorDashboard = async (req, res) => {
  try {
    const profile = await AmbassadorProfile.findOne({ user: req.user._id });
    
    // Get all venues submitted by this ambassador
    const venues = await Venue.find({ ambassador: req.user._id })
      .select('businessName sku location status images createdAt totalBookings totalEarnings')
      .sort({ createdAt: -1 });

    const totalSubmitted = venues.length;
    const approvedVenues = venues.filter(v => v.status === 'approved');
    const pendingVenues = venues.filter(v => v.status === 'pending');
    const rejectedVenues = venues.filter(v => v.status === 'rejected');

    // Auto catch-up any approved venues missing their instant listing reward
    for (const av of approvedVenues) {
      const alreadyRewarded = await AmbassadorReward.exists({ venue: av._id, rewardType: 'listing_reward' });
      if (!alreadyRewarded) {
        try {
          await processVenueApprovalReward(av._id);
        } catch (catchUpErr) {
          console.error('[AMBASSADOR REWARD CATCHUP] Error:', catchUpErr.message);
        }
      }
    }

    // Refresh profile and rewards breakdown
    const updatedProfile = await AmbassadorProfile.findOne({ user: req.user._id });
    const profileToUse = updatedProfile || profile;

    // Get rewards breakdown
    const rewards = await AmbassadorReward.find({ ambassador: req.user._id })
      .sort({ createdAt: -1 });

    const instantListingEarnings = rewards
      .filter(r => r.rewardType === 'listing_reward')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const challengeBonusEarnings = rewards
      .filter(r => ['daily_challenge', 'weekly_streak', 'monthly_champion', 'monthly_award'].includes(r.rewardType))
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const bookingShareEarnings = rewards
      .filter(r => r.rewardType === 'booking_revenue_share')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const totalEarnings = instantListingEarnings + challengeBonusEarnings + bookingShareEarnings;

    // Calculate current tier level & badge
    const approvedCount = approvedVenues.length;
    const tier = getAmbassadorTier(approvedCount);
    const badge = getAmbassadorBadge(approvedCount);

    // Calculate next level progress
    let nextTierTarget = 50;
    let currentTierBase = 0;
    if (approvedCount >= 500) {
      nextTierTarget = 1000;
      currentTierBase = 500;
    } else if (approvedCount >= 200) {
      nextTierTarget = 500;
      currentTierBase = 200;
    } else if (approvedCount >= 50) {
      nextTierTarget = 200;
      currentTierBase = 51;
    }

    const progressPercentage = Math.min(100, Math.round(((approvedCount - currentTierBase) / (nextTierTarget - currentTierBase)) * 100)) || 0;

    // Today's challenge progress
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startOfDay = new Date(todayStr + 'T00:00:00.000Z');
    const endOfDay = new Date(todayStr + 'T23:59:59.999Z');

    const todayVerifiedCount = await AmbassadorReward.countDocuments({
      ambassador: req.user._id,
      rewardType: 'listing_reward',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({
      success: true,
      data: {
        profile: {
          ambassadorId: profileToUse?.ambassadorId || `RM-AMB-${req.user._id.toString().slice(-4)}`,
          assignedLevel: tier.level,
          tierTitle: tier.title,
          listingRate: tier.rate,
          badge,
          walletBalance: profileToUse?.walletBalance || 0,
          totalEarnings,
          applicationStatus: profileToUse?.applicationStatus || 'approved'
        },
        stats: {
          totalSubmitted,
          approvedCount,
          pendingCount: pendingVenues.length,
          rejectedCount: rejectedVenues.length,
          instantListingEarnings,
          challengeBonusEarnings,
          bookingShareEarnings,
          totalEarnings
        },
        progress: {
          currentLevel: tier.level,
          tierTitle: tier.title,
          currentRate: tier.rate,
          nextTierTarget,
          approvedCount,
          progressPercentage
        },
        challenges: {
          todayVerifiedCount,
          dailyTarget: 5,
          dailyBonusRate: 50,
          dailyBonusEarned: todayVerifiedCount >= 5 ? 250 : 0
        },
        recentVenues: venues.slice(0, 5),
        recentRewards: rewards.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Ambassador Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

// @desc    Get all venues submitted by Ambassador
// @route   GET /api/ambassador/venues
// @access  Private (Ambassador)
exports.getAmbassadorVenues = async (req, res) => {
  try {
    const venues = await Venue.find({ ambassador: req.user._id })
      .select('businessName sku location venueType foodType capacity status rejectionReason images owner ownerInfo totalBookings totalEarnings createdAt ambassadorListingApprovedAt ambassadorProfitShareExpiresAt')
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    const venueIds = venues.map(v => v._id);

    // Auto catch-up any approved venues missing their instant listing reward
    const { processVenueApprovalReward } = require('../utils/ambassadorRewardHelper');
    for (const v of venues) {
      if (v.status === 'approved') {
        const alreadyRewarded = await AmbassadorReward.exists({ venue: v._id, rewardType: 'listing_reward' });
        if (!alreadyRewarded) {
          try {
            await processVenueApprovalReward(v._id);
          } catch (catchUpErr) {
            console.error('[AMBASSADOR REWARD CATCHUP] Error:', catchUpErr.message);
          }
        }
      }
    }

    // Aggregate real bookings for these venues
    const Booking = require('../models/Booking');
    const bookingStats = await Booking.aggregate([
      { $match: { venue: { $in: venueIds }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$venue',
          totalBookings: { $sum: 1 },
          grossBookingAmount: { $sum: '$totalAmount' },
          totalCommission: { $sum: { $ifNull: ['$commissionAmount', { $multiply: ['$totalAmount', 0.15] }] } }
        }
      }
    ]);

    // Aggregate rewards credited to ambassador for these venues
    const rewardsStats = await AmbassadorReward.aggregate([
      { $match: { ambassador: req.user._id, venue: { $in: venueIds }, rewardType: 'booking_revenue_share' } },
      {
        $group: {
          _id: '$venue',
          ambassadorShare: { $sum: '$amount' }
        }
      }
    ]);

    const bookingMap = {};
    bookingStats.forEach(b => {
      bookingMap[b._id.toString()] = b;
    });

    const rewardMap = {};
    rewardsStats.forEach(r => {
      rewardMap[r._id.toString()] = r.ambassadorShare;
    });

    const enrichedVenues = venues.map(v => {
      const bStat = bookingMap[v._id.toString()] || {};
      const count = bStat.totalBookings || v.totalBookings || 0;
      const grossAmount = bStat.grossBookingAmount || v.totalEarnings || 0;
      const share = rewardMap[v._id.toString()] !== undefined
        ? rewardMap[v._id.toString()]
        : Math.round((bStat.totalCommission || (grossAmount * 0.15)) * 0.25);

      return {
        ...v,
        totalBookings: count,
        grossRevenue: grossAmount,
        ambassadorProfitShare: share
      };
    });

    res.json({
      success: true,
      count: enrichedVenues.length,
      venues: enrichedVenues
    });
  } catch (error) {
    console.error('Get ambassador venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching venues'
    });
  }
};

// @desc    Get Ambassador Rewards & Earnings Ledger
// @route   GET /api/ambassador/earnings
// @access  Private (Ambassador)
exports.getAmbassadorEarnings = async (req, res) => {
  try {
    const venues = await Venue.find({ ambassador: req.user._id, status: 'approved' });
    const { processVenueApprovalReward } = require('../utils/ambassadorRewardHelper');
    for (const v of venues) {
      const alreadyRewarded = await AmbassadorReward.exists({ venue: v._id, rewardType: 'listing_reward' });
      if (!alreadyRewarded) {
        try {
          await processVenueApprovalReward(v._id);
        } catch {}
      }
    }

    const rewards = await AmbassadorReward.find({ ambassador: req.user._id })
      .populate('venue', 'businessName sku location images')
      .populate('booking', 'bookingNumber amount bookingDate')
      .sort({ createdAt: -1 });

    const profile = await AmbassadorProfile.findOne({ user: req.user._id });

    const instantListingEarnings = rewards
      .filter(r => r.rewardType === 'listing_reward')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const challengeBonusEarnings = rewards
      .filter(r => ['daily_challenge', 'weekly_streak', 'monthly_champion', 'monthly_award'].includes(r.rewardType))
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const bookingShareEarnings = rewards
      .filter(r => r.rewardType === 'booking_revenue_share')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const totalEarnings = instantListingEarnings + challengeBonusEarnings + bookingShareEarnings;

    const payload = {
      walletBalance: profile?.walletBalance || 0,
      totalEarnings,
      breakdown: {
        listingRewards: instantListingEarnings,
        challengeBonuses: challengeBonusEarnings,
        bookingShare: bookingShareEarnings
      },
      summary: {
        instantListingEarnings,
        challengeBonusEarnings,
        bookingShareEarnings
      },
      recentRewards: rewards,
      rewards
    };

    res.json({
      success: true,
      ...payload,
      data: payload
    });
  } catch (error) {
    console.error('Get ambassador earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings'
    });
  }
};

// @desc    Request Payout / Withdrawal
// @route   POST /api/ambassador/payouts/request
// @access  Private (Ambassador)
exports.requestPayout = async (req, res) => {
  try {
    const { amount, payoutMethod, upiId, bankDetails } = req.body;
    const requestedAmount = Number(amount);

    if (!requestedAmount || requestedAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ₹100'
      });
    }

    const profile = await AmbassadorProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if ((profile.walletBalance || 0) < requestedAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available balance: ₹${profile.walletBalance || 0}`
      });
    }

    // Generate Sequential Payout ID
    let seq = 1;
    try {
      seq = await Counter.getNextSequence('ambassador_payout');
    } catch {
      seq = Math.floor(1000 + Math.random() * 9000);
    }
    const year = new Date().getFullYear();
    const payoutNumber = `PAY-AMB-${year}-${seq.toString().padStart(5, '0')}`;

    // Deduct from wallet balance
    profile.walletBalance -= requestedAmount;
    await profile.save();

    const payout = await AmbassadorPayout.create({
      payoutNumber,
      ambassador: req.user._id,
      profile: profile._id,
      amount: requestedAmount,
      payoutMethod: payoutMethod || 'UPI',
      payoutDetails: {
        upiId: upiId || profile.bankDetails?.upiId,
        accountHolderName: bankDetails?.accountHolderName || profile.bankDetails?.accountHolderName,
        bankName: bankDetails?.bankName || profile.bankDetails?.bankName,
        accountNumber: bankDetails?.accountNumber || profile.bankDetails?.accountNumber,
        ifscCode: bankDetails?.ifscCode || profile.bankDetails?.ifscCode
      },
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: `Withdrawal request for ₹${requestedAmount} submitted successfully.`,
      payout,
      remainingWalletBalance: profile.walletBalance
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing payout request'
    });
  }
};

// @desc    Get Ambassador Payout History
// @route   GET /api/ambassador/payouts
// @access  Private (Ambassador)
exports.getPayoutHistory = async (req, res) => {
  try {
    const payouts = await AmbassadorPayout.find({ ambassador: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payouts.length,
      payouts
    });
  } catch (error) {
    console.error('Get payout history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payout history'
    });
  }
};

// @desc    Get Pan-India Ambassador Leaderboard & Monthly Awards
// @route   GET /api/ambassador/leaderboard
// @access  Public / Private
exports.getAmbassadorLeaderboard = async (req, res) => {
  try {
    const topAmbassadors = await AmbassadorProfile.find({ applicationStatus: 'approved' })
      .populate('user', 'name city state profilePicture referralCode')
      .select('ambassadorId assignedLevel badge totalVenuesApproved totalEarnings')
      .sort({ totalVenuesApproved: -1, totalEarnings: -1 })
      .limit(20);

    const monthlyAwards = [
      { position: '1st - RentalMeet Star Performer', reward: '₹25,000', icon: '🏆' },
      { position: '2nd Position', reward: '₹15,000', icon: '🥈' },
      { position: '3rd Position', reward: '₹10,000', icon: '🥉' },
      { position: 'Top City Partner', reward: 'Special Partner Recognition', icon: '⭐' }
    ];

    res.json({
      success: true,
      leaderboard: topAmbassadors,
      monthlyAwards
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard'
    });
  }
};

// @desc    Get Ambassador Profile details
// @route   GET /api/ambassador/profile
// @access  Private (Ambassador)
exports.getAmbassadorProfile = async (req, res) => {
  try {
    const profile = await AmbassadorProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Ambassador profile not found' });
    }

    const profileObj = profile.toObject();

    // Decrypt bank account number for viewing
    if (profileObj.bankDetails && profileObj.bankDetails.accountNumber) {
      try {
        profileObj.bankDetails.accountNumber = decrypt(profileObj.bankDetails.accountNumber);
      } catch (err) {
        console.error('Decrypt bank account error:', err);
      }
    }

    res.json({
      success: true,
      profile: profileObj,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        referralCode: req.user.referralCode
      }
    });
  } catch (error) {
    console.error('Get ambassador profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

// @desc    Update Ambassador Profile & Bank Details
// @route   PUT /api/ambassador/profile
// @access  Private (Ambassador)
exports.updateAmbassadorProfile = async (req, res) => {
  try {
    const { personalInfo, addressDetails, professionalDetails, venueNetwork, bankDetails } = req.body;

    let profile = await AmbassadorProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (personalInfo) {
      profile.personalInfo = { ...profile.personalInfo, ...personalInfo };
      if (personalInfo.fullName) req.user.name = personalInfo.fullName;
    }
    if (addressDetails) {
      profile.addressDetails = { ...profile.addressDetails, ...addressDetails };
      if (addressDetails.city) req.user.city = addressDetails.city;
      if (addressDetails.state) req.user.state = addressDetails.state;
    }
    if (professionalDetails) {
      profile.professionalDetails = { ...profile.professionalDetails, ...professionalDetails };
    }
    if (venueNetwork) {
      profile.venueNetwork = { ...profile.venueNetwork, ...venueNetwork };
    }
    if (bankDetails) {
      const processedBank = { ...bankDetails };
      if (processedBank.accountNumber) {
        processedBank.accountNumber = encrypt(processedBank.accountNumber);
      }
      profile.bankDetails = { ...profile.bankDetails, ...processedBank };
    }

    await profile.save();
    await req.user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update ambassador profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};

// @desc    Get All Bookings on Ambassador Listed Venues with 25% Profit Share
// @route   GET /api/ambassador/bookings
// @access  Private (Ambassador)
exports.getAmbassadorBookings = async (req, res) => {
  try {
    const venues = await Venue.find({ ambassador: req.user._id }).select('_id businessName sku location venueType ambassadorProfitShareExpiresAt');
    const venueIds = venues.map(v => v._id);

    const bookings = await Booking.find({ venue: { $in: venueIds } })
      .populate('venue', 'businessName sku location venueType ambassadorProfitShareExpiresAt')
      .populate('customer', 'name email phone')
      .sort('-createdAt');

    // Calculate profit share for each booking
    const now = new Date();
    const bookingsWithShare = bookings.map(b => {
      const obj = b.toObject();
      const platformProfit = b.commissionAmount || Math.round((b.totalAmount || b.amount || 0) * 0.15);
      const isEligible = b.venue?.ambassadorProfitShareExpiresAt ? new Date(b.venue.ambassadorProfitShareExpiresAt) >= new Date(b.bookingDate || b.createdAt) : true;
      const profitShare = isEligible ? Math.round(platformProfit * 0.25) : 0;
      obj.platformProfit = platformProfit;
      obj.ambassadorShare = profitShare;
      obj.isShareEligible = isEligible;
      return obj;
    });

    const totalShareEarnings = bookingsWithShare
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (b.ambassadorShare || 0), 0);

    res.json({
      success: true,
      count: bookingsWithShare.length,
      totalShareEarnings,
      bookings: bookingsWithShare
    });
  } catch (error) {
    console.error('Get ambassador bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching bookings'
    });
  }
};

