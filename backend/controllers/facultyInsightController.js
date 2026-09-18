const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');
const FacultyFeedback = require('../models/FacultyFeedback');
const FacultyInsightConfig = require('../models/FacultyInsightConfig');
const Branch = require('../models/Branch');
const AcademicSubject = require('../models/AcademicSubject');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const StudentAccount = require('../models/StudentAccount');
const { SIT_CIE_CONFIG } = require('../services/cieRulesEngine');

// Helper to determine if a student is eligible to provide feedback
// Any authenticated student is eligible to provide feedback for any faculty member
const checkStudentEligibility = async (studentId) => {
  if (!studentId) return false;
  return true;
};

// Fast in-memory cache for config
let cachedConfig = null;
let lastConfigFetch = 0;
const CONFIG_CACHE_TTL = 60 * 1000; // 1 min

const getConfig = async () => {
  const now = Date.now();
  if (cachedConfig && now - lastConfigFetch < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }
  let config = await FacultyInsightConfig.findOne({ key: 'global' }).lean();
  if (!config) {
    config = await FacultyInsightConfig.create({
      key: 'global',
      minResponseThreshold: 5,
      defaultMaxCie: 50,
    });
  }
  cachedConfig = config;
  lastConfigFetch = now;
  return config;
};

// Calculate median helper
const calculateMedian = (numbers) => {
  if (!numbers || numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
};

// Resolve configured CIE maximum for a subject
const resolveCieMax = (subjectDoc) => {
  if (!subjectDoc) return 50;
  if (
    subjectDoc.evaluationType &&
    SIT_CIE_CONFIG?.evaluationTypes?.[subjectDoc.evaluationType]?.maxCie
  ) {
    return SIT_CIE_CONFIG.evaluationTypes[subjectDoc.evaluationType].maxCie;
  }
  return 50;
};

/**
 * GET /api/faculty-insights/subjects
 * Fetch available curriculum subjects for a given department or faculty
 */
const getFacultySubjects = async (req, res) => {
  try {
    const { facultyId, department, departmentId } = req.query;

    let deptId = departmentId;
    let deptCode = department;

    if (facultyId && mongoose.Types.ObjectId.isValid(facultyId)) {
      const fac = await Faculty.findById(facultyId).populate('departmentId').lean();
      if (fac) {
        deptId = fac.departmentId?._id ? fac.departmentId._id.toString() : (fac.departmentId?.toString() || null);
        deptCode = fac.departmentId?.shortName || fac.department;
      }
    }

    let branch = null;
    if (deptId && mongoose.Types.ObjectId.isValid(deptId)) {
      branch = await Branch.findById(deptId).lean();
    }
    if (!branch && deptCode) {
      branch = await Branch.findOne({ shortName: deptCode.toUpperCase() }).lean();
    }

    const commonBranch = await Branch.findOne({ shortName: 'COMMON' }).lean();

    const branchIds = [];
    if (branch?._id) branchIds.push(branch._id);
    if (commonBranch?._id) branchIds.push(commonBranch._id);

    // Fetch department & common subjects first, then all other published subjects
    const allSubjects = await AcademicSubject.find({ status: 'Published' })
      .populate('branch', 'shortName name')
      .sort({ semester: 1, code: 1 })
      .lean();

    const deptSet = new Set(branchIds.map((id) => id.toString()));
    const primary = [];
    const others = [];

    allSubjects.forEach((s) => {
      const bId = s.branch?._id ? s.branch._id.toString() : s.branch?.toString();
      const item = {
        id: s._id.toString(),
        code: s.code,
        name: s.name,
        semester: s.semester,
        branch: s.branch?.shortName || s.branch?.name || (deptSet.has(bId) ? (deptCode || 'DEPT') : 'OTHER'),
        maxCie: resolveCieMax(s),
      };
      if (deptSet.has(bId)) {
        primary.push(item);
      } else {
        others.push(item);
      }
    });

    const formatted = primary.length > 0 ? [...primary, ...others] : allSubjects.map((s) => ({
      id: s._id.toString(),
      code: s.code,
      name: s.name,
      semester: s.semester,
      branch: s.branch?.shortName || s.branch?.name || 'COURSE',
      maxCie: resolveCieMax(s),
    }));

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error('Error in getFacultySubjects:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching subjects' });
  }
};

