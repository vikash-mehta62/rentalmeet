/**
 * Analytics Data Sanitization & Bounds Validation
 * Strips sensitive security fields and enforces size bounds on incoming analytics telemetry.
 */

const SENSITIVE_KEYS = [
  'password',
  'pass',
  'token',
  'jwt',
  'otp',
  'cardnumber',
  'card_number',
  'cvv',
  'cvc',
  'secret',
  'auth',
  'authorization',
  'cookie',
  'session_secret',
  'signature',
];

/**
 * Recursively cleans an object to strip sensitive keys
 */
function sanitizeObject(obj, maxDepth = 3) {
  if (!obj || typeof obj !== 'object' || maxDepth <= 0) return {};
  if (Array.isArray(obj)) {
    return obj.slice(0, 20).map(item => (typeof item === 'object' ? sanitizeObject(item, maxDepth - 1) : item));
  }

  const cleanObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      continue; // Strip sensitive key
    }

    if (value && typeof value === 'object') {
      cleanObj[key] = sanitizeObject(value, maxDepth - 1);
    } else if (typeof value === 'string') {
      cleanObj[key] = value.slice(0, 500); // Cap string lengths in event metadata
    } else {
      cleanObj[key] = value;
    }
  }

  return cleanObj;
}

/**
 * Truncates and validates strings for analytics input fields
 */
function sanitizeString(str, maxLen = 200, defaultVal = '') {
  if (!str || typeof str !== 'string') return defaultVal;
  return str.trim().slice(0, maxLen);
}

/**
 * Validates and normalizes UTM attribution objects
 */
function sanitizeUTM(utmObj) {
  if (!utmObj || typeof utmObj !== 'object') return {};
  return {
    source: sanitizeString(utmObj.source, 100),
    medium: sanitizeString(utmObj.medium, 100),
    campaign: sanitizeString(utmObj.campaign, 100),
    content: sanitizeString(utmObj.content, 100),
    term: sanitizeString(utmObj.term, 100),
  };
}

module.exports = {
  sanitizeObject,
  sanitizeString,
  sanitizeUTM,
};
