const LoginSession = require('../models/LoginSession');
const User = require('../models/User');
const StudentAccount = require('../models/StudentAccount');
const Admin = require('../models/Admin');
const { revokeSession, revokeAllUserSessions, markSessionSafe } = require('../services/sessionService');
const { logActivity } = require('../services/adminActivityService');

/**
 * Super Admin: Security Metrics Overview
 */
async function getSecurityOverview(req, res) {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      activeSessionsCount,
      highRiskCount,
      replacedSessionsCount,
      recentLoginsCount,
      suspiciousUsersCount
    ] = await Promise.all([
      LoginSession.countDocuments({ status: 'ACTIVE' }),
      LoginSession.countDocuments({ $or: [{ riskLevel: 'HIGH' }, { riskScore: { $gte: 70 } }] }),
      LoginSession.countDocuments({ status: 'REPLACED' }),
      LoginSession.countDocuments({ loginTime: { $gte: oneDayAgo } }),
      User.countDocuments({ securityStatus: 'SUSPICIOUS' })
    ]);

    res.json({
      success: true,
      data: {
        activeSessions: activeSessionsCount,
        highRiskSessions: highRiskCount,
        replacedSessions: replacedSessionsCount,
        recentLogins24h: recentLoginsCount,
        suspiciousAccounts: suspiciousUsersCount
      }
    });
  } catch (error) {
    console.error('[getSecurityOverview] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve security overview' });
  }
}

/**
 * Super Admin: Paginated & Filterable Login History Logs
 */
