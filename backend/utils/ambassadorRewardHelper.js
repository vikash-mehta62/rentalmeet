const Venue = require('../models/Venue');
const User = require('../models/User');
const AmbassadorProfile = require('../models/AmbassadorProfile');
const AmbassadorReward = require('../models/AmbassadorReward');

/**
 * Get Level and Listing Rate based on total approved venues
 */
const getAmbassadorTier = (approvedCount) => {
  if (approvedCount >= 500) {
    return { level: 'LV.4', title: 'City Venue Partner', rate: 200 };
  } else if (approvedCount >= 201) {
    return { level: 'LV.3', title: 'Venue Master', rate: 150 };
  } else if (approvedCount >= 51) {
    return { level: 'LV.2', title: 'Venue Champion', rate: 125 };
  } else {
    return { level: 'LV.1', title: 'Venue Explorer', rate: 100 };
  }
};

/**
 * Get Badge based on total approved venues
 */
const getAmbassadorBadge = (approvedCount) => {
  if (approvedCount >= 1000) {
    return 'City Legend';
  } else if (approvedCount >= 500) {
    return 'Gold Master';
  } else if (approvedCount >= 200) {
    return 'Silver Champion';
  } else {
    return 'Bronze Explorer';
  }
};

/**
 * Process listing reward & daily challenge bonus when a venue is approved by Admin
 */
const processVenueApprovalReward = async (venueId) => {
  try {
    const venue = await Venue.findById(venueId);
    if (!venue || !venue.ambassador) {
      return null;
    }

    const profile = await AmbassadorProfile.findOne({ user: venue.ambassador });
    if (!profile) {
      return null;
    }

    // Check if listing reward already awarded for this venue
    const existingListingReward = await AmbassadorReward.findOne({
      venue: venue._id,
      rewardType: 'listing_reward'
    });

    if (existingListingReward) {
      return { message: 'Reward already processed for this venue' };
    }

    // Determine current tier & listing reward amount
    const currentApprovedCount = profile.totalVenuesApproved || 0;
    const tier = getAmbassadorTier(currentApprovedCount);
    const listingRewardAmount = tier.rate;

    // Create Instant Listing Reward
    const listingReward = await AmbassadorReward.create({
      ambassador: venue.ambassador,
      profile: profile._id,
      rewardType: 'listing_reward',
      venue: venue._id,
      amount: listingRewardAmount,
      description: `Instant Listing Reward for verified venue: ${venue.businessName} (${tier.level} - ₹${listingRewardAmount})`,
      levelAtReward: tier.level
    });

    // Update Venue Attribution & 12-Month Profit Share Window
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 12 months
    venue.ambassadorListingApprovedAt = now;
    venue.ambassadorProfitShareExpiresAt = expiresAt;
    await venue.save();

    // Update Ambassador Profile metrics
    const newApprovedCount = currentApprovedCount + 1;
    const newTier = getAmbassadorTier(newApprovedCount);
    const newBadge = getAmbassadorBadge(newApprovedCount);

    profile.totalVenuesApproved = newApprovedCount;
    profile.assignedLevel = newTier.level;
    profile.badge = newBadge;
    profile.walletBalance = (profile.walletBalance || 0) + listingRewardAmount;
    profile.totalEarnings = (profile.totalEarnings || 0) + listingRewardAmount;

    // Daily 5-Venue Challenge Check
    const todayStr = now.toISOString().split('T')[0];
    
    // Count how many venues were approved today for this ambassador
    const startOfDay = new Date(todayStr + 'T00:00:00.000Z');
    const endOfDay = new Date(todayStr + 'T23:59:59.999Z');

    const todayRewardsCount = await AmbassadorReward.countDocuments({
      ambassador: venue.ambassador,
      rewardType: 'listing_reward',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // If reached 5 verified venues today and daily challenge bonus not yet awarded today
    if (todayRewardsCount >= 5) {
      const existingDailyBonus = await AmbassadorReward.findOne({
        ambassador: venue.ambassador,
        rewardType: 'daily_challenge',
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      if (!existingDailyBonus) {
        const challengeBonusAmount = 250; // Rs. 50 bonus x 5 venues = Rs. 250
        await AmbassadorReward.create({
          ambassador: venue.ambassador,
          profile: profile._id,
          rewardType: 'daily_challenge',
          amount: challengeBonusAmount,
          description: `Daily 5-Venues Challenge Bonus completed on ${todayStr} (₹50 x 5 = ₹250 bonus)`
        });

        profile.walletBalance += challengeBonusAmount;
        profile.totalEarnings += challengeBonusAmount;
        profile.dailyStreak = {
          date: todayStr,
          approvedCount: todayRewardsCount,
          bonusAwarded: true
        };
      }
    }

    // 7-Day Power Streak Check (+₹1,000 bonus)
    // Check daily challenge completions in the last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailyChallengesPast7Days = await AmbassadorReward.countDocuments({
      ambassador: venue.ambassador,
      rewardType: 'daily_challenge',
      createdAt: { $gte: sevenDaysAgo }
    });

    if (dailyChallengesPast7Days >= 7) {
      const existingWeeklyBonus = await AmbassadorReward.findOne({
        ambassador: venue.ambassador,
        rewardType: 'weekly_streak',
        createdAt: { $gte: sevenDaysAgo }
      });

      if (!existingWeeklyBonus) {
        const weeklyBonusAmount = 1000; // ₹1,000 bonus
        await AmbassadorReward.create({
          ambassador: venue.ambassador,
          profile: profile._id,
          rewardType: 'weekly_streak',
          amount: weeklyBonusAmount,
          description: `7-Day Power Streak Bonus completed (₹1,000 cash reward)`
        });

        profile.walletBalance += weeklyBonusAmount;
        profile.totalEarnings += weeklyBonusAmount;
        
        // UNLOCK 25% BOOKING PROFIT SHARE FOR 1 YEAR (365 DAYS)
        profile.profitShareUnlocked = true;
        profile.profitShareUnlockedAt = now;
        profile.profitShareExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        profile.weeklyStreak = {
          weekStart: sevenDaysAgo.toISOString().split('T')[0],
          approvedCount: dailyChallengesPast7Days,
          bonusAwarded: true
        };

        console.log(`[AMBASSADOR STREAK] ⚡ 7-Day Power Streak Bonus of ₹1,000 & 1-Year 25% Profit Share UNLOCKED for ambassador: ${venue.ambassador}`);
      }
    }

    // 30-Day Monthly Champion Check (+₹5,000 bonus)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const venuesApprovedPast30Days = await AmbassadorReward.countDocuments({
      ambassador: venue.ambassador,
      rewardType: 'listing_reward',
      createdAt: { $gte: thirtyDaysAgo }
    });

    if (venuesApprovedPast30Days >= 100) {
      const existingMonthlyBonus = await AmbassadorReward.findOne({
        ambassador: venue.ambassador,
        rewardType: 'monthly_champion',
        createdAt: { $gte: thirtyDaysAgo }
      });

      if (!existingMonthlyBonus) {
        const monthlyBonusAmount = 5000; // ₹5,000 bonus
        await AmbassadorReward.create({
          ambassador: venue.ambassador,
          profile: profile._id,
          rewardType: 'monthly_champion',
          amount: monthlyBonusAmount,
          description: `30-Day Monthly Champion Bonus completed (100+ verified venues - ₹5,000 cash reward)`
        });

        profile.walletBalance += monthlyBonusAmount;
        profile.totalEarnings += monthlyBonusAmount;
        console.log(`[AMBASSADOR STREAK] 🏆 30-Day Monthly Champion Bonus of ₹5,000 awarded to ambassador: ${venue.ambassador}`);
      }
    }

    await profile.save();

    return {
      success: true,
      listingReward,
      currentLevel: newTier.level,
      badge: newBadge,
      newWalletBalance: profile.walletBalance
    };
  } catch (error) {
    console.error('Error processing ambassador venue approval reward:', error);
    throw error;
  }
};