/**
 * GET /api/faculty-insights
 * Fetch aggregate faculty insights per faculty member.
 * Faculty list is loaded directly from active faculties.
 * Feedback is dynamically aggregated per faculty.
 */
const getFacultyInsights = async (req, res) => {
  try {
    const { search, department, subject } = req.query;
    const config = await getConfig();
    const minThreshold = config.minResponseThreshold || 5;

    // Fetch active faculties, branches, and published feedbacks
    const [faculties, branches, publishedFeedbacks] = await Promise.all([
      Faculty.find({ status: 'Active', isActive: { $ne: false } })
        .populate('departmentId')
        .sort({ name: 1 })
        .lean(),
      Branch.find({}).lean(),
      FacultyFeedback.find({ status: 'Published' }).sort({ createdAt: -1 }).lean(),
    ]);

    const branchMap = {};
    branches.forEach((b) => {
      const bId = b._id.toString();
      const code = b.shortName || b.name || 'GENERAL';
      branchMap[bId] = code;
    });

    // Group feedbacks by facultyId
    const feedbackByFaculty = {};
    publishedFeedbacks.forEach((fb) => {
      const facId = fb.facultyId ? fb.facultyId.toString() : '';
      if (!facId) return;
      if (!feedbackByFaculty[facId]) feedbackByFaculty[facId] = [];
      feedbackByFaculty[facId].push(fb);
    });

    const currentStudentId = req.userId ? req.userId.toString() : null;

    let studentEligibilityContext = null;
    if (currentStudentId) {
      try {
        const [studentRegs, studentAcc] = await Promise.all([
          StudentRegisteredSubject.find({
            student: currentStudentId,
            $or: [{ isActive: true }, { isActive: { $exists: false } }],
          })
            .populate('subject', 'code name semester branch')
            .lean(),
          StudentAccount.findById(currentStudentId).populate('branch').lean(),
        ]);

        const branchCode = (
          studentAcc?.branch?.code ||
          studentAcc?.branch?.shortName ||
          studentAcc?.branch ||
          ''
        )
          .toString()
          .toUpperCase();

        studentEligibilityContext = {
          hasRegs: (studentRegs || []).length > 0,
          branchCode,
          isTestEnv: Boolean(process.env.NODE_ENV === 'test' || process.env.NODE_TEST_CONTEXT),
        };
      } catch (_) {}
    }

    // Build faculty items
    const results = faculties.map((fac) => {
      const facId = fac._id.toString();
      const deptCode =
        fac.departmentId?.shortName ||
        (fac.departmentId ? branchMap[fac.departmentId.toString()] : null) ||
        fac.department ||
        'GENERAL';

      const feedbacks = feedbackByFaculty[facId] || [];
      const totalResponses = feedbacks.length;
      const hasMetThreshold = totalResponses >= minThreshold;

      // Initials helper
      const cleanName = (fac.name || '').replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim();
      const nameParts = cleanName.split(' ').filter(Boolean);
      const initials =
        nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : (cleanName || 'F').slice(0, 2).toUpperCase();

      // Student submission state
      let userFeedback = null;
      if (currentStudentId) {
        const userFb = feedbacks.find(
          (f) => f.studentId && f.studentId.toString() === currentStudentId
        );
        if (userFb) {
          userFeedback = {
            id: userFb._id.toString(),
            subjectCode: userFb.subjectCode,
            subjectName: userFb.subjectName,
            cieScore: userFb.cieScore,
            cieAvailable: userFb.cieAvailable,
            receivedNE: userFb.receivedNE,
            teachingRating: userFb.teachingRating,
            recommendationRating: userFb.recommendationRating,
            comment: userFb.comment,
            academicYear: userFb.academicYear,
            semester: userFb.semester,
          };
        }
      }

      // Check student eligibility - any logged in student can provide feedback
      const isEligibleToFeedback = Boolean(currentStudentId);

      // Distinct subjects reviewed for this faculty with per-subject student metrics
      const subjectMap = {};
      feedbacks.forEach((fb) => {
        const sc = (fb.subjectCode || '').toUpperCase().trim();
        if (!sc) return;
        if (!subjectMap[sc]) {
          subjectMap[sc] = {
            code: sc,
            name: fb.subjectName || sc,
            totalResponses: 0,
            teachingRatings: [],
            recRatings: [],
          };
        }
        subjectMap[sc].totalResponses += 1;
        if (fb.teachingRating !== null && fb.teachingRating !== undefined && !isNaN(fb.teachingRating)) {
          subjectMap[sc].teachingRatings.push(fb.teachingRating);
        }
        if (fb.recommendationRating !== null && fb.recommendationRating !== undefined && !isNaN(fb.recommendationRating)) {
          subjectMap[sc].recRatings.push(fb.recommendationRating);
        }
      });
      const reviewedSubjects = Object.values(subjectMap).map((sub) => ({
        code: sub.code,
        name: sub.name,
        totalResponses: sub.totalResponses,
        avgTeaching:
          sub.teachingRatings.length > 0
            ? Number((sub.teachingRatings.reduce((a, b) => a + b, 0) / sub.teachingRatings.length).toFixed(1))
            : null,
        avgRecommendation:
          sub.recRatings.length > 0
            ? Number((sub.recRatings.reduce((a, b) => a + b, 0) / sub.recRatings.length).toFixed(1))
            : null,
      }));

      // Calculate teaching & recommendation ratings independently
      const validTeaching = feedbacks.filter(
        (f) => f.teachingRating !== null && f.teachingRating !== undefined && !isNaN(f.teachingRating)
      );
      const avgTeaching =
        validTeaching.length > 0
          ? Number(
              (
                validTeaching.reduce((sum, f) => sum + f.teachingRating, 0) /
                validTeaching.length
              ).toFixed(1)
            )
          : null;

      const validRec = feedbacks.filter(
        (f) => f.recommendationRating !== null && f.recommendationRating !== undefined && !isNaN(f.recommendationRating)
      );
      const avgRecommendation =
        validRec.length > 0
          ? Number(
              (
                validRec.reduce((sum, f) => sum + f.recommendationRating, 0) /
                validRec.length
              ).toFixed(1)
            )
          : null;

      return {
        id: facId,
        facultyId: facId,
        facultyCode: fac.facultyId,
        name: fac.name,
        initials,
        designation: fac.designation || 'Faculty Member',
        department: deptCode,
        departmentId: fac.departmentId?._id || fac.departmentId || null,
        totalResponses,
        hasMetThreshold,
        minThreshold,
        userFeedback,
        isEligibleToFeedback,
        studentExperience: {
          teachingRating: avgTeaching,
          recommendationRating: avgRecommendation,
        },
        reviewedSubjects,
      };
    });

    // Apply filters
    let filtered = results;

    if (department && department.toLowerCase() !== 'all') {
      const targetDept = department.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        const dept = (r.department || '').toLowerCase();
        return dept === targetDept || (targetDept === 'me' && dept === 'mech');
      });
    }

    if (subject && subject.toLowerCase() !== 'all') {
      const targetSub = subject.trim().toLowerCase();
      filtered = filtered.filter((r) =>
        r.reviewedSubjects.some(
          (s) =>
            (s.code || '').toLowerCase().includes(targetSub) ||
            (s.name || '').toLowerCase().includes(targetSub)
        )
      );
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(q) ||
          (r.designation || '').toLowerCase().includes(q) ||
          (r.department || '').toLowerCase().includes(q) ||
          r.reviewedSubjects.some(
            (s) =>
              (s.name || '').toLowerCase().includes(q) ||
              (s.code || '').toLowerCase().includes(q)
          )
      );
    }

    return res.json({
      success: true,
      data: filtered,
      minThreshold,
      totalCount: filtered.length,
    });
  } catch (err) {
    console.error('Error in getFacultyInsights:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching faculty insights' });
  }
};