async function getLoginLogs(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      riskLevel,
      deviceType,
      search,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (riskLevel && riskLevel !== 'ALL') {
      query.riskLevel = riskLevel;
    }

    if (deviceType && deviceType !== 'ALL') {
      query.deviceType = deviceType;
    }

    if (startDate || endDate) {
      query.loginTime = {};
      if (startDate) query.loginTime.$gte = new Date(startDate);
      if (endDate) query.loginTime.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [
        { email: regex },
        { ipAddress: regex },
        { 'location.city': regex },
        { 'location.country': regex },
        { browser: regex },
        { operatingSystem: regex }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [logs, total] = await Promise.all([
      LoginSession.find(query)
        .sort({ loginTime: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      LoginSession.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('[getLoginLogs] Error:', error);
    res.status(500).json({ error: 'Failed to fetch login logs' });
  }
}

/**
 * Super Admin: Suspicious Logins Feed
 */
async function getSuspiciousLogins(req, res) {
  try {
    const { limit = 50 } = req.query;

    const suspiciousSessions = await LoginSession.find({
      $or: [
        { isSuspicious: true },
        { riskLevel: 'HIGH' },
        { riskScore: { $gte: 50 } }
      ]
    })
      .sort({ loginTime: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    // Enrich with user account details if available
    const enriched = await Promise.all(
      suspiciousSessions.map(async (session) => {
        let isAccountDisabled = false;
        let accountStatus = 'active';

        if (session.userId) {
          const student = await StudentAccount.findById(session.userId).select('accountStatus').lean();
          if (student) {
            accountStatus = student.accountStatus;
            isAccountDisabled = student.accountStatus === 'suspended';
          } else {
            const legacyUser = await User.findById(session.userId).select('isSuspended').lean();
            if (legacyUser) {
              isAccountDisabled = Boolean(legacyUser.isSuspended);
              accountStatus = isAccountDisabled ? 'suspended' : 'active';
            }
          }
        }

        return {
          ...session,
          accountStatus,
          isAccountDisabled
        };
      })
    );

    res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    console.error('[getSuspiciousLogins] Error:', error);
    res.status(500).json({ error: 'Failed to fetch suspicious logins' });
  }
}

/**
 * Super Admin: Active Sessions Directory
 */
async function getActiveSessions(req, res) {
  try {
    const { search } = req.query;
    const query = { status: 'ACTIVE' };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { email: regex },
        { ipAddress: regex },
        { 'location.city': regex }
      ];
    }

    const sessions = await LoginSession.find(query)
      .sort({ lastActive: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('[getActiveSessions] Error:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
}

/**
 * Super Admin: Revoke a specific session
 */
async function revokeSessionAction(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const revoked = await revokeSession(id, req.admin?.name || req.admin?.email || 'Super Admin', reason);
    if (!revoked) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Log admin audit activity
    logActivity({
      req,
      admin: req.admin,
      action: 'UPDATE',
      resourceType: 'LOGIN_SESSION',
      resourceId: revoked._id,
      metadata: {
        title: `Revoked session for ${revoked.email}`,
        extra: { sessionId: revoked.sessionId, email: revoked.email, reason }
      }
    });

    res.json({
      success: true,
      message: `Session for ${revoked.email} has been revoked.`,
      data: revoked
    });
  } catch (error) {
    console.error('[revokeSessionAction] Error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
}

/**
 * Super Admin: Revoke all sessions for a user
 */
async function revokeAllUserSessionsAction(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await revokeAllUserSessions(id, req.admin?.name || req.admin?.email || 'Super Admin', reason);

    // Log admin audit activity
    logActivity({
      req,
      admin: req.admin,
      action: 'UPDATE',
      resourceType: 'LOGIN_SESSION',
      resourceId: id,
      metadata: {
        title: `Revoked all active sessions for user ${id}`,
        extra: { userId: id, reason }
      }
    });

    res.json({
      success: true,
      message: 'All active sessions for this user have been revoked.'
    });
  } catch (error) {
    console.error('[revokeAllUserSessionsAction] Error:', error);
    res.status(500).json({ error: 'Failed to revoke user sessions' });
  }
}

/**
 * Super Admin: Mark a session safe and clear security status
 */
async function markSessionSafeAction(req, res) {
  try {
    const { id } = req.params;

    const updated = await markSessionSafe(id, req.admin?.email);
    if (!updated) {
      return res.status(404).json({ error: 'Session not found' });
    }

    logActivity({
      req,
      admin: req.admin,
      action: 'UPDATE',
      resourceType: 'LOGIN_SESSION',
      resourceId: updated._id,
      metadata: {
        title: `Marked login safe for ${updated.email}`,
        extra: { sessionId: updated.sessionId }
      }
    });

    res.json({
      success: true,
      message: `Login session marked as safe. Security status cleared.`,
      data: updated
    });
  } catch (error) {
    console.error('[markSessionSafeAction] Error:', error);
    res.status(500).json({ error: 'Failed to mark session safe' });
  }
}

/**
 * Super Admin: Toggle account enabled/disabled (suspend/unsuspend)
 */
async function toggleUserAccount(req, res) {
  try {
    const { id } = req.params;
    const { disable, reason } = req.body;

    const suspendVal = Boolean(disable);

    // Check StudentAccount
    const student = await StudentAccount.findById(id);
    let targetEmail = '';

    if (student) {
      student.accountStatus = suspendVal ? 'suspended' : 'active';
      await student.save();
      targetEmail = student.email;
    }

    // Also update legacy User if exists
    const legacyUser = await User.findById(id);
    if (legacyUser) {
      legacyUser.isSuspended = suspendVal;
      await legacyUser.save();
      targetEmail = targetEmail || legacyUser.email;
    }

    // Check if target is an Admin
    if (targetEmail) {
      await Admin.findOneAndUpdate(
        { email: targetEmail },
        { status: suspendVal ? 'INACTIVE' : 'ACTIVE' }
      );
    }

    // If disabling account, revoke all active sessions immediately
    if (suspendVal) {
      await revokeAllUserSessions(id, req.admin?.name || req.admin?.email || 'Super Admin', `Account disabled: ${reason || 'Admin action'}`);
    }

    logActivity({
      req,
      admin: req.admin,
      action: 'UPDATE',
      resourceType: 'USER',
      resourceId: id,
      metadata: {
        title: `${suspendVal ? 'Disabled' : 'Enabled'} account ${targetEmail || id}`,
        extra: { userId: id, email: targetEmail, disabled: suspendVal, reason }
      }
    });

    res.json({
      success: true,
      message: `Account has been ${suspendVal ? 'disabled and all sessions revoked' : 'enabled'}.`,
      data: { isSuspended: suspendVal }
    });
  } catch (error) {
    console.error('[toggleUserAccount] Error:', error);
    res.status(500).json({ error: 'Failed to update account status' });
  }
}

/**
 * Any Admin: View their own personal login history (Self-Service)
 */
async function getMySecurityHistory(req, res) {
  try {
    const adminEmail = req.admin?.email?.toLowerCase().trim();
    if (!adminEmail) {
      return res.status(400).json({ error: 'Admin email not found' });
    }

    const [currentSession, pastLogins] = await Promise.all([
      req.sessionId ? LoginSession.findOne({ sessionId: req.sessionId }).lean() : null,
      LoginSession.find({
        email: adminEmail,
        ...(req.sessionId ? { sessionId: { $ne: req.sessionId } } : {})
      })
        .sort({ loginTime: -1 })
        .limit(15)
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        currentSession,
        pastLogins
      }
    });
  } catch (error) {
    console.error('[getMySecurityHistory] Error:', error);
    res.status(500).json({ error: 'Failed to fetch personal security history' });
  }
}

module.exports = {
  getSecurityOverview,
  getLoginLogs,
  getSuspiciousLogins,
  getActiveSessions,
  revokeSessionAction,
  revokeAllUserSessionsAction,
  markSessionSafeAction,
  toggleUserAccount,
  getMySecurityHistory
};
