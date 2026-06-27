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
