const crypto = require('crypto');
const LoginSession = require('../models/LoginSession');
const LoginAttempt = require('../models/LoginAttempt');
const User = require('../models/User');
const StudentAccount = require('../models/StudentAccount');
const Admin = require('../models/Admin');
const { parseUserAgent } = require('../utils/deviceParser');
const { getClientIp, resolveLocation } = require('../utils/geoIpLookup');
const { evaluateLoginRisk } = require('./riskEngine');

/**
 * Determines client portal from request origin / referer
 * Treats port 5174 (new admin) and port 3000 (frontend) as separate portals
 */
function getClientPortal(req) {
  if (!req || !req.headers) return 'default';

  // 1. Explicit header from client
  const clientHeader = req.headers['x-client-portal'];
  if (clientHeader) {
    return clientHeader;
  }

  // 2. Check origin / referer (note: do not check backend host)
  const origin = (
    req.headers['origin'] || 
    req.headers['referer'] || 
    req.headers['x-forwarded-host'] || 
    ''
  ).toLowerCase();

  if (origin.includes('5174')) {
    return 'admin_portal_5174';
  }
  if (origin.includes('3000')) {
    return 'frontend_3000';
  }
  return 'default';
}

/**
 * Creates a new login session, invalidating any previous active session
 *
 * @param {Object} params
 * @param {Object} params.user - User document
 * @param {string} params.userType - 'student' | 'admin' | 'super_admin'
 * @param {string} [params.department] - Department ObjectId
 * @param {string} [params.departmentCode] - Department code e.g. 'ISE'
 * @param {Object} params.req - Express request
 * @returns {Promise<{ session: Object, sessionId: string }>}
 */
async function createLoginSession({
  user,
  userType = 'student',
  department = null,
  departmentCode = null,
  req
}) {
  const userId = user._id ? user._id.toString() : user.id;
  const email = user.email ? user.email.toLowerCase().trim() : '';

  // Safely normalize department: If string branch code (e.g. 'CSE') is passed, route to departmentCode
  let validatedDept = department;
  let validatedDeptCode = departmentCode;
  if (department && typeof department === 'string' && !department.match(/^[0-9a-fA-F]{24}$/)) {
    validatedDeptCode = validatedDeptCode || department;
    validatedDept = null;
  }

  // 1. Parse client info
  const userAgentString = req?.headers ? (req.headers['user-agent'] || '') : '';
  const { deviceType, operatingSystem, browser } = parseUserAgent(userAgentString);
  const ipAddress = getClientIp(req);
  const location = await resolveLocation(ipAddress);
  const portal = getClientPortal(req);

  // 2. Invalidate existing ACTIVE sessions for this user within the same portal scope
  // Treats port 5174 and port 3000 as separate portals so they don't log each other out
  const invalidatedAt = new Date();
  const filter = {
    portal: portal,
    status: 'ACTIVE',
    ...(email ? {
      $or: [
        { email: email },
        { userId: userId }
      ]
    } : { userId: userId })
  };

  await LoginSession.updateMany(
    filter,
    {
      $set: {
        status: 'REPLACED',
        logoutReason: 'New device login',
        logoutTime: invalidatedAt
      }
    }
  );

  // 3. Evaluate risk signals
  const riskResult = await evaluateLoginRisk({
    userId,
    email,
    ipAddress,
    deviceType,
    operatingSystem,
    browser,
    location
  });

  // 4. Create new LoginSession
  const sessionId = crypto.randomUUID();
  const session = await LoginSession.create({
    userId,
    email,
    userType,
    portal,
    department: validatedDept,
    departmentCode: validatedDeptCode,
    sessionId,
    deviceType,
    browser,
    operatingSystem,
    userAgent: userAgentString,
    ipAddress,
    location,
    loginTime: new Date(),
    lastActive: new Date(),
    status: 'ACTIVE',
    riskScore: riskResult.riskScore,
    riskLevel: riskResult.riskLevel,
    riskSignals: riskResult.riskSignals,
    isSuspicious: riskResult.isSuspicious
  });

  // 5. If suspicious, update securityStatus to SUSPICIOUS for admin investigation
  // (Account is NOT locked automatically)
  if (riskResult.isSuspicious) {
    const update = { securityStatus: 'SUSPICIOUS' };
    await Promise.allSettled([
      User.findByIdAndUpdate(userId, update),
      StudentAccount.findByIdAndUpdate(userId, update),
      Admin.findOneAndUpdate({ email }, update)
    ]);
  }

  // 6. Record successful login attempt
  await logLoginAttempt({
    email,
    ipAddress,
    success: true,
    reason: 'Login successful',
    userAgent: userAgentString
  });

  return {
    session,
    sessionId
  };
}

