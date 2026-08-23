const geoip = require('geoip-lite');
const { UAParser } = require('ua-parser-js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const VisitLog = require('../models/VisitLog');
const SessionLog = require('../models/SessionLog');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const User = require('../models/User');
const { detectBot } = require('../utils/botDetector');
const { sanitizeObject, sanitizeString, sanitizeUTM } = require('../utils/sanitizeAnalytics');

// Map ISO state/region codes to readable Indian state names
const STATE_NAMES = {
  'MH': 'Maharashtra', 'DL': 'Delhi', 'KA': 'Karnataka', 'TN': 'Tamil Nadu',
  'UP': 'Uttar Pradesh', 'GJ': 'Gujarat', 'WB': 'West Bengal', 'RJ': 'Rajasthan',
  'TG': 'Telangana', 'KL': 'Kerala', 'MP': 'Madhya Pradesh', 'HR': 'Haryana',
  'PB': 'Punjab', 'BR': 'Bihar', 'OR': 'Odisha', 'AP': 'Andhra Pradesh',
  'UT': 'Uttarakhand', 'JH': 'Jharkhand', 'HP': 'Himachal Pradesh', 'GA': 'Goa',
  'CT': 'Chhattisgarh', 'JK': 'Jammu & Kashmir', 'AS': 'Assam', 'CH': 'Chandigarh'
};

// In-Memory Geolocation Cache (IP -> { country, state, city })
const geoCache = new Map();
let cachedDevPublicIp = null;
let lastDevIpFetchTime = 0;

/**
 * Fetch dev's public WAN IP when running on localhost / private network
 */
async function getDevPublicIp() {
  const now = Date.now();
  if (cachedDevPublicIp && (now - lastDevIpFetchTime < 3600000)) {
    return cachedDevPublicIp;
  }
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data && data.ip) {
      cachedDevPublicIp = data.ip;
      lastDevIpFetchTime = now;
      return cachedDevPublicIp;
    }
  } catch (e) {
    // Silent catch
  }
  return cachedDevPublicIp || null;
}

/**
 * Check if IP is private/internal loopback
 */
function isPrivateIp(ip) {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, '').trim();
  if (clean === '127.0.0.1' || clean === '::1' || clean === 'localhost') return true;
  if (/^10\./.test(clean) || /^192\.168\./.test(clean) || /^127\./.test(clean)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) return true;
  return false;
}

/**
 * Robust Client IP Extractor for VPS / Nginx / Cloudflare Reverse Proxies
 */
function getClientIp(req) {
  // 1. Cloudflare header
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string' && !isPrivateIp(cfIp)) {
    return cfIp.trim();
  }

  // 2. X-Real-IP header (Nginx proxy setup: proxy_set_header X-Real-IP $remote_addr;)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string' && !isPrivateIp(realIp)) {
    return realIp.trim();
  }

  // 3. X-Forwarded-For header (comma-separated: client, proxy1, proxy2...)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    const ips = forwarded.split(',').map(ip => ip.trim());
    for (const candidate of ips) {
      if (candidate && !isPrivateIp(candidate)) {
        return candidate;
      }
    }
    if (ips[0]) return ips[0].trim();
  }

  // 4. Express req.ip or socket remote address fallback
  const socketIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
  if (socketIp) {
    return socketIp.replace(/^::ffff:/, '').trim();
  }

  return '127.0.0.1';
}

/**
 * Hybrid Offline + Online IP Geolocation Resolver
 * Resolves exact Country, State, and City for both local development and VPS production.
 */
