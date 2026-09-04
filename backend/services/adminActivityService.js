const mongoose = require('mongoose');
const AdminActivity = require('../models/AdminActivity');
const AcademicMaterial = require('../models/AcademicMaterial');
const AcademicSubject = require('../models/AcademicSubject');
const Announcement = require('../models/Announcement');
const Admin = require('../models/Admin');
const User = require('../models/User');

/**
 * Log an administrative activity.
 * Non-blocking safe execution.
 */
const logActivity = async ({
  req,
  admin,
  action,
  resourceType,
  resourceId = null,
  department = null,
  departmentCode = null,
  metadata = {},
  changes = null
}) => {
  try {
    const actor = admin || req?.admin;
    if (!actor) return null;

    const ip =
      req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      null;

    const userAgent = req?.headers?.['user-agent'] || null;

    const deptId =
      department ||
      actor.department?._id ||
      actor.department ||
      req?.adminDepartmentId ||
      null;

    const deptCode =
      departmentCode ||
      actor.department?.shortName ||
      req?.adminDepartmentCode ||
      (actor.role === 'SUPER_ADMIN' ? 'ALL' : null);

    const activity = new AdminActivity({
      adminId: actor._id,
      adminName: actor.name || 'Admin',
      adminEmail: (actor.email || '').toLowerCase().trim(),
      action,
      resourceType,
      resourceId: resourceId ? new mongoose.Types.ObjectId(resourceId) : null,
      department: deptId ? new mongoose.Types.ObjectId(deptId) : null,
      departmentCode: deptCode,
      metadata: {
        title: metadata.title || null,
        subject: metadata.subject || null,
        materialType: metadata.materialType || null,
        count: metadata.count !== undefined ? metadata.count : 1,
        affectedIds: metadata.affectedIds || [],
        changes: changes || metadata.changes || null,
        ip,
        userAgent,
        extra: metadata.extra || null
      },
      createdAt: new Date()
    });

    await activity.save();
    return activity;
  } catch (err) {
    console.error('[AdminActivityService] Failed to log activity:', err.message);
    return null;
  }
};

/**
 * Helper to calculate start date for a time range
 */
const getStartDateForRange = (range = 'all') => {
  const now = new Date();
  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  }
  if (range === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (range === 'month') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null;
};

/**
 * Get aggregated contributions for a specific administrator.
 *
 * CRITICAL ARCHITECTURAL PRINCIPLE:
 * Audit Logs track actions (CREATE, UPDATE, DELETE).
 * Contributions track actual original creator content in DB models (AcademicMaterial, AcademicSubject, Announcement).
 * Rahul gets credit for materials he created, even if Arjun updates them later.
 */