/**
 * GET /api/faculty-insights/:facultyId
 * or GET /api/faculty-insights/:facultyId/:subjectCode
 * Single faculty insight detail (all subjects or filtered to a subject)
 */
const getSingleFacultySubjectInsight = async (req, res) => {
  try {
    const { facultyId, subjectCode: paramSubjectCode } = req.params;
    const querySubjectCode = req.query.subjectCode;
    const selectedSubjectCode = (querySubjectCode || paramSubjectCode || '').toUpperCase().trim();

    const config = await getConfig();
    const minThreshold = config.minResponseThreshold || 5;

    let faculty = null;
    if (mongoose.Types.ObjectId.isValid(facultyId)) {
      faculty = await Faculty.findById(facultyId).populate('departmentId').lean();
    }
    if (!faculty) {
      faculty = await Faculty.findOne({ facultyId }).populate('departmentId').lean();
    }
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    const deptCode = faculty.departmentId?.shortName || faculty.department || 'GENERAL';

    // Fetch all published feedbacks for this faculty
    const allFeedbacks = await FacultyFeedback.find({
      facultyId: faculty._id,
      status: 'Published',
    }).sort({ createdAt: -1 }).lean();

    // Group reviewed subjects with per-subject student metrics
    const subjectMap = {};
    allFeedbacks.forEach((fb) => {
      const sc = (fb.subjectCode || '').toUpperCase().trim();
      if (!sc) return;
      if (!subjectMap[sc]) {
        subjectMap[sc] = {
          code: sc,
          name: fb.subjectName || sc,
          totalResponses: 0,
          teachingRatings: [],
          recRatings: [],
        };
      }
      subjectMap[sc].totalResponses += 1;
      if (fb.teachingRating !== null && fb.teachingRating !== undefined && !isNaN(fb.teachingRating)) {
        subjectMap[sc].teachingRatings.push(fb.teachingRating);
      }
      if (fb.recommendationRating !== null && fb.recommendationRating !== undefined && !isNaN(fb.recommendationRating)) {
        subjectMap[sc].recRatings.push(fb.recommendationRating);
      }
    });
    const reviewedSubjects = Object.values(subjectMap).map((sub) => ({
      code: sub.code,
      name: sub.name,
      totalResponses: sub.totalResponses,
      avgTeaching:
        sub.teachingRatings.length > 0
          ? Number((sub.teachingRatings.reduce((a, b) => a + b, 0) / sub.teachingRatings.length).toFixed(1))
          : null,
      avgRecommendation:
        sub.recRatings.length > 0
          ? Number((sub.recRatings.reduce((a, b) => a + b, 0) / sub.recRatings.length).toFixed(1))
          : null,
    }));

    // If a specific subject is requested (and not 'ALL'), filter feedbacks to that subject
    const isSpecificSubject = Boolean(selectedSubjectCode && selectedSubjectCode !== 'ALL');
    const activeFeedbacks = isSpecificSubject
      ? allFeedbacks.filter((f) => (f.subjectCode || '').toUpperCase().trim() === selectedSubjectCode)
      : allFeedbacks;

    const academicSubject = isSpecificSubject
      ? await AcademicSubject.findOne({ code: selectedSubjectCode }).lean()
      : null;

    const configuredMaxCie = academicSubject ? resolveCieMax(academicSubject) : 50;
    const totalResponses = activeFeedbacks.length;
    const hasMetThreshold = totalResponses >= minThreshold;

    const currentStudentId = req.userId ? req.userId.toString() : null;
    let userFeedback = null;
    if (currentStudentId) {
      const userFb = activeFeedbacks.find(
        (f) => f.studentId && f.studentId.toString() === currentStudentId
      );
      if (userFb) {
        userFeedback = {
          id: userFb._id.toString(),
          subjectCode: userFb.subjectCode,
          subjectName: userFb.subjectName,
          cieScore: userFb.cieScore,
          cieAvailable: userFb.cieAvailable,
          receivedNE: userFb.receivedNE,
          teachingRating: userFb.teachingRating,
          recommendationRating: userFb.recommendationRating,
          comment: userFb.comment,
          academicYear: userFb.academicYear,
          semester: userFb.semester,
        };
      }
    }

    const cleanName = (faculty.name || '').replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim();
    const nameParts = cleanName.split(' ').filter(Boolean);
    const initials =
      nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : (cleanName || 'F').slice(0, 2).toUpperCase();

    // Anyone logged in is eligible to give feedback
    const isEligibleToFeedback = Boolean(currentStudentId);

    // Fetch department curriculum subjects for this faculty (and other campus subjects)
    const branchIds = [];
    if (faculty.departmentId?._id) branchIds.push(faculty.departmentId._id);
    const commonBranch = await Branch.findOne({ shortName: 'COMMON' }).lean();
    if (commonBranch?._id) branchIds.push(commonBranch._id);

    const allSubjects = await AcademicSubject.find({ status: 'Published' })
      .populate('branch', 'shortName name')
      .sort({ semester: 1, code: 1 })
      .lean();

    const deptSet = new Set(branchIds.map((id) => id.toString()));
    const primary = [];
    const others = [];

    allSubjects.forEach((s) => {
      const bId = s.branch?._id ? s.branch._id.toString() : s.branch?.toString();
      const item = {
        id: s._id.toString(),
        code: s.code,
        name: s.name,
        semester: s.semester,
        branch: s.branch?.shortName || s.branch?.name || (deptSet.has(bId) ? (deptCode || 'DEPT') : 'OTHER'),
        maxCie: resolveCieMax(s),
      };
      if (deptSet.has(bId)) {
        primary.push(item);
      } else {
        others.push(item);
      }
    });

    const availableDepartmentSubjects =
      primary.length > 0
        ? [...primary, ...others]
        : allSubjects.map((s) => ({
            id: s._id.toString(),
            code: s.code,
            name: s.name,
            semester: s.semester,
            branch: s.branch?.shortName || s.branch?.name || 'COURSE',
            maxCie: resolveCieMax(s),
          }));

    const baseData = {
      id: faculty._id.toString(),
      facultyId: faculty._id.toString(),
      facultyCode: faculty.facultyId,
      name: faculty.name,
      initials,
      designation: faculty.designation || 'Faculty Member',
      department: deptCode,
      departmentId: faculty.departmentId?._id || faculty.departmentId || null,
      selectedSubjectCode: isSpecificSubject ? selectedSubjectCode : 'ALL',
      subjectCode: isSpecificSubject ? selectedSubjectCode : (reviewedSubjects[0]?.code || ''),
      subjectName: isSpecificSubject ? (academicSubject?.name || selectedSubjectCode) : (reviewedSubjects[0]?.name || ''),
      subjectId: academicSubject?._id ? academicSubject._id.toString() : null,
      semester: academicSubject?.semester || null,
      configuredMaxCie,
      totalResponses,
      hasMetThreshold,
      minThreshold,
      userFeedback,
      isEligibleToFeedback,
      reviewedSubjects,
      availableDepartmentSubjects,
    };

    // Calculate teaching & recommendation ratings
    const validTeaching = activeFeedbacks.filter(
      (f) => f.teachingRating !== null && f.teachingRating !== undefined && !isNaN(f.teachingRating)
    );
    const avgTeaching =
      validTeaching.length > 0
        ? Number(
            (
              validTeaching.reduce((sum, f) => sum + f.teachingRating, 0) /
              validTeaching.length
            ).toFixed(1)
          )
        : null;

    const validRec = activeFeedbacks.filter(
      (f) => f.recommendationRating !== null && f.recommendationRating !== undefined && !isNaN(f.recommendationRating)
    );
    const avgRecommendation =
      validRec.length > 0
        ? Number(
            (
              validRec.reduce((sum, f) => sum + f.recommendationRating, 0) /
              validRec.length
            ).toFixed(1)
          )
        : null;

    if (!hasMetThreshold) {
      return res.json({
        success: true,
        data: {
          ...baseData,
          notEnoughResponses: true,
          academicOutcomes: null,
          studentExperience: {
            teachingRating: avgTeaching,
            recommendationRating: avgRecommendation,
          },
          comments: [],
        },
      });
    }

    const validCie = activeFeedbacks.filter(
      (f) => f.cieAvailable && f.cieScore !== null && !isNaN(f.cieScore)
    );
    const avgCie =
      validCie.length > 0
        ? Number(
            (
              validCie.reduce((sum, f) => sum + f.cieScore, 0) / validCie.length
            ).toFixed(1)
          )
        : null;

    const medianCie =
      validCie.length > 0
        ? calculateMedian(validCie.map((f) => f.cieScore))
        : null;

    const neCount = activeFeedbacks.filter((f) => f.receivedNE === true).length;
    const neReportedPct =
      totalResponses > 0
        ? Number(((neCount / totalResponses) * 100).toFixed(1))
        : 0;

    const anonymousComments = activeFeedbacks
      .filter((f) => f.comment && f.comment.trim() !== '')
      .map((f) => ({
        id: f._id.toString(),
        subjectCode: f.subjectCode,
        subjectName: f.subjectName,
        comment: f.comment.trim(),
        date: f.createdAt,
      }));

    return res.json({
      success: true,
      data: {
        ...baseData,
        academicOutcomes: {
          avgCie,
          medianCie,
          neReported: neReportedPct,
          configuredMaxCie,
          cieResponseCount: validCie.length,
        },
        studentExperience: {
          teachingRating: avgTeaching,
          recommendationRating: avgRecommendation,
        },
        comments: anonymousComments,
      },
    });
  } catch (err) {
    console.error('Error in getSingleFacultySubjectInsight:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching faculty insight' });
  }
};

