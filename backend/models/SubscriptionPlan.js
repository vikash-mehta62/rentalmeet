const mongoose = require('mongoose');
const PlatformSettings = require('./PlatformSettings');
const { SUBSCRIPTION_PLANS } = require('../config/subscriptionPlans');

function getDefaults() {
  return [
    {
      planId: 'starter',
      name: 'Free Forever',
      badge: 'Starter',
      subtitle: 'For new venue owners',
      description: 'For new venue owners starting out on RentalMeet',
      regularMonthlyPrice: 0,
      price: 0,
      offerPrice: 0,
      regularAnnualPrice: 0,
      annualPrice: 0,
      annualOfferPrice: 0,
      perVenueMonthlyPrice: 90,
      minVenues: 8,
      interval: 'free',
      durationDays: 3650,
      billingCycle: 'free',
      limits: {
        maxVenues: 1,
        photosPerVenue: 5,
        videosPerVenue: 3,
        monthlyOnlineBookings: 3,
        monthlyOfflineBookings: 3,
        crm: 'Basic',
        dashboard: 'Basic',
        searchVisibility: 'Standard'
      },
      features: [
        '1 Venue listing',
        '5 Photographs per venue',
        '3 Venue videos per venue',
        '3 Online bookings / month',
        '3 Offline bookings / month',
        'Basic CRM & Dashboard',
        'Standard Search visibility',
        'Complimentary Email notifications'
      ],
      isActive: true,
      isHighlighted: false,
      displayOrder: 1,
      _id: '674000000000000000000001'
    },
    {
      planId: 'pro',
      name: 'Pro Plan',
      badge: 'Recommended',
      subtitle: 'For growing venue businesses',
      description: 'For growing venue businesses seeking max bookings and reach',
      regularMonthlyPrice: 499,
      price: 299,
      offerPrice: 299,
      regularAnnualPrice: 5988,
      annualPrice: 2999,
      annualOfferPrice: 2999,
      perVenueMonthlyPrice: 90,
      minVenues: 8,
      interval: 'month',
      durationDays: 30,
      billingCycle: 'monthly',
      limits: {
        maxVenues: 3,
        photosPerVenue: 15,
        videosPerVenue: 10,
        monthlyOnlineBookings: 9999,
        monthlyOfflineBookings: 9999,
        crm: 'Advanced',
        dashboard: 'Advanced',
        searchVisibility: 'Top Priority'
      },
      features: [
        'Up to 3 Venue listings',
        '15 Photographs per venue',
        '10 Venue videos / reels per venue',
        'Unlimited Online bookings',
        'Unlimited Offline bookings',
        'Advanced CRM & Analytics Dashboard',
        'Top Priority Search ranking',
        'Priority Phone & WhatsApp Support',
        'Coupons & Promotional Badges',
        'Direct WhatsApp Inquiry Routing'
      ],
      isActive: true,
      isHighlighted: true,
      displayOrder: 2,
      _id: '674000000000000000000002'
    },
    {
      planId: 'business',
      name: 'Business Premium Plan',
      badge: 'Business Premium',
      subtitle: 'For professional venue operators and multi-property chains',
      description: 'For professional venue operators and multi-property businesses',
      regularMonthlyPrice: 1199,
      price: 699,
      offerPrice: 699,
      regularAnnualPrice: 13972,
      annualPrice: 6999,
      annualOfferPrice: 6999,
      perVenueMonthlyPrice: 90,
      minVenues: 8,
      interval: 'year',
      durationDays: 365,
      billingCycle: 'annual',
      limits: {
        maxVenues: 10,
        photosPerVenue: 50,
        videosPerVenue: 30,
        monthlyOnlineBookings: 99999,
        monthlyOfflineBookings: 99999,
        crm: 'Enterprise',
        dashboard: 'Enterprise',
        searchVisibility: 'Featured Placement'
      },
      features: [
        'Up to 10 Venue listings',
        '50 Photographs per venue',
        '30 Venue videos / reels per venue',
        'Unlimited Online & Offline bookings',
        'Enterprise Multi-User CRM',
        'Featured Home Page Placement',
        'Dedicated Account Manager',
        'SMS & WhatsApp Notification Integrations',
        'Custom Invoicing & GST Reports',
        'Zero Transaction Surcharge'
      ],
      isActive: true,
      isHighlighted: false,
      displayOrder: 3,
      _id: '674000000000000000000003'
    },
    {
      planId: 'custom',
      name: 'Custom Plan',
      badge: 'Enterprise',
      subtitle: 'For professional venue operators and multi-property businesses (Min 8 venues)',
      description: 'Custom pricing calculator deployed for large venue portfolios with 8+ venues',
      regularMonthlyPrice: 720,
      price: 720,
      offerPrice: 720,
      regularAnnualPrice: 8640,
      annualPrice: 8640,
      annualOfferPrice: 8640,
      perVenueMonthlyPrice: 90,
      minVenues: 8,
      interval: 'custom',
      durationDays: 30,
      billingCycle: 'monthly',
      limits: {
        maxVenues: 999,
        photosPerVenue: 100,
        videosPerVenue: 50,
        monthlyOnlineBookings: 999999,
        monthlyOfflineBookings: 999999,
        crm: 'Dedicated Instance',
        dashboard: 'Custom API',
        searchVisibility: 'Super Priority'
      },
      features: [
        'Custom Venue quota (8+ Venues)',
        '100 Photos & 50 Videos per venue',
        'Unlimited Bookings & Inquiries',
        'Dedicated Relationship Manager',
        'Custom API Access & Webhooks',
        'Volume Discounting (₹90 / venue / month)'
      ],
      isActive: true,
      isHighlighted: false,
      displayOrder: 4,
      _id: '674000000000000000000004'
    }
  ];
}

