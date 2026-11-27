// Configuration of RentalMeet Subscription Plans
// Strictly derived from: "Revised Subscription Plan-20.11.26.xlsx"

const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'starter',
    name: 'Free Forever',
    badge: 'Starter',
    subtitle: 'For new venue owners',
    price: 0,
    offerPrice: 0,
    annualPrice: 0,
    annualOfferPrice: 0,
    regularMonthlyPrice: 0,
    regularAnnualPrice: 0,
    interval: 'month',
    billingCycle: 'free',
    description: 'For new venue owners starting out on RentalMeet',
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
      'Complete venue details',
      'Basic facilities and amenities',
      'Revenue and booking analytics',
      'Offers and discount management',
      'Multiple pricing models'
    ]
  },

  pro: {
    id: 'pro',
    name: 'Pro Plan',
    badge: 'Recommended',
    subtitle: 'For growing venue businesses',
    regularMonthlyPrice: 499,
    price: 299, // Offer price monthly
    offerPrice: 299,
    regularAnnualPrice: 5988,
    annualPrice: 2999, // Offer price annual
    annualOfferPrice: 2999,
    interval: 'month',
    durationDays: 30,
    billingCycle: 'monthly',
    description: 'For growing venue businesses seeking max bookings and reach',
    limits: {
      maxVenues: 3,
      photosPerVenue: 20,
      videosPerVenue: 10,
      monthlyOnlineBookings: Infinity,
      monthlyOfflineBookings: Infinity,
      crm: 'Advanced',
      dashboard: 'Advanced',
      searchVisibility: 'Priority'
    },
    features: [
      'Up to 3 Venue listings',
      '20 Photographs per venue',
      '10 Venue videos per venue',
      'Unlimited Online bookings',
      'Unlimited Offline bookings',
      'Advanced CRM & Dashboard',
      'Priority Search visibility',
      'Complete facilities and amenities',
      'Featured venue badge',
      'Advanced booking calendar',
      'Customer database / CRM',
      'Revenue and booking analytics',
      'Offers and discount management',
      'Multiple pricing models',
      'Priority customer support'
    ]
  },

  business: {
    id: 'business',
    name: 'Business Premium Plan',
    badge: 'Business Premium',
    subtitle: 'For professional venue operators and multi-property businesses',
    regularMonthlyPrice: 1199,
    price: 699, // Offer price monthly
    offerPrice: 699,
    regularAnnualPrice: 13972,
    annualPrice: 6999, // Offer price annual
    annualOfferPrice: 6999,
    interval: 'year',
    durationDays: 365,
    billingCycle: 'annual',
    description: 'For professional venue operators and multi-property chains',
    limits: {
      maxVenues: 7,
      photosPerVenue: 30,
      videosPerVenue: 30,
      monthlyOnlineBookings: Infinity,
      monthlyOfflineBookings: Infinity,
      crm: 'Advanced',
      dashboard: 'Advanced',
      searchVisibility: 'Priority'
    },
    features: [
      'Up to 7 Venue listings',
      '30 Photographs per venue',
      '30 Venue videos per venue',
      'Unlimited Online bookings',
      'Unlimited Offline bookings',
      'Advanced CRM & Dashboard',
      'Priority Search visibility',
      'Featured venue badge',
      'Advanced booking calendar',
      'Customer database / CRM',
      'Revenue and booking analytics',
      'Offers and discount management',
      'Multiple pricing models',
      'Role-based dashboard access',
      'Advanced CRM',
      'Detailed revenue reports',
      'Lead management system',
      'Dedicated account manager',
      'Featured promotional opportunities',
      'Priority customer support',
      'Priority technical support'
    ]
  },

  custom: {
    id: 'custom',
    name: 'Custom Plan',
    badge: 'Enterprise',
    subtitle: 'For professional venue operators and multi-property businesses (Min 8 venues)',
    perVenueMonthlyPrice: 90,
    minVenues: 8,
    interval: 'custom',
    description: 'Custom pricing calculator deployed for large venue portfolios with 8+ venues',
    limits: {
      maxVenues: 8, // Minimum 8 venues, expandable via calculator
      photosPerVenue: 30,
      videosPerVenue: 30,
      monthlyOnlineBookings: Infinity,
      monthlyOfflineBookings: Infinity,
      crm: 'Advanced',
      dashboard: 'Advanced',
      searchVisibility: 'Priority'
    },
    features: [
      'Calculator Deploy: ₹90/month per venue (Minimum 8 venues)',
      '30 Photographs per venue',
      '30 Venue videos per venue',
      'Unlimited Online bookings',
      'Unlimited Offline bookings',
      'Advanced CRM & Dashboard',
      'Priority Search visibility',
      'Featured venue badge',
      'Advanced booking calendar',
      'Customer database / CRM',
      'Revenue and booking analytics',
      'Offers and discount management',
      'Multiple pricing models',
      'Role-based dashboard access',
      'Advanced CRM',
      'Detailed revenue reports',
      'Lead management system',
      'Dedicated account manager',
      'Featured promotional opportunities',
      'Priority customer support',
      'Priority technical support'
    ]
  }
};

module.exports = {
  SUBSCRIPTION_PLANS
};