const getAdminContributionStats = async (adminId, timeRange = 'all') => {
  try {
    const admin = await Admin.findById(adminId).lean();
    if (!admin) {
      return {
        total: 0,
        materialsTotal: 0,
        notes: 0,
        pyqs: 0,
        questionBanks: 0,
        syllabus: 0,
        labManuals: 0,
        textbooks: 0,
        otherMaterials: 0,
        subjects: 0,
        announcements: 0,
        timeRange
      };
    }

    const adminEmail = (admin.email || '').toLowerCase().trim();
    const user = await User.findOne({ email: adminEmail }).select('_id').lean();
    const userObjectId = user ? user._id : null;

    const startDate = getStartDateForRange(timeRange);
    const dateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    // 1. Query AcademicMaterial by creator (uploadedBy or uploaderEmail)
    const materialCreatorOr = [{ uploaderEmail: adminEmail }];
    if (userObjectId) {
      materialCreatorOr.push({ uploadedBy: userObjectId });
    }
    const materialQuery = {
      ...dateFilter,
      $or: materialCreatorOr
    };

    const materials = await AcademicMaterial.find(materialQuery)
      .select('materialType createdAt')
      .lean();

    const counts = {
      notes: 0,
      pyqs: 0,
      questionBanks: 0,
      syllabus: 0,
      labManuals: 0,
      textbooks: 0,
      otherMaterials: 0,
      materialsTotal: materials.length,
      subjects: 0,
      announcements: 0,
      total: 0,
      timeRange
    };

    materials.forEach((m) => {
      const type = (m.materialType || '').toLowerCase().trim();
      if (type === 'notes') counts.notes++;
      else if (type === 'pyqs' || type === 'pyq') counts.pyqs++;
      else if (type === 'question banks' || type === 'questionbanks' || type === 'question bank') counts.questionBanks++;
      else if (type === 'syllabus') counts.syllabus++;
      else if (type === 'lab manuals' || type === 'labmanuals' || type === 'lab manual') counts.labManuals++;
      else if (type === 'textbooks' || type === 'textbook') counts.textbooks++;
      else counts.otherMaterials++;
    });

    // 2. Query AcademicSubject by creator (createdBy or creatorEmail)
    const subjectCreatorOr = [{ creatorEmail: adminEmail }];
    if (userObjectId) {
      subjectCreatorOr.push({ createdBy: userObjectId });
    }
    const subjectQuery = {
      ...dateFilter,
      $or: subjectCreatorOr
    };
    counts.subjects = await AcademicSubject.countDocuments(subjectQuery);

    // 3. Query Announcement by creator (createdBy)
    if (userObjectId) {
      counts.announcements = await Announcement.countDocuments({
        ...dateFilter,
        createdBy: userObjectId
      });
    }

    counts.total = counts.materialsTotal + counts.subjects + counts.announcements;
    return counts;
  } catch (err) {
    console.error('[AdminActivityService] Failed to compute admin stats:', err);
    return {
      total: 0,
      materialsTotal: 0,
      notes: 0,
      pyqs: 0,
      questionBanks: 0,
      syllabus: 0,
      labManuals: 0,
      textbooks: 0,
      otherMaterials: 0,
      subjects: 0,
      announcements: 0,
      timeRange
    };
  }
};

/**
 * Get leaderboard summary across all administrators
 * Computes live contribution rankings from actual content created
 */
const getLeaderboard = async (timeRange = 'all') => {
  try {
    const admins = await Admin.find()
      .populate('department', 'name shortName')
      .sort({ createdAt: 1 })
      .lean();

    const leaderboardPromises = admins.map(async (admin) => {
      const stats = await getAdminContributionStats(admin._id, timeRange);
      const deptCode =
        admin.role === 'SUPER_ADMIN'
          ? 'ALL'
          : admin.department?.shortName || admin.department?.name || 'General';

      return {
        adminId: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: deptCode,
        status: admin.status,
        notes: stats.notes,
        pyqs: stats.pyqs,
        questionBanks: stats.questionBanks,
        syllabus: stats.syllabus,
        labManuals: stats.labManuals,
        textbooks: stats.textbooks,
        otherMaterials: stats.otherMaterials,
        subjects: stats.subjects,
        announcements: stats.announcements,
        total: stats.total
      };
    });

    const results = await Promise.all(leaderboardPromises);
    results.sort((a, b) => b.total - a.total);

    const ranked = results.map((item, idx) => ({
      rank: idx + 1,
      ...item
    }));

    return ranked;
  } catch (err) {
    console.error('[AdminActivityService] Failed to compute leaderboard:', err);
    return [];
  }
};

/**
 * Paginated activities query for global audit logs
 */
const getActivityLogs = async ({
  page = 1,
  limit = 25,
  adminId,
  action,
  resourceType,
  department,
  search,
  startDate,
  endDate
}) => {
  try {
    const filter = {};

    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
      filter.adminId = new mongoose.Types.ObjectId(adminId);
    }
    if (action) {
      filter.action = action.toUpperCase();
    }
    if (resourceType) {
      filter.resourceType = resourceType.toUpperCase();
    }
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        filter.department = new mongoose.Types.ObjectId(department);
      } else {
        filter.departmentCode = department.toUpperCase();
      }
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { adminName: regex },
        { adminEmail: regex },
        { 'metadata.title': regex },
        { 'metadata.subject': regex },
        { departmentCode: regex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [activities, total] = await Promise.all([
      AdminActivity.find(filter)
        .populate('department', 'name shortName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AdminActivity.countDocuments(filter)
    ]);

    return {
      activities,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)) || 1
    };
  } catch (err) {
    console.error('[AdminActivityService] Error fetching activity logs:', err);
    throw err;
  }
};

module.exports = {
  logActivity,
  getAdminContributionStats,
  getLeaderboard,
  getActivityLogs
};
