export const numberOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const roundMoney = (value) => Math.round(numberOr(value, 0) * 100) / 100;

export const normalizeFeeType = (value) => (value === 'fixed' ? 'fixed' : 'percentage');

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

export const isWeekendDate = (date) => {
  const day = getDateDayIndex(date);
  return day === 0 || day === 6;
};

export const getDateRateKey = (date) => (isWeekendDate(date) ? 'weekend' : 'weekday');

export const positiveOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const calculateProfileCompletion = (venue = {}) => {
  if (!venue) return 0;
  let score = 0;
  if (venue.businessName) score += 5;
  if (venue.venueType && (Array.isArray(venue.venueType) ? venue.venueType.length > 0 : Boolean(venue.venueType))) score += 5;
  if (venue.capacity) score += 5;
  if (venue.foodType) score += 5;

  if (venue.location?.address) score += 5;
  if (venue.location?.city) score += 5;
  if (venue.location?.pincode && venue.location.pincode !== '000000') score += 5;

  const p = venue.pricing || {};
  const hasPricing = (
    (Number(p.perHour?.weekday) > 0 || Number(p.perHour?.weekend) > 0) ||
    (Number(p.halfDay?.weekday) > 0 || Number(p.halfDay?.weekend) > 0) ||
    (Number(p.fullDay?.weekday) > 0 || Number(p.fullDay?.weekend) > 0) ||
    (Number(p.onlyRent?.hourly?.rate) > 0 || Number(p.onlyRent?.halfDay?.rate) > 0 || Number(p.onlyRent?.fullDay?.rate) > 0) ||
    (Number(p.rentWithAmenities?.hourly?.rate) > 0 || Number(p.rentWithAmenities?.halfDay?.rate) > 0 || Number(p.rentWithAmenities?.fullDay?.rate) > 0) ||
    (p.perPax && Object.values(p.perPax).some(pkg => Number(pkg?.rate) > 0))
  );
  if (hasPricing) score += 15;

  const imgCount = venue.images?.length || 0;
  if (imgCount >= 1) score += 5;
  if (imgCount >= 3) score += 5;
  if (imgCount >= 5) score += 5;

  if (venue.documents?.verified) {
    score += 35;
  } else {
    if (venue.bankDetails?.accountNumber || venue.bankDetails?.ifscCode) score += 10;
    if (venue.documents?.idProof?.number || venue.documents?.idProof?.frontUrl || venue.documents?.businessProof?.documentUrl) score += 10;
    if (venue.description && venue.description.length > 40) score += 5;
    if (venue.amenities?.basic?.some(a => a.available) || venue.additionalFacilities?.length > 0) score += 5;
    if (venue.cateringFacility?.available || venue.socialLinks?.website || venue.socialLinks?.instagram) score += 5;
  }

  return Math.min(100, Math.max(0, score));
};

export const isVenueVerified = (venue = {}) => {
  if (!venue) return false;
  if (venue.isVerified === true) return true;
  if (venue.documents?.verified === true) return true;
  if (typeof venue.profileCompletion === 'number' && venue.profileCompletion >= 70) return true;
  return calculateProfileCompletion(venue) >= 70;
};

