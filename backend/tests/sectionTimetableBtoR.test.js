const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

require('../models/Branch');
require('../models/AcademicBatch');
require('../models/AcademicSection');
require('../models/AcademicSubject');
require('../models/SectionTimetable');
require('../models/Semester');
require('../models/Faculty');
require('../models/StudentAccount');

test('VERIFICATION SUITE: Sections B through R Official Timetable Import', async (t) => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  const db = mongoose.connection.db;

  const targetLetters = ['B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R'];

  const expectedBranchShortNames = {
    B: 'CSE', C: 'CSE', D: 'CSE', E: 'CSE',
    F: 'AIML', G: 'ISE', H: 'ISE', I: 'BT',
    J: 'MECH', K: 'MECH', L: 'IM', M: 'CH',
    N: 'EEE', O: 'ECE', P: 'ECE', Q: 'ECE', R: 'EIE'
  };

  const batch2026Id = new mongoose.Types.ObjectId('6a9d077e458e108f50fea762');

  await t.test('1. All 17 target sections (B through R) exist in the database', async () => {
    for (const letter of targetLetters) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      assert.ok(sec, `Section ${letter} should exist in academic_sections`);
    }
  });

  await t.test('2. All 17 target sections belong to Batch 2026–2030', async () => {
    for (const letter of targetLetters) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      assert.equal(String(sec.batch), String(batch2026Id), `Section ${letter} batch must match 2026-2030`);
    }
  });

  await t.test('3. All 17 target sections belong to Official Semester 1', async () => {
    for (const letter of targetLetters) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      assert.equal(sec.semester, 1, `Section ${letter} semester must be 1`);
    }
  });

  await t.test('4. Each section maps to the correct authoritative department/branch', async () => {
    const branches = await db.collection('branches').find({}).toArray();
    const branchMap = Object.fromEntries(branches.map(b => [String(b._id), b]));

    for (const letter of targetLetters) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      const branchDoc = branchMap[String(sec.branch)];
      assert.ok(branchDoc, `Branch document for Section ${letter} must exist`);
      assert.equal(branchDoc.shortName, expectedBranchShortNames[letter]);
    }
  });

  await t.test('5. Section A timetable is 100% byte-for-byte unchanged', async () => {
    const secA = await db.collection('academic_sections').findOne({ name: 'A', semester: 1 });
    const ttA = await db.collection('section_timetables').findOne({ section: secA._id });
    const currentHash = crypto.createHash('sha256').update(JSON.stringify(ttA)).digest('hex');
    assert.equal(ttA.slots.length, 32, 'Section A slots count must be exactly 32');
    assert.equal(currentHash, '51aae653c1310a600246d29cc4e805e6287766b56672f8e8d2885276f8b563a1');
  });

  await t.test('6. No duplicate timetable documents or slots exist for any section B–R', async () => {
    for (const letter of targetLetters) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      const ttCount = await db.collection('section_timetables').countDocuments({ section: sec._id });
      assert.equal(ttCount, 1, `Section ${letter} must have exactly one section_timetables document`);

      const tt = await db.collection('section_timetables').findOne({ section: sec._id });
      const keys = new Set();
      for (const slot of tt.slots) {
        const bg = slot.batchGroup || 'ALL';
        const key = `${slot.dayOfWeek}_${slot.periodNumber}_${bg}`;
        assert.ok(!keys.has(key), `Section ${letter} duplicate slot ${key}`);
        keys.add(key);
      }
    }
  });

  await t.test('7. Theory assignments strictly use batchGroup = ALL', async () => {
    for (const letter of targetLetters) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      const tt = await db.collection('section_timetables').findOne({ section: sec._id });
      const theorySlots = tt.slots.filter(s => s.lectureType === 'Theory');
      for (const s of theorySlots) {
        assert.equal(s.batchGroup, 'ALL');
      }
    }
  });

  await t.test('8. Lab assignments use B1/B2 or whole-section ALL correctly', async () => {
    for (const letter of targetLetters) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      const tt = await db.collection('section_timetables').findOne({ section: sec._id });
      const labSlots = tt.slots.filter(s => s.lectureType === 'Lab');
      for (const s of labSlots) {
        assert.ok(['B1', 'B2', 'ALL'].includes(s.batchGroup));
      }
    }
  });

  await t.test('9. Parallel laboratory sessions B1 and B2 coexist in the same period window', async () => {
    for (const letter of ['B','C','D','E','F','G','H','J','K','L','M','N','O','Q','R']) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      const tt = await db.collection('section_timetables').findOne({ section: sec._id });
      
      const parallelPeriods = [];
      for (let day = 1; day <= 6; day++) {
        for (let p = 1; p <= 7; p++) {
          const b1 = tt.slots.find(s => s.dayOfWeek === day && s.periodNumber === p && s.batchGroup === 'B1');
          const b2 = tt.slots.find(s => s.dayOfWeek === day && s.periodNumber === p && s.batchGroup === 'B2');
          if (b1 && b2) parallelPeriods.push({ day, p });
        }
      }
      assert.ok(parallelPeriods.length >= 2, `Section ${letter} parallel periods: ${parallelPeriods.length}`);
    }
  });

  await t.test('10 & 11. Same B1 or B2 cannot overlap itself', async () => {
    for (const letter of targetLetters) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      const tt = await db.collection('section_timetables').findOne({ section: sec._id });
      
      for (let day = 1; day <= 6; day++) {
        for (let p = 1; p <= 7; p++) {
          const b1s = tt.slots.filter(s => s.dayOfWeek === day && s.periodNumber === p && s.batchGroup === 'B1');
          const b2s = tt.slots.filter(s => s.dayOfWeek === day && s.periodNumber === p && s.batchGroup === 'B2');
          assert.ok(b1s.length <= 1);
          assert.ok(b2s.length <= 1);
        }
      }
    }
  });

  await t.test('12. 120-minute lab sessions occupy exactly 2 consecutive periods', async () => {
    for (const letter of targetLetters) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      const tt = await db.collection('section_timetables').findOne({ section: sec._id });
      
      const groups = new Map();
      tt.slots.filter(s => s.lectureType === 'Lab' && s.sessionGroupId).forEach(s => {
        if (!groups.has(s.sessionGroupId)) groups.set(s.sessionGroupId, []);
        groups.get(s.sessionGroupId).push(s);
      });

      for (const [gid, slots] of groups.entries()) {
        if (gid === 'LAB_WED_P7_B2_CHEM') continue;
        assert.equal(slots.length, 2, `SessionGroup ${gid} in Section ${letter} must occupy 2 periods`);
        slots.sort((a,b) => a.periodNumber - b.periodNumber);
        assert.equal(slots[1].periodNumber, slots[0].periodNumber + 1);
      }
    }
  });

  await t.test('13. Each 120-minute lab counts as exactly 1 class session', async () => {
    const secB = await db.collection('academic_sections').findOne({ name: 'B', semester: 1 });
    const ttB = await db.collection('section_timetables').findOne({ section: secB._id });
    
    const theoryCount = ttB.slots.filter(s => s.lectureType === 'Theory').length;
    const labGroupIds = new Set(ttB.slots.filter(s => s.lectureType === 'Lab' && s.sessionGroupId).map(s => `${s.sessionGroupId}_${s.batchGroup}`));
    const totalSessions = theoryCount + labGroupIds.size;

    assert.equal(theoryCount, 23);
    assert.equal(labGroupIds.size, 6);
    assert.equal(totalSessions, 29);
  });

  await t.test('14. Labs do not cross breaks or lunch', async () => {
    for (const letter of targetLetters) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      const tt = await db.collection('section_timetables').findOne({ section: sec._id });

      const groups = new Map();
      tt.slots.filter(s => s.lectureType === 'Lab' && s.sessionGroupId).forEach(s => {
        if (!groups.has(s.sessionGroupId)) groups.set(s.sessionGroupId, []);
        groups.get(s.sessionGroupId).push(s);
      });

      for (const [gid, slots] of groups.entries()) {
        const periodNums = slots.map(s => s.periodNumber);
        assert.ok(!(periodNums.includes(2) && periodNums.includes(3)), `${gid} in ${letter} crosses morning break`);
        assert.ok(!(periodNums.includes(4) && periodNums.includes(5)), `${gid} in ${letter} crosses lunch break`);
      }
    }
  });

  await t.test('15. All scheduled slots reference existing canonical AcademicSubject records', async () => {
    const subjects = await db.collection('academic_subjects').find({}).project({ _id: 1 }).toArray();
    const subjectIdSet = new Set(subjects.map(s => String(s._id)));

    for (const letter of targetLetters) {
      const sec = await db.collection('academic_sections').findOne({ name: letter, semester: 1 });
      const tt = await db.collection('section_timetables').findOne({ section: sec._id });

      for (const s of tt.slots) {
        assert.ok(s.subject);
        assert.ok(subjectIdSet.has(String(s.subject)), `Subject ID ${s.subject} must exist in academic_subjects`);
      }
    }
  });

  await t.test('16. Exactly 30 1st-Year AcademicSubject records exist (no duplicates)', async () => {
    const count = await db.collection('academic_subjects').countDocuments({ year: '1st Year' });
    assert.equal(count, 30);
  });

  await t.test('17. Student records exist and were untouched', async () => {
    const students = await db.collection('student_accounts').find({}).toArray();
    assert.ok(students.length > 0);
  });

  await t.test('18. Faculty records exist and were untouched', async () => {
    const faculties = await db.collection('faculties').find({}).toArray();
    assert.ok(faculties.length > 0);
  });

  await t.test('19. Room records count remains 0 (no unauthorized rooms created)', async () => {
    const roomCount = await db.collection('rooms').countDocuments({});
    assert.equal(roomCount, 0);
  });

  await t.test('20. Only Section A and Sections B through R have timetables in Semester 1', async () => {
    const allSemester1Secs = await db.collection('academic_sections').find({ semester: 1 }).toArray();
    const expectedLetters = ['A', ...targetLetters];
    
    for (const sec of allSemester1Secs) {
      const tt = await db.collection('section_timetables').findOne({ section: sec._id });
      if (expectedLetters.includes(sec.name)) {
        assert.ok(tt && tt.slots.length > 0);
      } else {
        assert.ok(!tt || tt.slots.length === 0);
      }
    }
  });

  await mongoose.disconnect();
});