/**
 * Get current 7-Day Streak and 25% 1-Year Profit Share Status for an Ambassador
 */
const getAmbassadorStreakAndProfitShareStatus = async (ambassadorId) => {
  try {
    const profile = await AmbassadorProfile.findOne({ user: ambassadorId });
    if (!profile) return null;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayStr = now.toISOString().split('T')[0];
    const startOfDay = new Date(todayStr + 'T00:00:00.000Z');
    const endOfDay = new Date(todayStr + 'T23:59:59.999Z');

    // Count today's approved venues
    const todayVerifiedCount = await AmbassadorReward.countDocuments({
      ambassador: ambassadorId,
      rewardType: 'listing_reward',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Count completed daily challenge days (5+ venues/day) in the last 7 days
    const dailyChallengeDaysCount = await AmbassadorReward.countDocuments({
      ambassador: ambassadorId,
      rewardType: 'daily_challenge',
      createdAt: { $gte: sevenDaysAgo }
    });

    // Count total venues approved during the 7-day window
    const totalStreakVenues = await AmbassadorReward.countDocuments({
      ambassador: ambassadorId,
      rewardType: 'listing_reward',
      createdAt: { $gte: sevenDaysAgo }
    });

    const streakDaysCompleted = Math.min(7, dailyChallengeDaysCount);
    const streakTarget = 7;
    const streakDaysRemaining = Math.max(0, streakTarget - streakDaysCompleted);

    // Check if streak was already completed or profile flag is set
    const hasWeeklyReward = await AmbassadorReward.exists({
      ambassador: ambassadorId,
      rewardType: 'weekly_streak'
    });

    const isUnlocked = Boolean(profile.profitShareUnlocked || hasWeeklyReward);
    const unlockedAt = profile.profitShareUnlockedAt || profile.updatedAt || now;
    const expiresAt = profile.profitShareExpiresAt || new Date(new Date(unlockedAt).getTime() + 365 * 24 * 60 * 60 * 1000);

    const isExpired = isUnlocked && expiresAt < now;
    const daysRemaining = isUnlocked && !isExpired
      ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      profitShareUnlocked: isUnlocked && !isExpired,
      isExpired,
      streakDaysCompleted,
      streakTarget: 7,
      streakDaysRemaining,
      dailyTarget: 5,
      todayVerifiedCount,
      totalStreakVenues,
      totalVenuesTarget: 35, // 7 days x 5 venues/day
      streakProgressPercentage: Math.min(100, Math.round((streakDaysCompleted / 7) * 100)),
      venuesProgressPercentage: Math.min(100, Math.round((Math.min(35, totalStreakVenues) / 35) * 100)),
      profitShareUnlockedAt: isUnlocked ? unlockedAt : null,
      profitShareExpiresAt: isUnlocked ? expiresAt : null,
      daysRemaining,
      ruleTitle: '7-Day Streak Rule (5 Venues/Day = 35 Venues Total)',
      ruleText: '7 Days continuous streak me roz 5 verified venues list karein (Total 35 venues). Streak complete hote hi 1 Full Year (365 Days) ke liye 25% Booking Profit Share unlock ho jayega!'
    };
  } catch (err) {
    console.error('Error getting streak and profit share status:', err);
    return null;
  }
};

/**
 * Process 25% Booking Profit Share when a booking is completed / settled
 */
const processBookingProfitShare = async (booking) => {
  try {
    if (!booking || !booking.venue) return null;

    let venue = booking.venue;
    if (!venue || !venue.ambassador || !venue.businessName) {
      venue = await Venue.findById(booking.venue?._id || booking.venue);
    }

    if (!venue || !venue.ambassador) return null;

    const profile = await AmbassadorProfile.findOne({ user: venue.ambassador });
    if (!profile) return null;

    const now = new Date();

    // Check if Ambassador has unlocked 25% profit share by completing 7-Day Power Streak
    const hasWeeklyReward = await AmbassadorReward.exists({
      ambassador: venue.ambassador,
      rewardType: 'weekly_streak'
    });

    const isUnlocked = Boolean(profile.profitShareUnlocked || hasWeeklyReward);
    if (!isUnlocked) {
      console.log(`[AMBASSADOR 25% SHARE] 🔒 Locked for ambassador ${venue.ambassador}. 7-Day Streak completion required to unlock 1-Year profit share.`);
      return {
        locked: true,
        message: '25% Booking Profit Share is locked. Ambassador must complete 7-Day Power Streak to unlock 1-Year profit share.'
      };
    }

    // Check if within 1-Year (365-day) profit share eligibility window
    const expiresAt = profile.profitShareExpiresAt || (venue.ambassadorProfitShareExpiresAt || new Date(new Date(venue.ambassadorListingApprovedAt || venue.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000));
    if (expiresAt && expiresAt < now) {
      return {
        expired: true,
        message: '1-Year Profit Share validity period has expired for this ambassador/venue.'
      };
    }

    // Check if share already processed for this booking
    const existingShare = await AmbassadorReward.findOne({
      booking: booking._id,
      rewardType: 'booking_revenue_share'
    });

    if (existingShare) {
      return { message: 'Booking profit share already credited' };
    }

    // Calculate Platform Profit
    let platformProfit = 0;
    if (booking.priceBreakdown && booking.priceBreakdown.platformFee) {
      platformProfit = booking.priceBreakdown.platformFee;
    } else if (booking.platformInvoice && booking.platformInvoice.platformFee) {
      platformProfit = booking.platformInvoice.platformFee;
    } else {
      platformProfit = Math.round((booking.amount || 0) * 0.15); // Fallback: 15%
    }

    if (platformProfit <= 0) return null;

    // Ambassador gets 25% of RentalMeet profit
    const sharePercentage = 25;
    const ambassadorShare = Math.round(platformProfit * 0.25);

    if (ambassadorShare <= 0) return null;

    const reward = await AmbassadorReward.create({
      ambassador: venue.ambassador,
      profile: profile._id,
      rewardType: 'booking_revenue_share',
      venue: venue._id,
      booking: booking._id,
      amount: ambassadorShare,
      description: `25% Booking Profit Share for booking #${booking.bookingNumber || booking._id} on venue: ${venue.businessName} (Platform profit: ₹${platformProfit})`,
      profitShareDetails: {
        bookingAmount: booking.amount,
        platformProfit,
        profitSharePercentage: sharePercentage,
        calculatedShare: ambassadorShare
      }
    });

    profile.walletBalance = (profile.walletBalance || 0) + ambassadorShare;
    profile.totalEarnings = (profile.totalEarnings || 0) + ambassadorShare;
    await profile.save();

    return {
      success: true,
      reward,
      ambassadorShare,
      newWalletBalance: profile.walletBalance
    };
  } catch (error) {
    console.error('Error processing booking profit share:', error);
    throw error;
  }
};

module.exports = {
  getAmbassadorTier,
  getAmbassadorBadge,
  processVenueApprovalReward,
  processBookingProfitShare,
  getAmbassadorStreakAndProfitShareStatus
};
