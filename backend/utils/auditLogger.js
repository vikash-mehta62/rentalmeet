const AuditLog = require('../models/AuditLog');

const extractClientIp = (req) => {
  if (!req) return 'unknown';
  try {
    const forwarded = req.headers ? (req.headers['x-forwarded-for'] || req.headers['x-real-ip']) : null;
    if (forwarded) {
      const parts = String(forwarded).split(',');
      return parts[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  } catch (e) {
    return 'unknown';
  }
};

const extractUserAgent = (req) => {
  if (!req || !req.headers) return 'unknown';
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Universal safe audit logger
 * Ensures zero failures to main business logic if logging has an issue.
 */
const logAudit = async (reqOrContext, logData = {}) => {
  try {
    const req = reqOrContext && reqOrContext.headers ? reqOrContext : null;
    const directContext = (!req && reqOrContext && typeof reqOrContext === 'object') ? reqOrContext : {};

    const user = logData.performedBy || req?.user || directContext.user || null;
    const ipAddress = logData.ipAddress || extractClientIp(req) || directContext.ipAddress || 'unknown';
    const userAgent = logData.userAgent || extractUserAgent(req) || directContext.userAgent || 'unknown';
    const requestPath = logData.requestPath || req?.originalUrl || req?.url || directContext.requestPath || '';
    const requestMethod = logData.requestMethod || req?.method || directContext.requestMethod || '';

    const performedBy = {
      userId: user?._id || user?.id || (logData.isSystem ? null : undefined),
      name: user?.name || (logData.isSystem ? 'System Automated' : 'Anonymous/Guest'),
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || (logData.isSystem ? 'system' : 'guest'),
      isSystem: Boolean(logData.isSystem || (!user && !logData.performedBy))
    };

    // Sanitize any sensitive details (like passwords, card numbers)
    let sanitizedDetails = logData.details;
    if (sanitizedDetails && typeof sanitizedDetails === 'object') {
      try {
        sanitizedDetails = JSON.parse(JSON.stringify(sanitizedDetails));
        const cleanRecursive = (obj) => {
          if (!obj || typeof obj !== 'object') return;
          for (const key of Object.keys(obj)) {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('password') || lowerKey === 'token' || lowerKey.includes('secret')) {
              obj[key] = '***REDACTED***';
            } else if (typeof obj[key] === 'object') {
              cleanRecursive(obj[key]);
            }
          }
        };
        cleanRecursive(sanitizedDetails);
      } catch (err) {
        // preserve original if parsing fails
      }
    }

    const auditEntry = new AuditLog({
      category: logData.category || 'SYSTEM',
      action: logData.action || 'ACTION',
      status: logData.status || 'SUCCESS',
      performedBy,
      targetType: logData.targetType,
      targetId: logData.targetId ? String(logData.targetId) : undefined,
      targetName: logData.targetName,
      previousState: logData.previousState,
      newState: logData.newState,
      reason: logData.reason,
      details: sanitizedDetails,
      errorMessage: logData.errorMessage,
      ipAddress,
      userAgent,
      requestPath,
      requestMethod
    });

    await auditEntry.save();
    console.log(`[AUDIT_LOG] [${auditEntry.category}] ${auditEntry.action} (${auditEntry.status}) by ${performedBy.name} [IP: ${ipAddress}]`);
    return auditEntry;
  } catch (error) {
    // Non-blocking catch to ensure business logic never fails due to logging
    console.error('[AUDIT_LOG ERROR] Failed to record audit log:', error.message);
    return null;
  }
};

/**
 * Helper to log status changes (Ambassador, Venue, User, Service, Booking, etc.)
 */
const logStatusChange = async (req, {
  category,
  action = 'STATUS_CHANGE',
  targetType,
  targetId,
  targetName,
  previousState,
  newState,
  reason,
  status = 'SUCCESS',
  errorMessage,
  details
}) => {
  return logAudit(req, {
    category: category || 'ADMIN',
    action,
    status,
    targetType,
    targetId,
    targetName,
    previousState,
    newState,
    reason,
    errorMessage,
    details
  });
};

/**
 * Helper to log venue/service/profile submission attempts (saved before or on failure to prevent data loss)
 */
const logSubmissionAttempt = async (req, {
  category = 'SUBMISSION_ATTEMPT',
  action = 'SUBMISSION_ATTEMPT',
  targetType = 'Venue',
  targetName,
  payload,
  status = 'ATTEMPT',
  reason,
  errorMessage
}) => {
  return logAudit(req, {
    category,
    action,
    status,
    targetType,
    targetName,
    details: { submittedPayload: payload },
    reason,
    errorMessage
  });
};

module.exports = {
  logAudit,
  logStatusChange,
  logSubmissionAttempt,
  extractClientIp,
  extractUserAgent
};