async function resolveGeo(ip) {
  let cleanIp = ip.replace(/^::ffff:/, '').trim();

  // If IP is localhost or private IP, resolve public WAN IP for local testing
  if (isPrivateIp(cleanIp)) {
    const devIp = await getDevPublicIp();
    if (devIp) {
      cleanIp = devIp;
    }
  }

  // 1. Check in-memory cache first
  if (geoCache.has(cleanIp)) {
    return geoCache.get(cleanIp);
  }

  // 2. Try offline geoip-lite lookup first
  const geo = geoip.lookup(cleanIp);
  let countryName = geo?.country === 'IN' ? 'India' : (geo?.country || null);
  let stateName = STATE_NAMES[geo?.region] || geo?.region || null;
  let cityName = geo?.city || null;

  // 3. If offline lookup lacks city/state (common for Indian mobile/broadband ISPs), query ip-api.com
  if (!cityName || !stateName || stateName === 'Unknown State') {
    try {
      const res = await fetch(`http://ip-api.com/json/${cleanIp}`, { signal: AbortSignal.timeout(3000) });
      const apiData = await res.json();
      if (apiData && apiData.status === 'success') {
        countryName = apiData.country || countryName || 'India';
        stateName = apiData.regionName || stateName || 'Madhya Pradesh';
        cityName = apiData.city || cityName || 'Bhopal';
      }
    } catch (err) {
      // Fallback if offline
    }
  }

  // Final fallback values if resolution is incomplete
  const finalResult = {
    country: countryName || 'India',
    state: stateName || 'Madhya Pradesh',
    city: cityName || 'Bhopal'
  };

  // Cache result (limit cache size to 10,000 entries)
  if (geoCache.size > 10000) geoCache.clear();
  geoCache.set(cleanIp, finalResult);

  return finalResult;
}

/**
 * Helper to parse User-Agent
 */
function parseUA(uaString) {
  const parser = new UAParser(uaString);
  const result = parser.getResult();
  const deviceType = result.device.type === 'mobile' ? 'mobile' : (result.device.type === 'tablet' ? 'tablet' : 'desktop');
  return {
    browser: result.browser.name ? `${result.browser.name} ${result.browser.major || ''}`.trim() : 'Other',
    os: result.os.name ? `${result.os.name} ${result.os.version || ''}`.trim() : 'Other',
    deviceType,
  };
}

/**
 * Format IP for UI display: 2 front octets clear, 3rd octet masked as xx, last octet clear (e.g. 49.43.xx.47)
 */
