const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const StudentAccount = require('../models/StudentAccount');
const Admin = require('../models/Admin');
const { requirePlusAccess } = require('../middleware/plusAccess');
const authMiddleware = require('../middleware/auth');

function createMockRes() {
  const mock = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      if (this._onEnd) this._onEnd();
      return this;
    }
  };
  return mock;
}

function runMiddleware(middleware, req, res) {
  return new Promise((resolve, reject) => {
    res._onEnd = () => resolve(false);
    try {
      const p = middleware(req, res, (err) => {
        if (err) return reject(err);
        resolve(true);
      });
      if (p && typeof p.catch === 'function') {
        p.catch(reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

async function testAccessControl() {
  console.log('--- TESTING ANNOUNCEMENTS ACCESS CONTROL ---');
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/askursenior';
  console.log('Connecting to Mongo...');
  await mongoose.connect(uri);
  console.log('Connected to Mongo.');

  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_ask_ur_senior';

  // 1. Test Unauthenticated Request (Guest)
  console.log('\n1. Testing Unauthenticated Request (Guest)...');
  const reqUnauth = { headers: {} };
  const resUnauth = createMockRes();

  const unauthPassedAuth = await runMiddleware(authMiddleware, reqUnauth, resUnauth);
  console.log('Unauth -> Passed Auth:', unauthPassedAuth, 'Status:', resUnauth.statusCode, 'Body:', resUnauth.body);
  if (unauthPassedAuth || resUnauth.statusCode !== 401) {
    console.error('FAIL: Expected 401 for unauthenticated guest!');
    process.exit(1);
  }
  console.log('PASS: Unauthenticated guest correctly blocked with 401.');

  // 2. Test Non-Plus User (Free Student with completed profile)
  console.log('\n2. Testing Non-Plus (Free) Student...');
  let freeStudent = await StudentAccount.findOne({ 
    email: { $ne: 'mreducator4566@gmail.com' },
    isTestUser: { $ne: true },
    role: { $ne: 'admin' },
    registrationStatus: 'completed'
  }).lean();
  if (!freeStudent) {
    freeStudent = await StudentAccount.findOne({ 
      email: { $ne: 'mreducator4566@gmail.com' },
      isTestUser: { $ne: true },
      role: { $ne: 'admin' }
    }).lean();
    if (freeStudent) {
      await StudentAccount.updateOne({ _id: freeStudent._id }, { $set: { registrationStatus: 'completed' } });
      freeStudent.registrationStatus = 'completed';
    }
  }
  console.log('Testing with free student:', freeStudent.email, 'role:', freeStudent.role);

  const tokenFree = jwt.sign({ userId: freeStudent._id.toString(), email: freeStudent.email }, jwtSecret, { expiresIn: '1h' });
  const reqFree = { headers: { authorization: 'Bearer ' + tokenFree, 'x-client-portal': 'frontend_3000' } };
  const resFree = createMockRes();

  const freePassedAuth = await runMiddleware(authMiddleware, reqFree, resFree);
  const freePassedPlus = freePassedAuth ? await runMiddleware(requirePlusAccess, reqFree, resFree) : false;

  console.log('Free Student -> Passed Auth:', freePassedAuth, 'Passed Plus:', freePassedPlus, 'Status:', resFree.statusCode, 'Body:', resFree.body);
  if (freePassedPlus || resFree.statusCode !== 403 || resFree.body?.code !== 'PLUS_ACCESS_REQUIRED') {
    console.error('FAIL: Expected 403 PLUS_ACCESS_REQUIRED for free student!');
    process.exit(1);
  }
  console.log('PASS: Non-Plus student correctly blocked with 403 PLUS_ACCESS_REQUIRED.');

  // 3. Test Plus Entitled User (Student with Plus access / Test User)
  console.log('\n3. Testing Plus Entitled User (Plus Student)...');
  let plusStudent = await StudentAccount.findOne({ 
    isTestUser: true,
    registrationStatus: 'completed'
  }).lean();
  if (!plusStudent) {
    plusStudent = await StudentAccount.findOne({ isTestUser: true }).lean();
    if (plusStudent) {
      await StudentAccount.updateOne({ _id: plusStudent._id }, { $set: { registrationStatus: 'completed' } });
      plusStudent.registrationStatus = 'completed';
    } else {
      const freeDoc = await StudentAccount.findOne({ email: { $ne: 'mreducator4566@gmail.com' } }).lean();
      if (freeDoc) {
        await StudentAccount.updateOne({ _id: freeDoc._id }, { $set: { isTestUser: true, registrationStatus: 'completed' } });
        plusStudent = { ...freeDoc, isTestUser: true, registrationStatus: 'completed' };
      }
    }
  }
  console.log('Testing with Plus student:', plusStudent.email, 'isTestUser:', plusStudent.isTestUser);

  const tokenPlus = jwt.sign({ userId: plusStudent._id.toString(), email: plusStudent.email }, jwtSecret, { expiresIn: '1h' });
  const reqPlus = { headers: { authorization: 'Bearer ' + tokenPlus, 'x-client-portal': 'frontend_3000' } };
  const resPlus = createMockRes();

  const plusPassedAuth = await runMiddleware(authMiddleware, reqPlus, resPlus);
  const plusPassedPlus = plusPassedAuth ? await runMiddleware(requirePlusAccess, reqPlus, resPlus) : false;

  console.log('Plus Student -> Passed Auth:', plusPassedAuth, 'Passed Plus:', plusPassedPlus, 'Access:', reqPlus.access);
  if (!plusPassedPlus || !reqPlus.access?.hasPlusAccess) {
    console.error('FAIL: Expected Plus student to pass requirePlusAccess!');
    process.exit(1);
  }
  console.log('PASS: Plus entitlement granted successfully (hasPlusAccess = true).');

  console.log('\n--- ALL ACCESS CONTROL TESTS PASSED CLEANLY ---');
  process.exit(0);
}

testAccessControl().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
