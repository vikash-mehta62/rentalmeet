const toPlain = (value) => {
  if (!value) return {};
  if (typeof value.toObject === 'function') {
    return value.toObject({ virtuals: false, versionKey: false });
  }
  return value;
};

const numberOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value) => Math.round(numberOr(value, 0) * 100) / 100;

const getDateDayIndex = (date) => {
  if (!date) return null;
  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date.getDay();
  }

  const text = String(date).trim();
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay();
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getDay();
};

const isWeekendDate = (date) => {
  const day = getDateDayIndex(date);
  return day === 0 || day === 6;
};

const normalizeFeeType = (value) => (value === 'fixed' ? 'fixed' : 'percentage');

const normalizeCustomPlatformFee = (customPlatformFee = {}, settings = {}) => {
  const custom = toPlain(customPlatformFee);
  const platformSettings = toPlain(settings);
  const feeType = normalizeFeeType(custom.feeType);
  const feeValue = numberOr(
    custom.feeValue !== undefined ? custom.feeValue : custom.percentage,
    feeType === 'percentage' ? 5 : 0
  );
  const platformCGSTRate = numberOr(
    custom.platformCGSTRate ?? custom.cgstRate,
    numberOr(platformSettings.platformCGST, 9)
  );
  const platformSGSTRate = numberOr(
    custom.platformSGSTRate ?? custom.sgstRate,
    numberOr(platformSettings.platformSGST, 9)
  );

  return {
    enabled: Boolean(custom.enabled),
    feeType,
    feeValue,
    platformCGSTRate,
    platformSGSTRate,
    percentage: feeType === 'percentage' ? feeValue : 0
  };
};

const normalizeCustomGST = (customGST = {}, settings = {}) => {
  const custom = toPlain(customGST);
  const platformSettings = toPlain(settings);
  const legacyRate = numberOr(custom.rate, 18);
  const hasSplitRates = custom.cgstRate !== undefined || custom.sgstRate !== undefined;
  const cgstRate = hasSplitRates
    ? numberOr(custom.cgstRate, 0)
    : legacyRate / 2;
  const sgstRate = hasSplitRates
    ? numberOr(custom.sgstRate, 0)
    : legacyRate / 2;
  const hsnCode = custom.hsnCode || platformSettings.venueHSN || '9973';

  return {
    enabled: Boolean(custom.enabled),
    rate: numberOr(custom.rate, cgstRate + sgstRate),
    cgstRate,
    sgstRate,
    hsnCode
  };
};

const getVenuePlatformFeeConfig = (venue, settings) => {
  const value = toPlain(venue);
  const platformSettings = toPlain(settings);
  const custom = normalizeCustomPlatformFee(value.customPlatformFee, platformSettings);

  if (custom.enabled) {
    return {
      source: 'venue',
      type: custom.feeType,
      value: custom.feeValue,
      cgstRate: custom.platformCGSTRate,
      sgstRate: custom.platformSGSTRate
    };
  }

  const type = normalizeFeeType(platformSettings.platformFeeType);
  const fallbackValue = platformSettings.platformFeeValue !== undefined
    ? platformSettings.platformFeeValue
    : platformSettings.platformFeePercentage;

  return {
    source: 'global',
    type,
    value: numberOr(fallbackValue, 5),
    cgstRate: numberOr(platformSettings.platformCGST, 9),
    sgstRate: numberOr(platformSettings.platformSGST, 9)
  };
};

const calculatePlatformFeeAmount = (subtotal, feeConfig) => {
  const config = feeConfig || { type: 'percentage', value: 0 };
  if (config.type === 'fixed') return roundMoney(config.value);
  return roundMoney((numberOr(subtotal, 0) * numberOr(config.value, 0)) / 100);
};