function formatMaskedIp(ip) {
  if (!ip || ip === 'Unknown' || ip === '127.0.0.1' || ip === '::1') {
    return '127.0.xx.xx';
  }
  const parts = String(ip).trim().split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xx.${parts[3]}`;
  }
  const v6Parts = String(ip).trim().split(':');
  if (v6Parts.length > 2) {
    return `${v6Parts[0]}:${v6Parts[1]}:****:${v6Parts[v6Parts.length - 1]}`;
  }
  return ip;
}

/**
 * Optional User Extractor from Auth Header
 */
async function getOptionalUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(decoded.id).select('name email role');
  } catch (e) {
    return null;
  }
}

/**
 * POST /api/analytics/track-visit
 * Log pageview telemetry and manage session lifecycle
 */
exports.trackVisit = async (req, res) => {
  try {
    const {
      visitorId: rawVisitorId,
      sessionId: rawSessionId,
      path: rawPath,
      pageTitle: rawTitle,
      referrer: rawReferrer,
      firstTouch,
      lastTouch
    } = req.body;

    if (!rawVisitorId || !rawPath) {
      return res.status(400).json({ success: false, message: 'visitorId and path are required' });
    }

    const path = sanitizeString(rawPath, 500);
    let authUser = await getOptionalUser(req);
    if (!authUser && req.body.userInfo && req.body.userInfo.email) {
      const info = req.body.userInfo;
      authUser = {
        _id: info.id || null,
        name: info.name || 'User',
        email: info.email,
        role: info.role || 'customer'
      };
    }
    const userRole = authUser ? authUser.role : 'guest';

    // Exclude Admin visits & Admin paths
    if (userRole === 'admin' || userRole === 'subadmin' || path.startsWith('/admin') || path.startsWith('/api/admin')) {
      return res.json({ success: true, skipped: true, reason: 'admin_excluded' });
    }

    const visitorId = sanitizeString(rawVisitorId, 100);
    const pageTitle = sanitizeString(rawTitle, 200, 'RentalMeet');
    const referrer = sanitizeString(rawReferrer, 500, 'Direct');
    const cleanFirstTouch = sanitizeUTM(firstTouch);
    const cleanLastTouch = sanitizeUTM(lastTouch);

    const userAgent = req.headers['user-agent'] || '';

    // Extract real client visitor IP & resolve exact geolocation
    const ip = getClientIp(req);
    const geo = await resolveGeo(ip);
    const uaInfo = parseUA(userAgent);
    const botInfo = detectBot(userAgent);

    const userName = authUser ? authUser.name : null;
    const userEmail = authUser ? authUser.email : null;

    let sessionId = rawSessionId ? sanitizeString(rawSessionId, 100) : null;
    let session = null;

    if (sessionId) {
      session = await SessionLog.findOne({ sessionId });
    }

    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const now = new Date();

    if (!session || (now.getTime() - new Date(session.lastActiveTime).getTime() > INACTIVITY_TIMEOUT_MS)) {
      // Create NEW session
      sessionId = `sess_${crypto.randomBytes(12).toString('hex')}`;
      session = await SessionLog.create({
        sessionId,
        visitorId,
        user: authUser?._id,
        userRole,
        userName,
        userEmail,
        landingPage: path,
        exitPage: path,
        pageViewsCount: 1,
        eventsCount: 0,
        totalDurationSeconds: 0,
        isBounce: true,
        startTime: now,
        lastActiveTime: now,
        ip,
        country: geo.country,
        state: geo.state,
        city: geo.city,
        deviceType: uaInfo.deviceType,
        browser: uaInfo.browser,
        os: uaInfo.os,
        isBot: botInfo.isBot,
        firstTouch: cleanFirstTouch,
        lastTouch: cleanLastTouch
      });
    } else {
      // Update EXISTING session atomically
      session = await SessionLog.findOneAndUpdate(
        { sessionId },
        {
          $inc: { pageViewsCount: 1 },
          $set: {
            exitPage: path,
            lastActiveTime: now,
            user: authUser?._id || session.user,
            userRole: authUser ? authUser.role : session.userRole,
            userName: authUser ? authUser.name : session.userName,
            userEmail: authUser ? authUser.email : session.userEmail,
            isBounce: false // Multiple pageviews means not a bounce!
          }
        },
        { new: true }
      );
    }

    // Generate unique visit ID
    const visitId = `vst_${crypto.randomBytes(12).toString('hex')}`;

    const visit = await VisitLog.create({
      visitId,
      sessionId,
      visitorId,
      user: authUser?._id,
      userRole,
      userName,
      userEmail,
      path,
      pageTitle,
      ip,
      country: geo.country,
      state: geo.state,
      city: geo.city,
      deviceType: uaInfo.deviceType,
      browser: uaInfo.browser,
      os: uaInfo.os,
      referrer,
      isBot: botInfo.isBot,
      botName: botInfo.botName,
      firstTouch: cleanFirstTouch,
      lastTouch: cleanLastTouch,
      durationSeconds: 0,
      lastReportedActiveSeconds: 0
    });

    res.status(201).json({
      success: true,
      visitId,
      sessionId,
      country: geo.country,
      state: geo.state,
      city: geo.city
    });
  } catch (e) {
    console.error('[Analytics] trackVisit Error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

/**
 * POST /api/analytics/track-duration
 * Update active dwell time for a specific visitId using delta logic
 */
exports.trackDuration = async (req, res) => {
  try {
    const { visitId, activeSeconds } = req.body;
    if (!visitId || typeof activeSeconds !== 'number') {
      return res.status(400).json({ success: false, message: 'visitId and numeric activeSeconds are required' });
    }

    const visit = await VisitLog.findOne({ visitId });
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit record not found' });
    }

    // Exclude Admin visits
    if (visit.userRole === 'admin' || visit.userRole === 'subadmin' || visit.path.startsWith('/admin')) {
      return res.json({ success: true, skipped: true, reason: 'admin_excluded' });
    }

    const currentReported = Math.max(0, Math.floor(activeSeconds));
    const previousReported = visit.lastReportedActiveSeconds || 0;
    const delta = Math.max(0, currentReported - previousReported);

    if (delta > 0) {
      // Update VisitLog
      visit.durationSeconds += delta;
      visit.lastReportedActiveSeconds = currentReported;
      await visit.save();

      // Update SessionLog atomically
      const session = await SessionLog.findOne({ sessionId: visit.sessionId });
      if (session) {
        session.totalDurationSeconds += delta;
        session.lastActiveTime = new Date();
        session.exitPage = visit.path;

        if (session.pageViewsCount > 1 || session.eventsCount > 0 || session.totalDurationSeconds >= 15) {
          session.isBounce = false;
        }
        await session.save();
      }
    }

    res.json({ success: true, totalDuration: visit.durationSeconds });
  } catch (e) {
    console.error('[Analytics] trackDuration Error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

/**
 * POST /api/analytics/track-event
 * Record custom engagement or conversion action
 */
exports.trackEvent = async (req, res) => {
  try {
    const {
      sessionId: rawSessionId,
      visitorId: rawVisitorId,
      visitId,
      eventName: rawEventName,
      eventCategory: rawCategory,
      eventData,
      path: rawPath,
      sourceEventId: rawSourceEventId
    } = req.body;

    if (!rawSessionId || !rawVisitorId || !rawEventName) {
      return res.status(400).json({ success: false, message: 'sessionId, visitorId, and eventName are required' });
    }

    const authUser = await getOptionalUser(req);
    const userRole = authUser ? authUser.role : 'guest';
    const path = sanitizeString(rawPath, 500, '/');

    // Exclude Admin events
    if (userRole === 'admin' || userRole === 'subadmin' || path.startsWith('/admin')) {
      return res.json({ success: true, skipped: true, reason: 'admin_excluded' });
    }

    const sessionId = sanitizeString(rawSessionId, 100);
    const visitorId = sanitizeString(rawVisitorId, 100);
    const eventName = sanitizeString(rawEventName, 100);
    const eventCategory = ['engagement', 'e-commerce', 'navigation', 'conversion'].includes(rawCategory) ? rawCategory : 'engagement';
    const sourceEventId = rawSourceEventId ? sanitizeString(rawSourceEventId, 150) : null;

    if (sourceEventId) {
      const existing = await AnalyticsEvent.findOne({ sourceEventId });
      if (existing) {
        return res.json({ success: true, duplicate: true, eventId: existing.eventId });
      }
    }

    const userAgent = req.headers['user-agent'] || '';
    const botInfo = detectBot(userAgent);
    const cleanEventData = sanitizeObject(eventData);

    const eventId = `evt_${crypto.randomBytes(12).toString('hex')}`;

    const eventRecord = await AnalyticsEvent.create({
      eventId,
      sessionId,
      visitorId,
      visitId: visitId ? sanitizeString(visitId, 100) : null,
      user: authUser?._id,
      eventName,
      eventCategory,
      eventSource: req.body.eventSource === 'server_webhook' ? 'server_webhook' : 'client',
      sourceEventId,
      eventData: cleanEventData,
      path,
      isBot: botInfo.isBot
    });

    await SessionLog.findOneAndUpdate(
      { sessionId },
      {
        $inc: { eventsCount: 1 },
        $set: {
          isBounce: false,
          lastActiveTime: new Date()
        }
      }
    );

    res.status(201).json({ success: true, eventId });
  } catch (e) {
    console.error('[Analytics] trackEvent Error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

/**
 * GET /api/admin/analytics/stats
 * Complete Admin Analytics & Attribution Report Pipeline
 */
exports.getAnalyticsStats = async (req, res) => {
  try {
    const {
      range = '30days',
      startDate,
      endDate,
      country,
      state,
      city,
      userRole,
      path,
      isBot = 'false',
      search
    } = req.query;

    const includeBot = isBot === 'true';

    // Build Date Filter Range
    let start = new Date();
    let end = new Date();

    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (range === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (range === '1week' || range === '7days') {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (range === '1month' || range === '30days') {
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'alltime') {
      start = new Date('2020-01-01');
    } else if (range === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    // Common Match Filters (EXCLUDE Admin & SubAdmin by default)
    const visitMatch = {
      createdAt: { $gte: start, $lte: end },
      userRole: { $nin: ['admin', 'subadmin'] },
      path: { $not: /^\/admin/i }
    };
    const sessionMatch = {
      startTime: { $gte: start, $lte: end },
      userRole: { $nin: ['admin', 'subadmin'] },
      landingPage: { $not: /^\/admin/i }
    };
    const eventMatch = {
      createdAt: { $gte: start, $lte: end },
      path: { $not: /^\/admin/i }
    };

    if (!includeBot) {
      visitMatch.isBot = false;
      sessionMatch.isBot = false;
      eventMatch.isBot = false;
    }

    if (country) { visitMatch.country = country; sessionMatch.country = country; }
    if (state) { visitMatch.state = state; sessionMatch.state = state; }
    if (city) { visitMatch.city = city; sessionMatch.city = city; }
    if (userRole) { visitMatch.userRole = userRole; sessionMatch.userRole = userRole; }
    if (path) { visitMatch.path = { $regex: path, $options: 'i' }; }

    // Parallel Aggregation Pipeline Execution
    const [
      totalPageviews,
      uniqueVisitorsArr,
      sessionStats,
      bounceStats,
      liveVisitorsCount,
      trendData,
      countryStats,
      stateStats,
      cityStats,
      topPages,
      landingPages,
      exitPages,
      deviceStats,
      browserStats,
      osStats,
      utmSourceStats,
      funnelData,
      eventBreakdown,
      registeredUserActivity,
      recentLogs
    ] = await Promise.all([
      VisitLog.countDocuments(visitMatch),
      VisitLog.distinct('visitorId', visitMatch),
      SessionLog.aggregate([
        { $match: sessionMatch },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            totalDuration: { $sum: '$totalDurationSeconds' },
            avgDuration: { $avg: '$totalDurationSeconds' }
          }
        }
      ]),
      SessionLog.aggregate([
        { $match: sessionMatch },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            bounces: { $sum: { $cond: ['$isBounce', 1, 0] } }
          }
        }
      ]),
      SessionLog.countDocuments({
        lastActiveTime: { $gte: new Date(Date.now() - 90 * 1000) },
        userRole: { $nin: ['admin', 'subadmin'] },
        landingPage: { $not: /^\/admin/i },
        ...(includeBot ? {} : { isBot: false })
      }),
      VisitLog.aggregate([
        { $match: visitMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            visits: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitorId' }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: '$_id',
            visits: 1,
            uniques: { $size: '$uniqueVisitors' },
            _id: 0
          }
        }
      ]),
      VisitLog.aggregate([
        { $match: visitMatch },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      VisitLog.aggregate([
        { $match: visitMatch },
        { $group: { _id: '$state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]),
      VisitLog.aggregate([
        { $match: visitMatch },
        { $group: { _id: '$city', state: { $first: '$state' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]),
      VisitLog.aggregate([
        { $match: visitMatch },
        {
          $group: {
            _id: '$path',
            pageviews: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitorId' },
            totalTime: { $sum: '$durationSeconds' },
            avgTime: { $avg: '$durationSeconds' }
          }
        },
        { $sort: { pageviews: -1 } },
        { $limit: 20 },
        {
          $project: {
            path: '$_id',
            pageviews: 1,
            uniques: { $size: '$uniqueVisitors' },
            totalTimeSeconds: '$totalTime',
            avgTimeSeconds: { $round: ['$avgTime', 1] },
            _id: 0
          }
        }
      ]),
      SessionLog.aggregate([
        { $match: sessionMatch },
        { $group: { _id: '$landingPage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      SessionLog.aggregate([
        { $match: sessionMatch },
        { $group: { _id: '$exitPage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      VisitLog.aggregate([
        { $match: visitMatch },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      VisitLog.aggregate([
        { $match: visitMatch },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]),
      VisitLog.aggregate([
        { $match: visitMatch },
        { $group: { _id: '$os', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]),
      SessionLog.aggregate([
        { $match: { ...sessionMatch, 'lastTouch.source': { $ne: null } } },
        {
          $group: {
            _id: {
              source: '$lastTouch.source',
              medium: '$lastTouch.medium',
              campaign: '$lastTouch.campaign'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Promise.all([
        SessionLog.countDocuments(sessionMatch),
        VisitLog.countDocuments({ ...visitMatch, path: { $regex: '/(venues|vendor-services|other-services|booking)/', $options: 'i' } }),
        AnalyticsEvent.countDocuments({ createdAt: { $gte: start, $lte: end }, eventName: 'booking_started' }),
        AnalyticsEvent.countDocuments({ createdAt: { $gte: start, $lte: end }, eventName: 'payment_initiated' }),
        AnalyticsEvent.countDocuments({ createdAt: { $gte: start, $lte: end }, eventName: 'payment_success' })
      ]),
      AnalyticsEvent.aggregate([
        { $match: eventMatch },
        { $group: { _id: '$eventName', category: { $first: '$eventCategory' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      VisitLog.aggregate([
        { $match: { ...visitMatch, userRole: { $nin: ['guest', 'admin', 'subadmin'] }, userEmail: { $ne: null } } },
        {
          $group: {
            _id: '$userEmail',
            name: { $first: '$userName' },
            role: { $first: '$userRole' },
            pageviews: { $sum: 1 },
            lastSeen: { $max: '$createdAt' }
          }
        },
        { $sort: { pageviews: -1 } },
        { $limit: 15 }
      ]),
      VisitLog.find(visitMatch)
        .select('visitId sessionId visitorId userRole userName userEmail path pageTitle ip country state city deviceType browser os isBot durationSeconds createdAt')
        .sort({ createdAt: -1 })
        .limit(50)
    ]);

    const uniqueVisitorsCount = uniqueVisitorsArr.length;
    const totalSessionsCount = sessionStats[0]?.totalSessions || 0;
    const avgSessionDuration = Math.round(sessionStats[0]?.avgDuration || 0);
    const bouncesCount = bounceStats[0]?.bounces || 0;
    const bounceRatePercent = totalSessionsCount > 0 ? Number(((bouncesCount / totalSessionsCount) * 100).toFixed(1)) : 0;

    const sanitizedRecentLogs = recentLogs.map(log => {
      const logObj = log.toObject();
      logObj.ipMasked = formatMaskedIp(logObj.ip);
      delete logObj.ip;
      return logObj;
    });

    res.json({
      success: true,
      summary: {
        totalPageviews,
        uniqueVisitors: uniqueVisitorsCount,
        totalSessions: totalSessionsCount,
        avgSessionDurationSeconds: avgSessionDuration,
        bounceRatePercent,
        liveVisitors: liveVisitorsCount,
        conversionsCount: funnelData[4] || 0
      },
      timeline: trendData,
      locations: {
        countries: countryStats.map(c => ({ name: c._id || 'Unknown', count: c.count })),
        states: stateStats.map(s => ({ name: s._id || 'Unknown', count: s.count })),
        cities: cityStats.map(c => ({ name: c._id || 'Unknown', state: c.state, count: c.count }))
      },
      pages: {
        topPages,
        landingPages: landingPages.map(l => ({ path: l._id || '/', count: l.count })),
        exitPages: exitPages.map(e => ({ path: e._id || '/', count: e.count }))
      },
      tech: {
        devices: deviceStats.map(d => ({ name: d._id || 'desktop', count: d.count })),
        browsers: browserStats.map(b => ({ name: b._id || 'Other', count: b.count })),
        os: osStats.map(o => ({ name: o._id || 'Other', count: o.count }))
      },
      utm: utmSourceStats.map(u => ({
        source: u._id.source || 'Direct',
        medium: u._id.medium || 'none',
        campaign: u._id.campaign || 'none',
        count: u.count
      })),
      funnel: [
        { step: 1, name: 'Sessions (Start)', count: funnelData[0] },
        { step: 2, name: 'Venue/Service Views', count: funnelData[1] },
        { step: 3, name: 'Booking Started', count: funnelData[2] },
        { step: 4, name: 'Payment Initiated', count: funnelData[3] },
        { step: 5, name: 'Payment Success', count: funnelData[4] }
      ],
      events: eventBreakdown.map(e => ({ name: e._id, category: e.category, count: e.count })),
      users: registeredUserActivity,
      recentLogs: sanitizedRecentLogs
    });
  } catch (e) {
    console.error('[Analytics] getAnalyticsStats Error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};