/**
 * Validates a session by sessionId
 */
async function validateSession(sessionId) {
  if (!sessionId) {
    return {
      valid: false,
      code: 'SESSION_MISSING',
      message: 'No active session identifier provided.'
    };
  }

  const session = await LoginSession.findOne({ sessionId });
  if (!session) {
    return {
      valid: false,
      code: 'SESSION_NOT_FOUND',
      message: 'Session not found. Please log in again.'
    };
  }

  if (session.status === 'REPLACED') {
    return {
      valid: false,
      code: 'SESSION_REPLACED',
      message: 'You have been logged out because your account was signed in on another device.'
    };
  }

  if (session.status === 'REVOKED') {
    return {
      valid: false,
      code: 'SESSION_REVOKED',
      message: 'Your session has been revoked by an administrator.'
    };
  }

  if (session.status !== 'ACTIVE') {
    return {
      valid: false,
      code: 'SESSION_EXPIRED',
      message: 'Your session has expired. Please log in again.'
    };
  }

  // Update lastActive timestamp if more than 60 seconds have passed
  const now = new Date();
  if (!session.lastActive || (now - new Date(session.lastActive)) > 60000) {
    session.lastActive = now;
    await session.save().catch(err => console.error('[validateSession] lastActive update error:', err));
  }

  return {
    valid: true,
    session
  };
}

/**
 * Revokes a specific session by sessionId or _id
 */
async function revokeSession(identifier, revokedBy = 'Administrator', reason = 'Revoked by administrator') {
  const query = mongooseQueryByIdOrSessionId(identifier);
  return await LoginSession.findOneAndUpdate(
    query,
    {
      $set: {
        status: 'REVOKED',
        logoutReason: `${reason} (${revokedBy})`,
        logoutTime: new Date()
      }
    },
    { new: true }
  );
}

/**
 * Revokes all active sessions for a given user
 */
async function revokeAllUserSessions(userId, revokedBy = 'Administrator', reason = 'All sessions revoked') {
  return await LoginSession.updateMany(
    {
      userId: userId.toString(),
      status: 'ACTIVE'
    },
    {
      $set: {
        status: 'REVOKED',
        logoutReason: `${reason} (${revokedBy})`,
        logoutTime: new Date()
      }
    }
  );
}

/**
 * Marks a suspicious session as safe and clears user's securityStatus
 */
async function markSessionSafe(identifier, adminEmail) {
  const query = mongooseQueryByIdOrSessionId(identifier);
  const session = await LoginSession.findOneAndUpdate(
    query,
    {
      $set: {
        isSuspicious: false,
        riskLevel: 'LOW',
        riskScore: Math.min(20, session?.riskScore || 0)
      }
    },
    { new: true }
  );

  if (session && session.userId) {
    const update = { securityStatus: 'CLEARED' };
    await Promise.allSettled([
      User.findByIdAndUpdate(session.userId, update),
      StudentAccount.findByIdAndUpdate(session.userId, update),
      Admin.findOneAndUpdate({ email: session.email }, update)
    ]);
  }

  return session;
}

/**
 * Helper to build query by _id or sessionId
 */
function mongooseQueryByIdOrSessionId(identifier) {
  if (typeof identifier === 'string' && identifier.length === 36 && identifier.includes('-')) {
    return { sessionId: identifier };
  }
  return { _id: identifier };
}

/**
 * Logs a login attempt for brute force and security auditing
 */
async function logLoginAttempt({ email, ipAddress, success, reason, userAgent }) {
  try {
    await LoginAttempt.create({
      email: email ? email.toLowerCase().trim() : '',
      ipAddress: ipAddress || '',
      success: Boolean(success),
      reason: reason || '',
      userAgent: userAgent || ''
    });
  } catch (err) {
    console.error('[logLoginAttempt] Error saving attempt:', err);
  }
}

module.exports = {
  createLoginSession,
  validateSession,
  revokeSession,
  revokeAllUserSessions,
  markSessionSafe,
  logLoginAttempt
};
