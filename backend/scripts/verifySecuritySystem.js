require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const User = require('../models/User');
const LoginSession = require('../models/LoginSession');
const { createLoginSession, validateSession, revokeSession } = require('../services/sessionService');
const { evaluateLoginRisk } = require('../services/riskEngine');

async function runSecurityVerification() {
  console.log('--- STARTING LOGIN & SECURITY SYSTEM VERIFICATION ---');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB Atlas');

  // Test admin account
  const testEmail = 'mreducator4566@gmail.com';
  let admin = await Admin.findOne({ email: testEmail });
  if (!admin) {
    let user = await User.findOne({ email: testEmail });
    if (!user) {
      throw new Error(`Test admin account ${testEmail} not found`);
    }
    admin = user;
  }
  console.log(`✓ Located test account: ${admin.email} (ID: ${admin._id})`);

  const createdSessionIds = [];

  try {
    // -------------------------------------------------------------
    // Test 1: First Device Login (Laptop: Windows / Chrome)
    // -------------------------------------------------------------
    console.log('\n[Test 1] Simulating Login on Device 1 (Windows / Chrome)...');
    const mockReq1 = {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      socket: { remoteAddress: '106.51.24.10' }
    };

    const session1Res = await createLoginSession({
      user: admin,
      userType: 'super_admin',
      req: mockReq1
    });

    createdSessionIds.push(session1Res.sessionId);
    console.log(`✓ Session 1 created: ${session1Res.sessionId}`);
    console.log(`  Device: ${session1Res.session.operatingSystem} • ${session1Res.session.browser} (${session1Res.session.deviceType})`);
    console.log(`  Status: ${session1Res.session.status}`);

    if (session1Res.session.status !== 'ACTIVE') {
      throw new Error(`Expected Session 1 to be ACTIVE, got ${session1Res.session.status}`);
    }

    // -------------------------------------------------------------
    // Test 2: Second Device Login (Phone: iPhone / Safari) -> Invalidate Device 1
    // -------------------------------------------------------------
    console.log('\n[Test 2] Simulating Login on Device 2 (iPhone / Safari) -> Must Invalidate Device 1...');
    const mockReq2 = {
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
      },
      socket: { remoteAddress: '106.51.24.25' }
    };

    const session2Res = await createLoginSession({
      user: admin,
      userType: 'super_admin',
      req: mockReq2
    });

    createdSessionIds.push(session2Res.sessionId);
    console.log(`✓ Session 2 created: ${session2Res.sessionId}`);
    console.log(`  Device: ${session2Res.session.operatingSystem} • ${session2Res.session.browser} (${session2Res.session.deviceType})`);
    console.log(`  Status: ${session2Res.session.status}`);

    // Check Session 1 status in database
    const updatedSession1 = await LoginSession.findOne({ sessionId: session1Res.sessionId });
    console.log(`  Session 1 status after Session 2 login: ${updatedSession1.status} (Reason: ${updatedSession1.logoutReason})`);

    if (updatedSession1.status !== 'REPLACED') {
      throw new Error(`Expected Session 1 to be REPLACED, but got ${updatedSession1.status}`);
    }
    console.log('✓ Single-device enforcement PASSED: Previous device marked REPLACED');

    // -------------------------------------------------------------
    // Test 3: Validate Session Endpoints (Middleware simulation)
    // -------------------------------------------------------------
    console.log('\n[Test 3] Validating Sessions via sessionService.validateSession...');
    const validateOld = await validateSession(session1Res.sessionId);
    console.log(`  Old Session validation result:`, validateOld);
    if (validateOld.valid !== false || validateOld.code !== 'SESSION_REPLACED') {
      throw new Error(`Expected code SESSION_REPLACED for old session, got ${validateOld.code}`);
    }
    console.log('✓ SESSION_REPLACED 401 response contract verified');

    const validateNew = await validateSession(session2Res.sessionId);
    console.log(`  New Session validation result:`, { valid: validateNew.valid, status: validateNew.session?.status });
    if (!validateNew.valid || validateNew.session.status !== 'ACTIVE') {
      throw new Error('Expected new session to be valid and ACTIVE');
    }
    console.log('✓ New session validation verified');

    // -------------------------------------------------------------
    // Test 4: Impossible Travel Risk Detection Test
    // -------------------------------------------------------------
    console.log('\n[Test 4] Testing Impossible Travel & Risk Scoring Engine...');
    const riskEvaluation = await evaluateLoginRisk({
      userId: admin._id.toString(),
      email: admin.email,
      ipAddress: '185.220.101.5',
      deviceType: 'Desktop',
      operatingSystem: 'Linux',
      browser: 'Firefox',
      location: {
        country: 'United Kingdom',
        state: 'England',
        city: 'London',
        coordinates: { latitude: 51.5074, longitude: -0.1278 }
      }
    });

    console.log('  Risk evaluation result:', {
      riskScore: riskEvaluation.riskScore,
      riskLevel: riskEvaluation.riskLevel,
      riskSignals: riskEvaluation.riskSignals,
      isSuspicious: riskEvaluation.isSuspicious
    });

    if (!riskEvaluation.riskSignals.includes('IMPOSSIBLE_TRAVEL') && !riskEvaluation.riskSignals.includes('GEOGRAPHIC_CHANGE')) {
      throw new Error('Expected impossible travel or geographic change signal to be triggered');
    }
    if (riskEvaluation.riskScore < 50 || !riskEvaluation.isSuspicious) {
      throw new Error(`Expected risk score >= 50 and isSuspicious=true, got score=${riskEvaluation.riskScore}`);
    }
    console.log('✓ Risk scoring engine & Impossible Travel detection PASSED');

    // -------------------------------------------------------------
    // Test 5: Super Admin Revocation Action
    // -------------------------------------------------------------
    console.log('\n[Test 5] Testing Session Revocation Action...');
    const revoked = await revokeSession(session2Res.sessionId, 'Verification Test', 'Manual test revocation');
    console.log(`  Session 2 status after revocation: ${revoked.status}`);

    const validateRevoked = await validateSession(session2Res.sessionId);
    console.log(`  Revoked Session validation result:`, validateRevoked);
    if (validateRevoked.valid !== false || validateRevoked.code !== 'SESSION_REVOKED') {
      throw new Error(`Expected code SESSION_REVOKED, got ${validateRevoked.code}`);
    }
    console.log('✓ Session revocation PASSED');

    console.log('\n======================================================');
    console.log('🎉 ALL LOGIN & SECURITY MONITORING TESTS PASSED PERFECTLY!');
    console.log('======================================================');

  } finally {
    // Clean up created test sessions
    if (createdSessionIds.length > 0) {
      await LoginSession.deleteMany({ sessionId: { $in: createdSessionIds } });
      console.log(`\n✓ Cleaned up ${createdSessionIds.length} test sessions.`);
    }
    await mongoose.disconnect();
  }
}

runSecurityVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
  });