/**
 * POST /api/faculty-insights
 * Submit new feedback for (Student + Faculty + Subject + Academic Year + Semester)
 */
const submitFeedback = async (req, res) => {
  try {
    const studentId = req.userId;
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const {
      facultyId,
      subjectCode,
      subjectName,
      subjectId,
      academicYear,
      semester,
      cieScore,
      cieAvailable,
      receivedNE,
      teachingRating,
      recommendationRating,
      comment,
    } = req.body;

    // Validate faculty exists
    if (!facultyId || !mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ success: false, message: 'Valid faculty ID is required' });
    }
    const faculty = await Faculty.findById(facultyId);
    if (!faculty || faculty.status === 'Inactive') {
      return res.status(404).json({ success: false, message: 'Active faculty not found' });
    }

    // Validate subject
    const cleanSubjectCode = (subjectCode || '').toUpperCase().trim();
    if (!cleanSubjectCode) {
      return res.status(400).json({ success: false, message: 'Subject code is required' });
    }

    // Resolve academic subject to get configured max CIE
    let academicSubject = null;
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      academicSubject = await AcademicSubject.findById(subjectId);
    }
    if (!academicSubject) {
      academicSubject = await AcademicSubject.findOne({ code: cleanSubjectCode });
    }

    const cleanSubjectName =
      (subjectName || academicSubject?.name || cleanSubjectCode).trim();
    const finalSubjectId =
      academicSubject?._id ||
      (subjectId && mongoose.Types.ObjectId.isValid(subjectId) ? subjectId : null);
    const configuredMaxCie = academicSubject ? resolveCieMax(academicSubject) : 50;

    // Validate Academic Year & Semester
    const cleanAcademicYear = (
      academicYear ||
      `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`
    ).trim();
    const semNumber = Number(semester || academicSubject?.semester || req.user?.semester || 1);
    if (isNaN(semNumber) || semNumber < 1 || semNumber > 8) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8' });
    }

    // Authentication check: any logged in student can submit feedback
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to submit feedback.',
      });
    }

    // Question 01: CIE score
    const isCieAvailable = cieAvailable !== false && cieAvailable !== 'false';
    let finalCieScore = null;
    if (isCieAvailable) {
      if (cieScore === undefined || cieScore === null || isNaN(Number(cieScore))) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your CIE score or mark as not received yet',
        });
      }
      finalCieScore = Number(cieScore);
      if (finalCieScore < 0 || finalCieScore > configuredMaxCie) {
        return res.status(400).json({
          success: false,
          message: `CIE score must be between 0 and ${configuredMaxCie}`,
        });
      }
    }

    // Question 02: NE received (binary)
    if (receivedNE === undefined || receivedNE === null) {
      return res.status(400).json({
        success: false,
        message: 'Please indicate whether you received NE (Yes or No)',
      });
    }
    const isNE =
      receivedNE === true || receivedNE === 'true' || receivedNE === 'Yes' || receivedNE === 'yes';

    // Question 03: Teaching Rating (1-5)
    const teachRate = Number(teachingRating);
    if (!Number.isInteger(teachRate) || teachRate < 1 || teachRate > 5) {
      return res.status(400).json({
        success: false,
        message: 'Teaching rating must be an integer between 1 and 5',
      });
    }

    // Question 04: Recommendation Rating (1-5)
    const recRate = Number(recommendationRating);
    if (!Number.isInteger(recRate) || recRate < 1 || recRate > 5) {
      return res.status(400).json({
        success: false,
        message: 'Recommendation rating must be an integer between 1 and 5',
      });
    }

    // Optional Question 05: Comment
    let cleanComment = '';
    if (comment && typeof comment === 'string') {
      cleanComment = comment.trim();
      if (cleanComment.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Comment must not exceed 1000 characters',
        });
      }
    }

    // Check for duplicate feedback
    const existing = await FacultyFeedback.findOne({
      studentId,
      facultyId: faculty._id,
      subjectCode: cleanSubjectCode,
      academicYear: cleanAcademicYear,
      semester: semNumber,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You've already submitted feedback.",
        feedbackId: existing._id,
        canEdit: true,
      });
    }

    const newFeedback = new FacultyFeedback({
      studentId,
      facultyId: faculty._id,
      subjectId: finalSubjectId,
      subjectCode: cleanSubjectCode,
      subjectName: cleanSubjectName,
      collegeId: faculty.college || req.user?.college || null,
      academicYear: cleanAcademicYear,
      semester: semNumber,
      cieScore: finalCieScore,
      cieAvailable: isCieAvailable,
      cieMax: configuredMaxCie,
      receivedNE: isNE,
      teachingRating: teachRate,
      recommendationRating: recRate,
      comment: cleanComment,
      status: 'Published',
    });

    await newFeedback.save();

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully.',
      data: {
        id: newFeedback._id,
        facultyId: newFeedback.facultyId,
        subjectCode: newFeedback.subjectCode,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You've already submitted feedback.",
        canEdit: true,
      });
    }
    console.error('Error submitting faculty feedback:', err);
    return res.status(500).json({ success: false, message: 'Server error submitting feedback' });
  }
};