export const getVenueDurationBasePrice = (venue = {}, duration, date, options = {}) => {
  const pricing = venue?.pricing || {};
  const dayType = getDateRateKey(date);
  const hours = Math.max(1, parseInt(duration, 10) || 1);
  const { pricingModel, perPaxPackage, guestCount } = options;

  const modelKey = String(pricingModel || '').toLowerCase().replace(/[\s_()\-]+/g, '');

  // 1. Per Pax Model Calculation
  if (modelKey === 'perpax' || pricingModel === 'Per Pax') {
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
  if (modelKey === 'rentwithamenities' || modelKey === 'rentincludedamenities' || modelKey.includes('amenities') || pricingModel === 'Rent (Included Amenities)') {
    const rentAmenities = pricing.rentWithAmenities || {};
    if (hours === 1 || hours === 2) {
      const rate = positiveOr(rentAmenities.hourly?.rate, pricing.perHour?.[dayType]);
      if (rate > 0) return roundMoney(rate * hours);
    }
    if (hours === 4 || hours === 6) {
      const base = positiveOr(rentAmenities.halfDay?.rate, pricing.halfDay?.[dayType]);
      if (base > 0) {
        const extraHours = Math.max(0, hours - 6);
        const extraRate = positiveOr(rentAmenities.halfDay?.extraPerHour, positiveOr(rentAmenities.hourly?.extraPerHour, pricing.extraHourRate?.[dayType] || 0));
        return roundMoney(base + (extraHours * extraRate));
      }
    }
    if (hours === 8 || hours === 12) {
      const base = positiveOr(rentAmenities.fullDay?.rate, pricing.fullDay?.[dayType]);
      if (base > 0) {
        const extraHours = Math.max(0, hours - 12);
        const extraRate = positiveOr(rentAmenities.fullDay?.extraPerHour, positiveOr(rentAmenities.hourly?.extraPerHour, pricing.extraHourRate?.[dayType] || 0));
        return roundMoney(base + (extraHours * extraRate));
      }
    }
  }

  // 3. Only Rent Model Calculation
  if (modelKey === 'onlyrent' || pricingModel === 'Only Rent' || (!modelKey && pricing.onlyRent?.hourly?.rate)) {
    const onlyRent = pricing.onlyRent || {};
    if (hours === 1 || hours === 2) {
      const rate = positiveOr(onlyRent.hourly?.rate, pricing.perHour?.[dayType]);
      if (rate > 0) return roundMoney(rate * hours);
    }
    if (hours === 4 || hours === 6) {
      const base = positiveOr(onlyRent.halfDay?.rate, pricing.halfDay?.[dayType]);
      if (base > 0) {
        const extraHours = Math.max(0, hours - 6);
        const extraRate = positiveOr(onlyRent.halfDay?.extraPerHour, positiveOr(onlyRent.hourly?.extraPerHour, pricing.extraHourRate?.[dayType] || 0));
        return roundMoney(base + (extraHours * extraRate));
      }
    }
    if (hours === 8 || hours === 12) {
      const base = positiveOr(onlyRent.fullDay?.rate, pricing.fullDay?.[dayType]);
      if (base > 0) {
        const extraHours = Math.max(0, hours - 12);
        const extraRate = positiveOr(onlyRent.fullDay?.extraPerHour, positiveOr(onlyRent.hourly?.extraPerHour, pricing.extraHourRate?.[dayType] || 0));
        return roundMoney(base + (extraHours * extraRate));
      }
    }
  }

  // 4. Standard Hourly / Half Day / Full Day fallback
  if (hours === 1 || hours === 2) {
    const rate = positiveOr(pricing.perHour?.[dayType], positiveOr(pricing.rentWithAmenities?.hourly?.rate, pricing.onlyRent?.hourly?.rate || 0));
    return roundMoney(rate * hours);
  }
  if (hours === 4 || hours === 6) {
    const base = positiveOr(pricing.halfDay?.[dayType], positiveOr(pricing.rentWithAmenities?.halfDay?.rate, pricing.onlyRent?.halfDay?.rate || 0));
    if (base > 0) {
      const extraHours = Math.max(0, hours - 4);
      const extraRate = positiveOr(pricing.extraHourRate?.[dayType], 0);
      return roundMoney(base + (extraHours * extraRate));
    }
  }
  if (hours === 8 || hours === 12) {
    const base = positiveOr(pricing.fullDay?.[dayType], positiveOr(pricing.rentWithAmenities?.fullDay?.rate, pricing.onlyRent?.fullDay?.rate || 0));
    if (base > 0) {
      const extraHours = Math.max(0, hours - 8);
      const extraRate = positiveOr(pricing.extraHourRate?.[dayType], 0);
      return roundMoney(base + (extraHours * extraRate));
    }
  }

  // 5. Proportional / General Hourly fallback for other durations
  const perHourRate = positiveOr(pricing.perHour?.[dayType], positiveOr(pricing.rentWithAmenities?.hourly?.rate, pricing.onlyRent?.hourly?.rate || 0));
  if (perHourRate > 0) {
    return roundMoney(perHourRate * hours);
  }

  return 0;
};

export const normalizeCustomPlatformFee = (custom = {}, settings = {}) => {
  const feeType = normalizeFeeType(custom?.feeType);
  const feeValue = numberOr(
    custom?.feeValue !== undefined ? custom.feeValue : custom?.percentage,
    feeType === 'percentage' ? 5 : 0
  );
  const platformCGSTRate = numberOr(
    custom?.platformCGSTRate ?? custom?.cgstRate,
    numberOr(settings?.platformCGST, 9)
  );
  const platformSGSTRate = numberOr(
    custom?.platformSGSTRate ?? custom?.sgstRate,
    numberOr(settings?.platformSGST, 9)
  );

  return {
    enabled: Boolean(custom?.enabled),
    feeType,
    feeValue,
    platformCGSTRate,
    platformSGSTRate,
    percentage: feeType === 'percentage' ? feeValue : numberOr(custom?.percentage, 0)
  };
};

export const normalizeCustomGST = (custom = {}, settings = {}) => {
  const hasSplitRates = custom?.cgstRate !== undefined || custom?.sgstRate !== undefined;
  const legacyRate = numberOr(custom?.rate, 18);
  const cgstRate = hasSplitRates ? numberOr(custom?.cgstRate, 0) : legacyRate / 2;
  const sgstRate = hasSplitRates ? numberOr(custom?.sgstRate, 0) : legacyRate / 2;
  const hsnCode = custom?.hsnCode || settings?.venueHSN || '9973';

  return {
    enabled: Boolean(custom?.enabled),
    rate: numberOr(custom?.rate, cgstRate + sgstRate),
    cgstRate,
    sgstRate,
    hsnCode
  };
};

export const getPlatformSettingsFee = (settings = {}) => {
  const feeType = normalizeFeeType(settings?.platformFeeType || settings?.platformFee?.feeType);
  const feeValue = numberOr(
    settings?.platformFeeValue !== undefined
      ? settings.platformFeeValue
      : (settings?.platformFee?.feeValue ?? settings?.platformFeePercentage),
    5
  );
  return { feeType, feeValue };
};

export const getVenuePricingMeta = (venue = {}, settings = {}) => {
  const meta = venue?.publicPricingMeta || {};
  const custom = normalizeCustomPlatformFee(venue?.customPlatformFee, settings);
  const globalFee = getPlatformSettingsFee(settings);

  const platformFeeType = normalizeFeeType(
    meta.platformFeeType || (custom.enabled ? custom.feeType : globalFee.feeType)
  );
  const platformFeeValue = numberOr(
    meta.platformFeeValue !== undefined
      ? meta.platformFeeValue
      : (custom.enabled ? custom.feeValue : globalFee.feeValue),
    platformFeeType === 'percentage' ? 5 : 0
  );

  const customGST = normalizeCustomGST(venue?.customGST, settings);
  const venueHasGST = meta.venueHasGST !== undefined
    ? Boolean(meta.venueHasGST)
    : Boolean(venue?.ownerInfo?.hasGST || customGST.enabled || settings?.venueCGST || settings?.venueSGST);
  const venueCGSTRate = venueHasGST
    ? numberOr(meta.venueCGSTRate, customGST.enabled ? customGST.cgstRate : numberOr(settings?.venueCGST, 9))
    : 0;
  const venueSGSTRate = venueHasGST
    ? numberOr(meta.venueSGSTRate, customGST.enabled ? customGST.sgstRate : numberOr(settings?.venueSGST, 9))
    : 0;

  return {
    venueHasGST,
    venueCGSTRate,
    venueSGSTRate,
    venueHSN: meta.venueHSN || (customGST.enabled ? customGST.hsnCode : (settings?.venueHSN || '9973')),
    platformFeeSource: meta.platformFeeSource || (custom.enabled ? 'venue' : 'global'),
    platformFeeType,
    platformFeeValue,
    platformFeePercentage: platformFeeType === 'percentage' ? platformFeeValue : 0,
    platformCGSTRate: numberOr(meta.platformCGSTRate, custom.enabled ? custom.platformCGSTRate : numberOr(settings?.platformCGST, 9)),
    platformSGSTRate: numberOr(meta.platformSGSTRate, custom.enabled ? custom.platformSGSTRate : numberOr(settings?.platformSGST, 9))
  };
};

export const calculatePlatformFee = (subtotal, feeType, feeValue) => {
  if (normalizeFeeType(feeType) === 'fixed') return roundMoney(feeValue);
  return roundMoney((numberOr(subtotal, 0) * numberOr(feeValue, 0)) / 100);
};

export const formatPlatformFeeLabel = (feeType, feeValue) => {
  const value = numberOr(feeValue, 0);
  return normalizeFeeType(feeType) === 'fixed'
    ? `Fixed Rs.${value.toLocaleString('en-IN')}`
    : `${value}%`;
};

/**
 * Checks if online bookings are currently open for a venue.
 * Handles normal daytime windows (e.g. 08:00 to 22:00) as well as
 * overnight windows (e.g. 06:00 to 02:00 next day).
 */
export const isOnlineBookingOpen = (availability) => {
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
    // Normal window, e.g., 08:00 (480) to 22:00 (1320)
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  } else {
    // Overnight window, e.g., 06:00 (360) to 02:00 next day (120)
    // Active if >= 06:00 OR <= 02:00
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }
};