const getVenueGSTConfig = (venue, settings) => {
  const value = toPlain(venue);
  const platformSettings = toPlain(settings);

  if (value.customGST?.enabled) {
    const custom = normalizeCustomGST(value.customGST, platformSettings);
    return {
      cgstRate: custom.cgstRate,
      sgstRate: custom.sgstRate,
      totalRate: custom.cgstRate + custom.sgstRate,
      hsnCode: custom.hsnCode
    };
  }

  const cgstRate = numberOr(platformSettings.venueCGST, 9);
  const sgstRate = numberOr(platformSettings.venueSGST, 9);
  return { cgstRate, sgstRate, totalRate: cgstRate + sgstRate, hsnCode: platformSettings.venueHSN || '9973' };
};

const parseTimeToMinutes = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const getDurationHours = ({ bookingType, startTime, endTime, fallback }) => {
  const fallbackHours = numberOr(fallback, 0);
  if (bookingType === 'halfday') return fallbackHours || 4;
  if (bookingType === 'fullday') return fallbackHours || 8;

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes !== null && endMinutes !== null) {
    let diff = endMinutes - startMinutes;
    if (diff <= 0) diff += 24 * 60;
    return Math.max(1, roundMoney(diff / 60));
  }

  return fallbackHours || 1;
};

const calculateBasePrice = ({ venue, bookingType, bookingDate, durationHours }) => {
  const value = toPlain(venue);
  const dayType = isWeekendDate(bookingDate) ? 'weekend' : 'weekday';
  const pricing = value.pricing || {};

  if (bookingType === 'hourly') {
    return roundMoney(numberOr(pricing.perHour?.[dayType], 0) * numberOr(durationHours, 1));
  }
  if (bookingType === 'halfday') {
    return roundMoney(pricing.halfDay?.[dayType]);
  }
  if (bookingType === 'fullday') {
    return roundMoney(pricing.fullDay?.[dayType]);
  }
  return 0;
};

const calculateAmenitiesTotal = (selectedAmenities = {}, venue) => {
  const amenities = selectedAmenities || {};
  const value = toPlain(venue);
  let total = 0;

  (amenities.basic || []).forEach((item) => {
    if (item.type !== 'Paid') return;
    if (item.rateType === 'Per Use') total += numberOr(item.rate, 0) * numberOr(item.quantity, 0);
    else total += numberOr(item.rate, 0);
  });

  (amenities.beverages || []).forEach((item) => {
    total += numberOr(item.ratePerUnit, 0) * numberOr(item.quantity, 0);
  });

  (amenities.refreshmentFood || []).forEach((item) => {
    total += numberOr(item.ratePerPlate, 0) * numberOr(item.quantity, 0);
  });

  (amenities.lunchThalis || []).forEach((item) => {
    total += numberOr(item.ratePerPlate, 0) * numberOr(item.quantity, 0);
  });

  (amenities.additional || []).forEach((item) => {
    if (item.type === 'Paid') total += numberOr(item.charges, 0);
  });

  if (value.amenities?.kitchenAccess?.available && value.amenities.kitchenAccess.type === 'Paid') {
    total += numberOr(value.amenities.kitchenAccess.charges, 0);
  }

  if (value.amenities?.diningArea?.available && value.amenities.diningArea.type === 'Paid') {
    total += numberOr(value.amenities.diningArea.charges, 0);
  }

  return roundMoney(total);
};

