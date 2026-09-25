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

export const getVenueDurationBasePrice = (venue = {}, duration, date) => {
  const pricing = venue?.pricing || {};
  const dayType = getDateRateKey(date);
  const hours = Math.max(1, parseInt(duration, 10) || 1);

  if (hours === 1 || hours === 2) {
    return roundMoney(numberOr(pricing.perHour?.[dayType], 0) * hours);
  }
  if (hours === 4) return roundMoney(pricing.halfDay?.[dayType]);
  if (hours === 8) return roundMoney(pricing.fullDay?.[dayType]);
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