/**
 * PUT /api/faculty-insights/:id
 * Edit existing feedback — replaces prior response without double counting
 */
const updateFeedback = async (req, res) => {
  try {
    const studentId = req.userId;
    const { id } = req.params;

    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const feedback = await FacultyFeedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback record not found' });
    }

    if (feedback.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot edit another student feedback' });
    }

    const {
      cieScore,
      cieAvailable,
      receivedNE,
      teachingRating,
      recommendationRating,
      comment,
    } = req.body;

    const maxCie = feedback.cieMax || 50;

    // Update CIE
    if (cieAvailable !== undefined) {
      const isAvailable = cieAvailable !== false && cieAvailable !== 'false';
      feedback.cieAvailable = isAvailable;
      if (isAvailable) {
        if (cieScore !== undefined && cieScore !== null && !isNaN(Number(cieScore))) {
          const score = Number(cieScore);
          if (score < 0 || score > maxCie) {
            return res.status(400).json({
              success: false,
              message: `CIE score must be between 0 and ${maxCie}`,
            });
          }
          feedback.cieScore = score;
        }
      } else {
        feedback.cieScore = null;
      }
    } else if (feedback.cieAvailable && cieScore !== undefined) {
      const score = Number(cieScore);
      if (score < 0 || score > maxCie) {
        return res.status(400).json({
          success: false,
          message: `CIE score must be between 0 and ${maxCie}`,
        });
      }
      feedback.cieScore = score;
    }

    // Update NE
    if (receivedNE !== undefined) {
      feedback.receivedNE =
        receivedNE === true || receivedNE === 'true' || receivedNE === 'Yes' || receivedNE === 'yes';
    }

    // Update Teaching Rating
    if (teachingRating !== undefined) {
      const rate = Number(teachingRating);
      if (!Number.isInteger(rate) || rate < 1 || rate > 5) {
        return res.status(400).json({
          success: false,
          message: 'Teaching rating must be an integer between 1 and 5',
        });
      }
      feedback.teachingRating = rate;
    }

    // Update Recommendation Rating
    if (recommendationRating !== undefined) {
      const rec = Number(recommendationRating);
      if (!Number.isInteger(rec) || rec < 1 || rec > 5) {
        return res.status(400).json({
          success: false,
          message: 'Recommendation rating must be an integer between 1 and 5',
        });
      }
      feedback.recommendationRating = rec;
    }

    // Update Comment
    if (comment !== undefined) {
      const clean = typeof comment === 'string' ? comment.trim() : '';
      if (clean.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Comment must not exceed 1000 characters',
        });
      }
      feedback.comment = clean;
    }

    await feedback.save();

    return res.json({
      success: true,
      message: 'Feedback updated successfully.',
      data: feedback,
    });
  } catch (err) {
    console.error('Error updating feedback:', err);
    return res.status(500).json({ success: false, message: 'Server error updating feedback' });
  }
};

