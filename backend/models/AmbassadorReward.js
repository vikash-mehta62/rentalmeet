const mongoose = require('mongoose');

const ambassadorRewardSchema = new mongoose.Schema({
  ambassador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbassadorProfile',
    index: true
  },
  rewardType: {
    type: String,
    enum: [
      'listing_reward',        // Instant listing reward on venue approval (Rs. 100 - Rs. 200)
      'daily_challenge',       // Daily 5-venue challenge (+Rs. 50/venue bonus)
      'weekly_streak',         // 7-day power streak (Rs. 1,000 fixed bonus)
      'monthly_champion',      // 30-day champion (Rs. 5,000 fixed bonus)
      'booking_revenue_share', // 25% of RentalMeet profit for 12 months
      'monthly_award',         // Star Performer awards (Rs. 25k, Rs. 15k, Rs. 10k)
      'referral_bonus'         // Referral bonus
    ],
    required: true,
    index: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  levelAtReward: {
    type: String,
    enum: ['LV.1', 'LV.2', 'LV.3', 'LV.4']
  },
  profitShareDetails: {
    bookingAmount: Number,
    platformProfit: Number,
    profitSharePercentage: { type: Number, default: 25 },
    calculatedShare: Number
  },
  status: {
    type: String,
    enum: ['credited', 'withdrawn', 'cancelled'],
    default: 'credited'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AmbassadorReward', ambassadorRewardSchema);
