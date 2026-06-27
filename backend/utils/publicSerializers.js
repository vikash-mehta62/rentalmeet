const {
  getVenueGSTConfig,
  getVenuePlatformFeeConfig,
  normalizeCustomPlatformFee,
  numberOr
} = require('./venuePricing');

const toPlain = (value) => {
  if (!value) return {};
  if (typeof value.toObject === 'function') {
    return value.toObject({ virtuals: false, versionKey: false });
  }
  return value;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const pick = (source, fields) => {
  const value = toPlain(source);
  const out = {};
  fields.forEach((field) => {
    if (value[field] !== undefined) out[field] = value[field];
  });
  return out;
};

const toId = (value) => {
  if (!value) return undefined;
  const plain = toPlain(value);
  return String(plain._id || value);
};

const serializeVenuePublic = (venue, options = {}) => {
  const value = toPlain(venue);
  const settings = options.platformSettings ? toPlain(options.platformSettings) : null;

  const venueGST = getVenueGSTConfig(value, settings);
  const platformFee = getVenuePlatformFeeConfig(value, settings);
  const customPlatformFee = normalizeCustomPlatformFee(value.customPlatformFee, settings);

  const publicVenue = {
    _id: toId(value),
    sku: value.sku,
    businessName: value.businessName,
    venueType: asArray(value.venueType),
    foodType: value.foodType,
    description: value.description,
    capacity: value.capacity,
    areaSqft: value.areaSqft,
    location: pick(value.location, [
      'address',
      'landmark',
      'state',
      'city',
      'village',
      'area',
      'pincode',
      'googleMapLink',
      'parkingAvailability',
      'nearestBusAuto',
      'nearestMetroTrain'
    ]),
    amenities: {
      basic: asArray(value.amenities?.basic).map((item) => pick(item, [
        'name',
        'available',
        'type',
        'rate',
        'rateType',
        'maxQuantity'
      ])),
      beverages: asArray(value.amenities?.beverages).map((item) => pick(item, [
        'name',
        'available',
        'ratePerUnit',
        'brand'
      ])),
      refreshmentFood: asArray(value.amenities?.refreshmentFood).map((item) => pick(item, [
        'name',
        'available',
        'ratePerPlate',
        'items'
      ])),
      lunchThalis: asArray(value.amenities?.lunchThalis).map((thali) => ({
        thaliType: thali.thaliType,
        available: thali.available,
        categories: asArray(thali.categories).map((category) => pick(category, [
          'category',
          'ratePerPlate',
          'numberOfItems',
          'itemNames'
        ]))
      })),
      kitchenAccess: pick(value.amenities?.kitchenAccess, ['available', 'type', 'charges']),
      diningArea: pick(value.amenities?.diningArea, ['available', 'type', 'charges']),
      additional: asArray(value.amenities?.additional).map((item) => pick(item, [
        'name',
        'available',
        'type',
        'charges'
      ]))
    },
    pricing: {
      enabledOptions: pick(value.pricing?.enabledOptions, ['perHour', 'halfDay', 'fullDay']),
      perHour: pick(value.pricing?.perHour, ['weekday', 'weekend']),
      halfDay: pick(value.pricing?.halfDay, ['weekday', 'weekend']),
      fullDay: pick(value.pricing?.fullDay, ['weekday', 'weekend']),
      extraHourRate: pick(value.pricing?.extraHourRate, ['weekday', 'weekend'])
    },
    publicPricingMeta: {
      venueHasGST: Boolean(value.ownerInfo?.hasGST || value.customGST?.enabled || settings?.venueCGST || settings?.venueSGST),
      venueCGSTRate: venueGST.cgstRate,
      venueSGSTRate: venueGST.sgstRate,
      venueGSTRate: venueGST.totalRate,
      venueHSN: venueGST.hsnCode,
      platformFeeSource: platformFee.source,
      platformFeeType: platformFee.type,
      platformFeeValue: platformFee.value,
      platformFeePercentage: platformFee.type === 'percentage' ? platformFee.value : 0,
      platformCGSTRate: platformFee.cgstRate,
      platformSGSTRate: platformFee.sgstRate
    },
    customPlatformFee: customPlatformFee.enabled ? customPlatformFee : undefined,
    availability: pick(value.availability, [
      'openingTime',
      'closingTime',
      'availableDays',
      'advanceBookingRule'
    ]),
    images: asArray(value.images).map((image) => pick(image, ['url', 'category', 'isFeatured'])),
    rating: value.rating || 0,
    reviewCount: value.reviewCount || 0
  };

  if (options.activeCoupons) {
    publicVenue.activeCoupons = options.activeCoupons;
    publicVenue.activeCouponCount = options.activeCoupons.length;
  }

  return publicVenue;
};

const serializeVendorPublic = (vendor) => {
  const value = toPlain(vendor);
  if (!value || !value._id) return undefined;
  return pick(value, ['_id', 'name', 'companyName', 'vendorCategory', 'city', 'state']);
};

const serializeVendorServicePublic = (service) => {
  const value = toPlain(service);

  return {
    _id: toId(value),
    vendor: serializeVendorPublic(value.vendor),
    title: value.title,
    slug: value.slug,
    category: value.category,
    companyName: value.companyName,
    brandName: value.brandName,
    experienceYears: value.experienceYears,
    description: value.description,
    specialization: asArray(value.specialization),
    tags: asArray(value.tags),
    state: value.state,
    city: value.city,
    serviceableAreas: asArray(value.serviceableAreas),
    website: value.website,
    instagram: value.instagram,
    facebook: value.facebook,
    startingPrice: value.startingPrice,
    minimumOrderPrice: value.minimumOrderPrice,
    packages: asArray(value.packages).map((pkg) => pick(pkg, [
      'sno',
      'name',
      'price',
      'unit',
      'minQty',
      'maxQty'
    ])),
    featuredImage: value.featuredImage,
    images: asArray(value.images),
    availability: asArray(value.availability).map((item) => pick(item, [
      'day',
      'isAvailable',
      'startTime',
      'endTime'
    ])),
    advanceBooking: value.advanceBooking,
    customAdvanceDays: value.customAdvanceDays,
    blockedDates: asArray(value.blockedDates).map((item) => pick(item, ['date'])),
    isBookable: value.isActive !== false
  };
};

module.exports = {
  serializeVenuePublic,
  serializeVendorServicePublic
};