class SubscriptionPlanAdapter {
  static async _getPlans() {
    const settings = await PlatformSettings.getSettings();
    if (!settings.subscriptionPlans || settings.subscriptionPlans.length === 0) {
      const defs = getDefaults();
      settings.subscriptionPlans = defs;
      await settings.save();
      return defs;
    }
    return settings.subscriptionPlans;
  }

  static async _savePlans(plans) {
    const settings = await PlatformSettings.getSettings();
    settings.subscriptionPlans = plans;
    settings.markModified('subscriptionPlans');
    await settings.save();
    return plans;
  }

  static async countDocuments() {
    const plans = await this._getPlans();
    return plans.length;
  }

  static async seedDefaultsIfEmpty(force = false) {
    const settings = await PlatformSettings.getSettings();
    if (force || !settings.subscriptionPlans || settings.subscriptionPlans.length === 0) {
      const defs = getDefaults();
      settings.subscriptionPlans = defs;
      settings.markModified('subscriptionPlans');
      await settings.save();
      return defs;
    }
    return settings.subscriptionPlans;
  }

  static find(filter = {}) {
    const promise = (async () => {
      let plans = await this._getPlans();
      if (filter && typeof filter === 'object') {
        if (filter.isActive !== undefined) {
          plans = plans.filter(p => (p.isActive !== undefined ? p.isActive === filter.isActive : filter.isActive === true));
        }
        if (filter.planId) {
          plans = plans.filter(p => p.planId === filter.planId);
        }
      }
      return plans;
    })();

    promise.sort = function (sortField) {
      return (async () => {
        const plans = await promise;
        if (sortField === 'displayOrder') {
          return [...plans].sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
        }
        return plans;
      })();
    };

    return promise;
  }

  static async findOne(filter = {}) {
    const plans = await this._getPlans();
    if (filter.planId) {
      return plans.find(p => p.planId === filter.planId) || null;
    }
    if (filter._id) {
      return plans.find(p => String(p._id) === String(filter._id)) || null;
    }
    return plans[0] || null;
  }

  static async findById(id) {
    const plans = await this._getPlans();
    return plans.find(p => String(p._id) === String(id) || p.planId === String(id)) || null;
  }

  static async create(planData) {
    const plans = await this._getPlans();
    const newDoc = {
      ...planData,
      _id: planData._id || new mongoose.Types.ObjectId().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    plans.push(newDoc);
    await this._savePlans(plans);
    return newDoc;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    const plans = await this._getPlans();
    const idx = plans.findIndex(p => String(p._id) === String(id) || p.planId === String(id));
    if (idx === -1) return null;

    const existing = plans[idx];
    const updateData = update.$set ? update.$set : update;
    const updatedDoc = {
      ...existing,
      ...updateData,
      updatedAt: new Date()
    };
    plans[idx] = updatedDoc;
    await this._savePlans(plans);
    return updatedDoc;
  }

  static async findByIdAndDelete(id) {
    const plans = await this._getPlans();
    const idx = plans.findIndex(p => String(p._id) === String(id) || p.planId === String(id));
    if (idx === -1) return null;
    const removed = plans.splice(idx, 1)[0];
    await this._savePlans(plans);
    return removed;
  }
}

module.exports = SubscriptionPlanAdapter;