/**
 * GET /api/faculty-insights/admin/config
 */
const getAdminConfig = async (req, res) => {
  try {
    const config = await getConfig();
    const count = await FacultyFeedback.countDocuments();
    return res.json({
      success: true,
      data: {
        minResponseThreshold: config.minResponseThreshold || 5,
        defaultMaxCie: config.defaultMaxCie || 50,
        totalFeedbackCount: count,
      },
    });
  } catch (err) {
    console.error('Error fetching admin config:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching config' });
  }
};

/**
 * PUT /api/faculty-insights/admin/config
 */
const updateAdminConfig = async (req, res) => {
  try {
    const { minResponseThreshold, defaultMaxCie } = req.body;

    const update = {};
    if (minResponseThreshold !== undefined) {
      const threshold = Number(minResponseThreshold);
      if (isNaN(threshold) || threshold < 1) {
        return res.status(400).json({ success: false, message: 'Minimum threshold must be at least 1' });
      }
      update.minResponseThreshold = threshold;
    }
    if (defaultMaxCie !== undefined) {
      const maxCie = Number(defaultMaxCie);
      if (isNaN(maxCie) || maxCie < 1) {
        return res.status(400).json({ success: false, message: 'Default max CIE must be at least 1' });
      }
      update.defaultMaxCie = maxCie;
    }

    const config = await FacultyInsightConfig.findOneAndUpdate(
      { key: 'global' },
      { $set: update },
      { upsert: true, new: true }
    );

    cachedConfig = config;
    lastConfigFetch = Date.now();

    return res.json({
      success: true,
      message: 'Faculty insight configuration updated',
      data: config,
    });
  } catch (err) {
    console.error('Error updating admin config:', err);
    return res.status(500).json({ success: false, message: 'Server error updating config' });
  }
};

/**
 * PATCH /api/faculty-insights/admin/comments/:id/status
 */
const moderateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Published', 'Hidden'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Published' or 'Hidden'",
      });
    }

    const feedback = await FacultyFeedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    feedback.status = status;
    await feedback.save();

    return res.json({
      success: true,
      message: `Comment marked as ${status}`,
      data: feedback,
    });
  } catch (err) {
    console.error('Error moderating comment:', err);
    return res.status(500).json({ success: false, message: 'Server error moderating comment' });
  }
};

module.exports = {
  getFacultySubjects,
  getFacultyInsights,
  getSingleFacultySubjectInsight,
  submitFeedback,
  updateFeedback,
  getAdminConfig,
  updateAdminConfig,
  moderateComment,
};