const calculateVenueBookingPrice = ({
  venue,
  settings,
  bookingDate,
  startTime,
  endTime,
  bookingType,
  selectedAmenities,
  durationHours: explicitDurationHours,
  basePriceOverride,
  platformFeeConfig: platformFeeConfigOverride,
  venueGSTConfig: venueGSTConfigOverride
}) => {
  const durationHours = getDurationHours({
    bookingType,
    startTime,
    endTime,
    fallback: explicitDurationHours
  });
  const basePrice = basePriceOverride !== undefined
    ? roundMoney(basePriceOverride)
    : calculateBasePrice({ venue, bookingType, bookingDate, durationHours });
  const amenitiesTotal = calculateAmenitiesTotal(selectedAmenities, venue);
  const subtotal = roundMoney(basePrice + amenitiesTotal);
  const venueGSTConfig = venueGSTConfigOverride || getVenueGSTConfig(venue, settings);
  const venueCGST = roundMoney((subtotal * numberOr(venueGSTConfig.cgstRate, 0)) / 100);
  const venueSGST = roundMoney((subtotal * numberOr(venueGSTConfig.sgstRate, 0)) / 100);
  const gst = roundMoney(venueCGST + venueSGST);
  const platformFeeConfig = platformFeeConfigOverride || getVenuePlatformFeeConfig(venue, settings);
  const platformFee = calculatePlatformFeeAmount(subtotal, platformFeeConfig);
  const platformFeeCGSTRate = numberOr(platformFeeConfig.cgstRate, numberOr(toPlain(settings).platformCGST, 9));
  const platformFeeSGSTRate = numberOr(platformFeeConfig.sgstRate, numberOr(toPlain(settings).platformSGST, 9));
  const platformFeeCGST = roundMoney((platformFee * platformFeeCGSTRate) / 100);
  const platformFeeSGST = roundMoney((platformFee * platformFeeSGSTRate) / 100);
  const platformFeeGST = roundMoney(platformFeeCGST + platformFeeSGST);
  const platformFeeTotal = roundMoney(platformFee + platformFeeGST);
  const total = roundMoney(subtotal + gst + platformFeeTotal);

  return {
    basePrice,
    amenitiesTotal,
    subtotal,
    durationHours,
    venueCGST,
    venueCGSTRate: numberOr(venueGSTConfig.cgstRate, 0),
    venueSGST,
    venueSGSTRate: numberOr(venueGSTConfig.sgstRate, 0),
    venueHSN: venueGSTConfig.hsnCode || '9973',
    gst,
    gstRate: numberOr(venueGSTConfig.cgstRate, 0) + numberOr(venueGSTConfig.sgstRate, 0),
    platformFee,
    platformFeeSource: platformFeeConfig.source || 'snapshot',
    platformFeeType: platformFeeConfig.type,
    platformFeeValue: numberOr(platformFeeConfig.value, 0),
    platformFeeRate: numberOr(platformFeeConfig.value, 0),
    platformFeePercentage: platformFeeConfig.type === 'percentage' ? numberOr(platformFeeConfig.value, 0) : 0,
    platformFeeCGST,
    platformFeeCGSTRate,
    platformFeeSGST,
    platformFeeSGSTRate,
    platformFeeGST,
    platformFeeTotal,
    discount: 0,
    couponCode: null,
    total
  };
};

const calculateVenueOwnerPayout = (booking) => {
  const pb = booking?.priceBreakdown || {};
  const subtotal = numberOr(pb.subtotal, 0);
  const venueGst = numberOr(pb.gst, 0);
  const discount = numberOr(pb.discount ?? booking?.coupon?.discountAmount, 0);
  const discountAppliesTo = pb.discountAppliesTo || booking?.coupon?.appliesTo || 'total';
  const venueDiscount = discountAppliesTo === 'platformFee' ? 0 : discount;
  const platformDiscount = discountAppliesTo === 'platformFee' ? discount : 0;
  const platformTotal = numberOr(pb.platformFeeTotal, numberOr(pb.platformFee, 0) + numberOr(pb.platformFeeGST, 0));
  const paidAmount = numberOr(booking?.amount, subtotal + venueGst + platformTotal - discount);
  const platformDue = Math.max(0, platformTotal - platformDiscount);
  const venueShareAfterDiscount = Math.max(0, subtotal + venueGst - venueDiscount);
  const collectedAfterPlatform = Math.max(0, paidAmount - platformDue);

  return Math.round(Math.min(venueShareAfterDiscount, collectedAfterPlatform));
};

module.exports = {
  numberOr,
  roundMoney,
  normalizeCustomPlatformFee,
  normalizeCustomGST,
  getVenuePlatformFeeConfig,
  calculatePlatformFeeAmount,
  getVenueGSTConfig,
  getDurationHours,
  calculateVenueBookingPrice,
  calculateVenueOwnerPayout
};
