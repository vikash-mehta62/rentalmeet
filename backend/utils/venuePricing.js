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

const positiveOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

const calculateBasePrice = ({ venue, bookingType, bookingDate, durationHours, pricingModel, perPaxPackage, guestCount }) => {
  const value = toPlain(venue);
  const dayType = isWeekendDate(bookingDate) ? 'weekend' : 'weekday';
  const pricing = value.pricing || {};

  // Normalize model key
  const modelKey = String(pricingModel || '').toLowerCase().replace(/[\s_()\-]+/g, '');

  // 1. Per Pax Model Calculation
  if (modelKey === 'perpax' || bookingType === 'per_pax' || bookingType === 'perpax') {
    const perPaxConfig = pricing.perPax || {};
    const pkg = perPaxPackage || 'withoutFood';
    const pkgConfig = perPaxConfig[pkg] || perPaxConfig.withoutFood || {};
    const rate = positiveOr(pkgConfig.rate, 0);
    const minPax = numberOr(pkgConfig.minPax, 1);
    const guests = Math.max(numberOr(guestCount, 1), minPax);
    if (rate > 0) {
      return roundMoney(rate * guests);
    }
  }

  // 2. Rent with Amenities Model Calculation
  if (modelKey === 'rentwithamenities' || modelKey === 'rentincludedamenities' || modelKey.includes('amenities')) {
    const rentAmenities = pricing.rentWithAmenities || {};
    if (bookingType === 'hourly') {
      const rate = positiveOr(rentAmenities.hourly?.rate, pricing.perHour?.[dayType]);
      if (rate > 0) return roundMoney(rate * numberOr(durationHours, 1));
    }
    if (bookingType === 'halfday') {
      const base = positiveOr(rentAmenities.halfDay?.rate, pricing.halfDay?.[dayType]);
      if (base > 0) {
        const extraHours = Math.max(0, numberOr(durationHours, 6) - 6);
        const extraRate = positiveOr(rentAmenities.halfDay?.extraPerHour, positiveOr(rentAmenities.hourly?.extraPerHour, pricing.extraHourRate?.[dayType] || 0));
        return roundMoney(base + (extraHours * extraRate));
      }
    }
    if (bookingType === 'fullday') {
      const base = positiveOr(rentAmenities.fullDay?.rate, pricing.fullDay?.[dayType]);
      if (base > 0) {
        const extraHours = Math.max(0, numberOr(durationHours, 12) - 12);
        const extraRate = positiveOr(rentAmenities.fullDay?.extraPerHour, positiveOr(rentAmenities.hourly?.extraPerHour, pricing.extraHourRate?.[dayType] || 0));
        return roundMoney(base + (extraHours * extraRate));
      }
    }
  }

  // 3. Only Rent Model Calculation
  if (modelKey === 'onlyrent' || (!modelKey && pricing.onlyRent?.hourly?.rate)) {
    const onlyRent = pricing.onlyRent || {};
    if (bookingType === 'hourly') {
      const rate = positiveOr(onlyRent.hourly?.rate, pricing.perHour?.[dayType]);
      if (rate > 0) return roundMoney(rate * numberOr(durationHours, 1));
    }
    if (bookingType === 'halfday') {
      const base = positiveOr(onlyRent.halfDay?.rate, pricing.halfDay?.[dayType]);
      if (base > 0) {
        const extraHours = Math.max(0, numberOr(durationHours, 6) - 6);
        const extraRate = positiveOr(onlyRent.halfDay?.extraPerHour, positiveOr(onlyRent.hourly?.extraPerHour, pricing.extraHourRate?.[dayType] || 0));
        return roundMoney(base + (extraHours * extraRate));
      }
    }
    if (bookingType === 'fullday') {
      const base = positiveOr(onlyRent.fullDay?.rate, pricing.fullDay?.[dayType]);
      if (base > 0) {
        const extraHours = Math.max(0, numberOr(durationHours, 12) - 12);
        const extraRate = positiveOr(onlyRent.fullDay?.extraPerHour, positiveOr(onlyRent.hourly?.extraPerHour, pricing.extraHourRate?.[dayType] || 0));
        return roundMoney(base + (extraHours * extraRate));
      }
    }
  }

  // 4. Standard Hourly / Half Day / Full Day fallback
  if (bookingType === 'hourly') {
    const rate = positiveOr(pricing.perHour?.[dayType], positiveOr(pricing.rentWithAmenities?.hourly?.rate, pricing.onlyRent?.hourly?.rate || 0));
    return roundMoney(rate * numberOr(durationHours, 1));
  }
  if (bookingType === 'halfday') {
    const base = positiveOr(pricing.halfDay?.[dayType], positiveOr(pricing.rentWithAmenities?.halfDay?.rate, pricing.onlyRent?.halfDay?.rate || 0));
    if (base > 0) {
      const extraHours = Math.max(0, numberOr(durationHours, 4) - 4);
      const extraRate = positiveOr(pricing.extraHourRate?.[dayType], 0);
      return roundMoney(base + (extraHours * extraRate));
    }
  }
  if (bookingType === 'fullday') {
    const base = positiveOr(pricing.fullDay?.[dayType], positiveOr(pricing.rentWithAmenities?.fullDay?.rate, pricing.onlyRent?.fullDay?.rate || 0));
    if (base > 0) {
      const extraHours = Math.max(0, numberOr(durationHours, 8) - 8);
      const extraRate = positiveOr(pricing.extraHourRate?.[dayType], 0);
      return roundMoney(base + (extraHours * extraRate));
    }
  }

  // 5. Fallback to hourly if halfday/fullday not set
  const perHourRate = positiveOr(pricing.perHour?.[dayType], positiveOr(pricing.rentWithAmenities?.hourly?.rate, pricing.onlyRent?.hourly?.rate || 0));
  if (perHourRate > 0) {
    const hours = numberOr(durationHours, bookingType === 'fullday' ? 8 : bookingType === 'halfday' ? 4 : 1);
    return roundMoney(perHourRate * hours);
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

  // Parking charges
  if (amenities.parking) {
    const cars = numberOr(amenities.parking.cars, 0);
    const twoWheelers = numberOr(amenities.parking.twoWheelers, 0);
    const carRate = numberOr(value.parkingDetails?.cars?.chargePerVehicle, 0);
    const twRate = numberOr(value.parkingDetails?.twoWheelers?.chargePerVehicle, 0);
    if (cars > 0 && (value.parkingDetails?.cars?.isChargeable || value.parkingDetails?.type === 'Paid')) {
      total += cars * carRate;
    }
    if (twoWheelers > 0 && (value.parkingDetails?.twoWheelers?.isChargeable || value.parkingDetails?.type === 'Paid')) {
      total += twoWheelers * twRate;
    }
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
  venueGSTConfig: venueGSTConfigOverride,
  pricingModel,
  perPaxPackage,
  guestCount
}) => {
  const durationHours = getDurationHours({
    bookingType,
    startTime,
    endTime,
    fallback: explicitDurationHours
  });
  const basePrice = basePriceOverride !== undefined
    ? roundMoney(basePriceOverride)
    : calculateBasePrice({ venue, bookingType, bookingDate, durationHours, pricingModel, perPaxPackage, guestCount });
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
    pricingModel: pricingModel || null,
    perPaxPackage: perPaxPackage || null,
    guestCount: guestCount || null,
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

const isOnlineBookingOpen = (availability) => {
  if (!availability) return true;

  const schedule = availability.onlineBookingSchedule?.enabled !== false && availability.onlineBookingSchedule?.openingTime
    ? availability.onlineBookingSchedule
    : {
        openingTime: availability.openingTime || '06:00',
        closingTime: availability.closingTime || '02:00'
      };

  const opening = schedule.openingTime || '06:00';
  const closing = schedule.closingTime || '02:00';

  const [openH, openM] = opening.split(':').map(Number);
  const [closeH, closeM] = closing.split(':').map(Number);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + (openM || 0);
  const closeMinutes = closeH * 60 + (closeM || 0);

  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  } else {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }
};

const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${period}`;
};

module.exports = {
  numberOr,
  positiveOr,
  roundMoney,
  normalizeCustomPlatformFee,
  normalizeCustomGST,
  getVenuePlatformFeeConfig,
  calculatePlatformFeeAmount,
  getVenueGSTConfig,
  getDurationHours,
  calculateVenueBookingPrice,
  calculateVenueOwnerPayout,
  isOnlineBookingOpen,
  formatTime12Hour
};
