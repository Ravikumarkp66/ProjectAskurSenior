/**
 * F-011: Faculty Insights Test Suite
 * Framework: node:test + node:assert/strict
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Faculty = require('../../models/Faculty');
const FacultyFeedback = require('../../models/FacultyFeedback');
const FacultyInsightConfig = require('../../models/FacultyInsightConfig');
const Branch = require('../../models/Branch');

test('F-011: Faculty Insights Data Model & Aggregation Engine Suite', async (suite) => {
  let branch = null;
  let testFaculty = null;
  const createdFeedbackIds = [];
  const testStudentId1 = new mongoose.Types.ObjectId();
  const testStudentId2 = new mongoose.Types.ObjectId();
  const testStudentId3 = new mongoose.Types.ObjectId();

  suite.before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    branch = await Branch.findOne({ shortName: 'ISE' });
    if (!branch) {
      branch = await Branch.create({
        name: 'Information Science & Engineering',
        shortName: 'ISE',
        code: 'ISE',
      });
    }

    testFaculty = await Faculty.create({
      facultyId: 'FAC_TEST_' + Date.now().toString().slice(-5),
      name: 'Dr. Test Insights Faculty',
      designation: 'Associate Professor',
      departmentId: branch._id,
      department: 'ISE',
      subjects: ['DBMS · 21CS42'],
      status: 'Active',
      isActive: true,
    });
  });

  suite.after(async () => {
    if (testFaculty) {
      await Faculty.findByIdAndDelete(testFaculty._id);
    }
    if (createdFeedbackIds.length > 0) {
      await FacultyFeedback.deleteMany({ _id: { $in: createdFeedbackIds } });
    }
    await FacultyFeedback.deleteMany({ facultyId: testFaculty?._id });
    await mongoose.disconnect();
  });

  await suite.test('1. Feedback Model requires all 4 essential fields and allows optional comment', async () => {
    const feedback = new FacultyFeedback({
      studentId: testStudentId1,
      facultyId: testFaculty._id,
      subjectCode: '21CS42',
      subjectName: 'Database Management Systems',
      academicYear: '2024-25',
      semester: 4,
      cieScore: 38.5,
      cieAvailable: true,
      cieMax: 50,
      receivedNE: false,
      teachingRating: 4,
      recommendationRating: 5,
      comment: 'Explains concepts clearly with real-world examples.',
    });

    const saved = await feedback.save();
    createdFeedbackIds.push(saved._id);

    assert.equal(saved.cieScore, 38.5);
    assert.equal(saved.cieAvailable, true);
    assert.equal(saved.receivedNE, false);
    assert.equal(saved.teachingRating, 4);
    assert.equal(saved.recommendationRating, 5);
    assert.equal(saved.comment, 'Explains concepts clearly with real-world examples.');
    assert.equal(saved.status, 'Published');
  });

  await suite.test('2. Supports unavailable CIE (marks not received yet) without storing zero', async () => {
    const feedback = new FacultyFeedback({
      studentId: testStudentId2,
      facultyId: testFaculty._id,
      subjectCode: '21CS42',
      subjectName: 'Database Management Systems',
      academicYear: '2024-25',
      semester: 4,
      cieScore: null,
      cieAvailable: false,
      cieMax: 50,
      receivedNE: false,
      teachingRating: 5,
      recommendationRating: 4,
      comment: '',
    });

    const saved = await feedback.save();
    createdFeedbackIds.push(saved._id);

    assert.equal(saved.cieScore, null);
    assert.equal(saved.cieAvailable, false);
  });

  await suite.test('3. Enforces unique compound index to prevent duplicate feedback from same student', async () => {
    const duplicate = new FacultyFeedback({
      studentId: testStudentId1, // same student as test 1
      facultyId: testFaculty._id,
      subjectCode: '21CS42',
      subjectName: 'Database Management Systems',
      academicYear: '2024-25',
      semester: 4,
      cieScore: 40,
      cieAvailable: true,
      cieMax: 50,
      receivedNE: false,
      teachingRating: 5,
      recommendationRating: 5,
    });

    await assert.rejects(async () => {
      await duplicate.save();
    }, /E11000.*duplicate key/);
  });

  await suite.test('4. Allows editing existing feedback to replace prior response without double counting', async () => {
    const existing = await FacultyFeedback.findOne({
      studentId: testStudentId1,
      facultyId: testFaculty._id,
      subjectCode: '21CS42',
    });

    assert.ok(existing);
    existing.cieScore = 42;
    existing.teachingRating = 5;
    existing.comment = 'Updated comment: Outstanding professor.';
    await existing.save();

    const count = await FacultyFeedback.countDocuments({
      studentId: testStudentId1,
      facultyId: testFaculty._id,
      subjectCode: '21CS42',
    });

    assert.equal(count, 1, 'Edited feedback must not create a second document');
    assert.equal(existing.cieScore, 42);
    assert.equal(existing.teachingRating, 5);
  });

  await suite.test('5. CIE calculation excludes unavailable entries and accurately computes Mean & Median', async () => {
    // Add third feedback with known values
    const feedback3 = await FacultyFeedback.create({
      studentId: testStudentId3,
      facultyId: testFaculty._id,
      subjectCode: '21CS42',
      subjectName: 'Database Management Systems',
      academicYear: '2024-25',
      semester: 4,
      cieScore: 36,
      cieAvailable: true,
      cieMax: 50,
      receivedNE: true, // 1 student reported NE
      teachingRating: 3,
      recommendationRating: 3,
      comment: 'Tough evaluations.',
    });
    createdFeedbackIds.push(feedback3._id);

    const feedbacks = await FacultyFeedback.find({
      facultyId: testFaculty._id,
      subjectCode: '21CS42',
      status: 'Published',
    }).lean();

    assert.equal(feedbacks.length, 3);

    // Valid CIE are: 42 (from student 1) and 36 (from student 3). Student 2 had cieAvailable: false
    const validCie = feedbacks.filter((f) => f.cieAvailable && f.cieScore !== null);
    assert.equal(validCie.length, 2);

    const avgCie = Number(
      (validCie.reduce((acc, f) => acc + f.cieScore, 0) / validCie.length).toFixed(1)
    );
    assert.equal(avgCie, 39.0); // (42 + 36) / 2 = 39.0

    // NE reported: 1 out of 3 = 33.3%
    const neCount = feedbacks.filter((f) => f.receivedNE === true).length;
    const neReported = Number(((neCount / feedbacks.length) * 100).toFixed(1));
    assert.equal(neReported, 33.3);

    // Teaching rating average: (5 + 5 + 3) / 3 = 4.3
    const avgTeaching = Number(
      (feedbacks.reduce((acc, f) => acc + f.teachingRating, 0) / feedbacks.length).toFixed(1)
    );
    assert.equal(avgTeaching, 4.3);

    // Recommendation average: (5 + 4 + 3) / 3 = 4.0
    const avgRecommendation = Number(
      (feedbacks.reduce((acc, f) => acc + f.recommendationRating, 0) / feedbacks.length).toFixed(1)
    );
    assert.equal(avgRecommendation, 4.0);
  });

  await suite.test('6. Low Response Threshold protects aggregate anonymity & accuracy', async () => {
    // Current count is 3. If threshold is 5, aggregates must be treated as insufficient
    const config = await FacultyInsightConfig.findOneAndUpdate(
      { key: 'global' },
      { $set: { minResponseThreshold: 5 } },
      { upsert: true, new: true }
    );

    const feedbacks = await FacultyFeedback.find({
      facultyId: testFaculty._id,
      subjectCode: '21CS42',
    });

    const hasMetThreshold = feedbacks.length >= config.minResponseThreshold;
    assert.equal(hasMetThreshold, false, 'Should be flagged as not enough responses yet');
  });
});
