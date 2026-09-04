const LoginSession = require('../models/LoginSession');
const LoginAttempt = require('../models/LoginAttempt');
const { calculateDistance } = require('../utils/geoIpLookup');

/**
 * Evaluates login risk signals for an incoming authentication request
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.email
 * @param {string} params.ipAddress
 * @param {string} params.deviceType
 * @param {string} params.operatingSystem
 * @param {string} params.browser
 * @param {Object} params.location - { country, state, city, coordinates, isHostingOrProxy }
 * @returns {Promise<{ riskScore: number, riskLevel: string, riskSignals: string[], isSuspicious: boolean }>}
 */
async function evaluateLoginRisk({
  userId,
  email,
  ipAddress,
  deviceType,
  operatingSystem,
  browser,
  location
}) {
  const riskSignals = [];
  let riskScore = 0;

  try {
    // 1. Fetch recent user sessions (last 20)
    const recentSessions = await LoginSession.find({
      $or: [
        { userId: userId },
        { email: email?.toLowerCase() }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // 2. Check for recent failed attempts for this email or IP (last 15 minutes)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const failedAttemptsCount = await LoginAttempt.countDocuments({
      $or: [
        { email: email?.toLowerCase() },
        { ipAddress: ipAddress }
      ],
      success: false,
      timestamp: { $gte: fifteenMinsAgo }
    });

    if (failedAttemptsCount >= 3) {
      riskSignals.push('MULTIPLE_FAILED_LOGINS');
      riskScore += Math.min(30, 15 + failedAttemptsCount * 3);
    }

    // If user has previous sessions, evaluate anomaly signals
    if (recentSessions && recentSessions.length > 0) {
      const lastSession = recentSessions[0];

      // Signal: NEW_DEVICE (check if this OS + Browser was seen before)
      const hasSeenDevice = recentSessions.some(
        s => s.operatingSystem === operatingSystem && s.browser === browser
      );
      if (!hasSeenDevice) {
        riskSignals.push('NEW_DEVICE');
        riskScore += 20;
      }

      // Signal: NEW_IP (check if this IP was seen before)
      const hasSeenIp = recentSessions.some(s => s.ipAddress === ipAddress);
      if (!hasSeenIp) {
        riskSignals.push('NEW_IP');
        riskScore += 10;
      }

      // Geographic checks
      if (location && location.country && location.country !== 'Unknown' && location.country !== 'Localhost') {
        const hasSeenCountry = recentSessions.some(
          s => s.location?.country && s.location.country === location.country
        );
        const hasSeenCity = recentSessions.some(
          s => s.location?.city && s.location.city === location.city
        );

        if (!hasSeenCountry) {
          riskSignals.push('GEOGRAPHIC_CHANGE');
          riskScore += 30;
        } else if (!hasSeenCity) {
          riskSignals.push('GEOGRAPHIC_CHANGE');
          riskScore += 15;
        }

        // Signal: IMPOSSIBLE_TRAVEL
        // If last session had coordinates and elapsed time is small, calculate speed
        if (
          lastSession.location?.coordinates?.latitude != null &&
          location.coordinates?.latitude != null
        ) {
          const distanceKm = calculateDistance(
            lastSession.location.coordinates,
            location.coordinates
          );

          if (distanceKm != null && distanceKm > 150) {
            const timeDiffHours = (Date.now() - new Date(lastSession.lastActive || lastSession.loginTime).getTime()) / (1000 * 60 * 60);
            
            // Avoid division by zero: if under 1 minute, use ~0.02 hours
            const effectiveHours = Math.max(timeDiffHours, 0.02);
            const speedKmH = distanceKm / effectiveHours;

            // Commercial flight speed max ~800-900 km/h
            if (speedKmH > 800) {
              riskSignals.push('IMPOSSIBLE_TRAVEL');
              riskScore += 50;
            }
          }
        }
      }
    }

    // Signal: SUSPICIOUS_NETWORK (Datacenter / Proxy)
    if (location?.isHostingOrProxy) {
      riskSignals.push('SUSPICIOUS_NETWORK');
      riskScore += 25;
    }

  } catch (err) {
    console.error('[RiskEngine] Error evaluating risk:', err);
  }

  // Cap risk score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, riskScore));

  // Determine Level
  let riskLevel = 'LOW';
  if (finalScore >= 70) {
    riskLevel = 'HIGH';
  } else if (finalScore >= 30) {
    riskLevel = 'MEDIUM';
  }

  // Flag as suspicious if score >= 50 or IMPOSSIBLE_TRAVEL is present
  const isSuspicious = finalScore >= 50 || riskSignals.includes('IMPOSSIBLE_TRAVEL');

  return {
    riskScore: finalScore,
    riskLevel,
    riskSignals,
    isSuspicious
  };
}

module.exports = {
  evaluateLoginRisk
};