/**
 * Calculates the minimum selectable booking date based on venue's advance booking rule.
 * Rules supported: "1 Day", "2 Days", ..., "6 Days", "1 Week", "2 Weeks", ..., "4 Weeks"
 */
export const getMinAdvanceBookingDate = (advanceRule) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);

  if (!advanceRule) {
    d.setDate(d.getDate() + 1);
    return d;
  }

  const text = String(advanceRule).toLowerCase().trim();
  let daysToAdd = 1;

  if (text.includes('week')) {
    const match = text.match(/\d+/);
    const weeks = match ? parseInt(match[0], 10) : 1;
    daysToAdd = weeks * 7;
  } else if (text.includes('day')) {
    const match = text.match(/\d+/);
    daysToAdd = match ? parseInt(match[0], 10) : 1;
  } else if (text.includes('48 hours')) {
    daysToAdd = 2;
  } else if (text.includes('24 hours')) {
    daysToAdd = 1;
  } else {
    daysToAdd = 1;
  }

  d.setDate(d.getDate() + daysToAdd);
  return d;
};

export const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${period}`;
};

/**
 * Calculates the accurate minimum starting price across all enabled models:
 * hourly, halfDay, fullDay, onlyRent, rentWithAmenities, and perPax.
 */
export const getVenueStartingPrice = (venue = {}) => {
  const p = venue?.pricing || {};
  const candidates = [];

  // 1. Standard Rates
  if (Number(p?.perHour?.weekday) > 0) candidates.push({ val: Number(p.perHour.weekday), label: '/hour' });
  if (Number(p?.perHour?.weekend) > 0) candidates.push({ val: Number(p.perHour.weekend), label: '/hour' });
  if (Number(p?.halfDay?.weekday) > 0) candidates.push({ val: Number(p.halfDay.weekday), label: '/half day' });
  if (Number(p?.halfDay?.weekend) > 0) candidates.push({ val: Number(p.halfDay.weekend), label: '/half day' });
  if (Number(p?.fullDay?.weekday) > 0) candidates.push({ val: Number(p.fullDay.weekday), label: '/full day' });
  if (Number(p?.fullDay?.weekend) > 0) candidates.push({ val: Number(p.fullDay.weekend), label: '/full day' });

  // 2. onlyRent model
  const onlyRent = p?.onlyRent || {};
  if (Number(onlyRent.hourly?.rate) > 0) candidates.push({ val: Number(onlyRent.hourly.rate), label: '/hour' });
  if (Number(onlyRent.halfDay?.rate) > 0) candidates.push({ val: Number(onlyRent.halfDay.rate), label: '/half day' });
  if (Number(onlyRent.fullDay?.rate) > 0) candidates.push({ val: Number(onlyRent.fullDay.rate), label: '/full day' });

  // 3. rentWithAmenities model
  const rentWithAmenities = p?.rentWithAmenities || {};
  if (Number(rentWithAmenities.hourly?.rate) > 0) candidates.push({ val: Number(rentWithAmenities.hourly.rate), label: '/hour' });
  if (Number(rentWithAmenities.halfDay?.rate) > 0) candidates.push({ val: Number(rentWithAmenities.halfDay.rate), label: '/half day' });
  if (Number(rentWithAmenities.fullDay?.rate) > 0) candidates.push({ val: Number(rentWithAmenities.fullDay.rate), label: '/full day' });

  // 4. perPax model
  const perPax = p?.perPax || {};
  Object.values(perPax).forEach((pkg) => {
    if (Number(pkg?.rate) > 0) {
      candidates.push({ val: Number(pkg.rate), label: '/pax' });
    }
  });

  if (candidates.length === 0) {
    return { amount: 0, label: '', formatted: '₹0' };
  }

  // Find lowest price candidate > 0
  const minCandidate = candidates.reduce((min, curr) => (curr.val < min.val ? curr : min), candidates[0]);
  return {
    amount: minCandidate.val,
    label: minCandidate.label,
    formatted: `₹${minCandidate.val.toLocaleString('en-IN')}`
  };
};


