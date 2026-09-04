const Admin = require('../models/Admin');
const Branch = require('../models/Branch');
const AdminActivity = require('../models/AdminActivity');
const adminActivityService = require('../services/adminActivityService');
const { logActivity } = adminActivityService;

const SUPER_ADMIN_PERMISSIONS = {
  users: { view: true, create: true, update: true, delete: true },
  subjects: { view: true, create: true, update: true, delete: true },
  materials: { view: true, create: true, update: true, delete: true, publish: true, archive: true },
  queries: { view: true, respond: true, resolve: true, delete: true },
  requests: { view: true, approve: true, reject: true }
};

// GET /api/admin/admins - List all admins
const listAdmins = async (req, res) => {
  try {
    const [admins, branches] = await Promise.all([
      Admin.find().populate('department', 'name shortName').sort({ createdAt: -1 }).lean(),
      Branch.find({ status: 'Published' }).select('name shortName').sort({ displayOrder: 1, name: 1 }).lean()
    ]);

    // Attach live contribution counts directly to each admin
    const adminsWithContributions = await Promise.all(
      admins.map(async (admin) => {
        const stats = await adminActivityService.getAdminContributionStats(admin._id, 'all');
        return {
          ...admin,
          contributionsCount: stats.total
        };
      })
    );

    const superAdminCount = admins.filter((a) => a.role === 'SUPER_ADMIN').length;
    const activeCount = admins.filter((a) => a.status === 'ACTIVE').length;

    res.status(200).json({
      admins: adminsWithContributions,
      branches,
      stats: {
        total: admins.length,
        superAdmins: superAdminCount,
        maxSuperAdmins: 3,
        active: activeCount
      }
    });
  } catch (err) {
    console.error('listAdmins error:', err);
    res.status(500).json({ error: 'Server error fetching admins list' });
  }
};

// POST /api/admin/admins - Create a new admin
const createAdmin = async (req, res) => {
  try {
    const { name, email, role, department, permissions, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Admin name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Admin email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const existing = await Admin.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: `An admin with email "${normalizedEmail}" already exists.` });
    }

    const targetRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

    // Enforce Maximum 3 Super Admins rule
    if (targetRole === 'SUPER_ADMIN') {
      const superCount = await Admin.countDocuments({ role: 'SUPER_ADMIN' });
      if (superCount >= 3) {
        return res.status(400).json({
          error: 'Maximum limit of 3 Super Admins reached. Cannot create another Super Admin.'
        });
      }
    }

    let branchRef = null;
    if (targetRole === 'ADMIN') {
      if (!department) {
        return res.status(400).json({ error: 'Department is required for normal administrators.' });
      }

      // Check if department is ObjectId or branch shortName
      let branchDoc = null;
      if (department.match(/^[0-9a-fA-F]{24}$/)) {
        branchDoc = await Branch.findById(department);
      } else {
        branchDoc = await Branch.findOne({ shortName: department.trim().toUpperCase() });
      }

      if (!branchDoc) {
        return res.status(400).json({ error: `Invalid department/branch: "${department}".` });
      }
      branchRef = branchDoc._id;
    }

    const newAdmin = new Admin({
      name: name.trim(),
      email: normalizedEmail,
      role: targetRole,
      department: targetRole === 'SUPER_ADMIN' ? null : branchRef,
      permissions: targetRole === 'SUPER_ADMIN' ? { ...SUPER_ADMIN_PERMISSIONS } : (permissions || {}),
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      createdBy: req.admin?.name || req.admin?.email || 'Super Admin'
    });

    await newAdmin.save();
    await newAdmin.populate('department', 'name shortName');

    logActivity({
      req,
      action: 'CREATE',
      resourceType: 'ADMIN',
      resourceId: newAdmin._id,
      department: newAdmin.department?._id || newAdmin.department,
      metadata: {
        title: `${newAdmin.name} (${newAdmin.role})`,
        extra: {
          email: newAdmin.email,
          role: newAdmin.role
        }
      }
    });

    res.status(201).json({
      message: `Admin "${newAdmin.name}" created successfully.`,
      admin: newAdmin
    });
  } catch (err) {
    console.error('createAdmin error:', err);
    res.status(500).json({ error: err.message || 'Server error creating admin' });
  }
};

// PUT /api/admin/admins/:id - Update admin details
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, department, permissions, status } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const targetRole = role || admin.role;

    // Safety check: Cannot demote last active Super Admin
    if (admin.role === 'SUPER_ADMIN' && targetRole === 'ADMIN') {
      const activeSuperCount = await Admin.countDocuments({ role: 'SUPER_ADMIN', status: 'ACTIVE' });
      if (activeSuperCount <= 1) {
        return res.status(400).json({
          error: 'Cannot demote the last active Super Admin. Minimum 1 active Super Admin must remain.'
        });
      }
    }

    // Safety check: Cannot promote to 4th Super Admin
    if (admin.role === 'ADMIN' && targetRole === 'SUPER_ADMIN') {
      const superCount = await Admin.countDocuments({ role: 'SUPER_ADMIN' });
      if (superCount >= 3) {
        return res.status(400).json({
          error: 'Maximum limit of 3 Super Admins reached. Cannot promote another admin to Super Admin.'
        });
      }
    }

    // Safety check: Cannot deactivate last active Super Admin
    if (admin.role === 'SUPER_ADMIN' && status === 'INACTIVE' && admin.status === 'ACTIVE') {
      const otherActiveSuper = await Admin.countDocuments({
        _id: { $ne: id },
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      });
      if (otherActiveSuper === 0) {
        return res.status(400).json({
          error: 'Cannot deactivate the last remaining active Super Admin.'
        });
      }
    }

    let branchRef = admin.department;
    if (targetRole === 'ADMIN') {
      if (department) {
        let branchDoc = null;
        if (typeof department === 'string' && department.match(/^[0-9a-fA-F]{24}$/)) {
          branchDoc = await Branch.findById(department);
        } else if (typeof department === 'string') {
          branchDoc = await Branch.findOne({ shortName: department.trim().toUpperCase() });
        } else if (department?._id) {
          branchDoc = await Branch.findById(department._id);
        }

        if (!branchDoc) {
          return res.status(400).json({ error: `Invalid department/branch.` });
        }
        branchRef = branchDoc._id;
      } else if (!admin.department) {
        return res.status(400).json({ error: 'Department is required for normal administrators.' });
      }
    } else {
      branchRef = null;
    }

    const changes = {};
    if (name && name.trim() !== admin.name) {
      changes.name = { old: admin.name, new: name.trim() };
      admin.name = name.trim();
    }
    if (targetRole !== admin.role) {
      changes.role = { old: admin.role, new: targetRole };
      admin.role = targetRole;
    }
    if (String(branchRef || '') !== String(admin.department || '')) {
      changes.department = { old: admin.department, new: branchRef };
      admin.department = branchRef;
    }
    if (status && status !== admin.status) {
      changes.status = { old: admin.status, new: status };
      admin.status = status;
    }

    admin.permissions = targetRole === 'SUPER_ADMIN' ? { ...SUPER_ADMIN_PERMISSIONS } : (permissions || admin.permissions);
    admin.updatedBy = req.admin?.name || req.admin?.email || 'Super Admin';

    await admin.save();
    await admin.populate('department', 'name shortName');

    if (Object.keys(changes).length > 0) {
      logActivity({
        req,
        action: 'UPDATE',
        resourceType: 'ADMIN',
        resourceId: admin._id,
        department: admin.department?._id || admin.department,
        metadata: {
          title: `${admin.name} (${admin.role})`,
          changes
        }
      });
    }

    res.status(200).json({
      message: `Admin "${admin.name}" updated successfully.`,
      admin
    });
  } catch (err) {
    console.error('updateAdmin error:', err);
    res.status(500).json({ error: err.message || 'Server error updating admin' });
  }
};

// PATCH /api/admin/admins/:id/status - Toggle status
const toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const nextStatus = status || (admin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');

    if (admin.role === 'SUPER_ADMIN' && nextStatus === 'INACTIVE') {
      const otherActiveSuper = await Admin.countDocuments({
        _id: { $ne: id },
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      });
      if (otherActiveSuper === 0) {
        return res.status(400).json({
          error: 'Cannot disable the last remaining active Super Admin.'
        });
      }
    }

    admin.status = nextStatus;
    admin.updatedBy = req.admin?.name || req.admin?.email || 'Super Admin';
    await admin.save();
    await admin.populate('department', 'name shortName');

    logActivity({
      req,
      action: nextStatus === 'ACTIVE' ? 'ENABLE' : 'DISABLE',
      resourceType: 'ADMIN',
      resourceId: admin._id,
      department: admin.department?._id || admin.department,
      metadata: {
        title: `${admin.name} (${admin.role})`,
        extra: { newStatus: nextStatus }
      }
    });

    res.status(200).json({
      message: `Admin "${admin.name}" status changed to ${nextStatus}.`,
      admin
    });
  } catch (err) {
    console.error('toggleAdminStatus error:', err);
    res.status(500).json({ error: err.message || 'Server error changing admin status' });
  }
};

// DELETE /api/admin/admins/:id - Delete an admin
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (admin.role === 'SUPER_ADMIN') {
      const activeSuperCount = await Admin.countDocuments({ role: 'SUPER_ADMIN', status: 'ACTIVE' });
      if (activeSuperCount <= 1) {
        return res.status(400).json({
          error: 'Cannot delete the last remaining active Super Admin.'
        });
      }
    }

    await Admin.findByIdAndDelete(id);

    logActivity({
      req,
      action: 'DELETE',
      resourceType: 'ADMIN',
      resourceId: admin._id,
      department: admin.department?._id || admin.department,
      metadata: {
        title: `${admin.name} (${admin.role})`,
        extra: { email: admin.email }
      }
    });

    res.status(200).json({
      message: `Admin "${admin.name}" (${admin.email}) deleted successfully.`
    });
  } catch (err) {
    console.error('deleteAdmin error:', err);
    res.status(500).json({ error: err.message || 'Server error deleting admin' });
  }
};

// GET /api/admin/admins/activities - Paginated global audit logs (Super Admin)
const getActivityLogs = async (req, res) => {
  try {
    const { page, limit, adminId, action, resourceType, department, search, startDate, endDate } = req.query;
    const result = await adminActivityService.getActivityLogs({
      page,
      limit,
      adminId,
      action,
      resourceType,
      department,
      search,
      startDate,
      endDate
    });
    res.status(200).json(result);
  } catch (err) {
    console.error('getActivityLogs error:', err);
    res.status(500).json({ error: 'Server error fetching activity logs' });
  }
};

// GET /api/admin/admins/leaderboard - Global contribution leaderboard (Super Admin)
const getLeaderboard = async (req, res) => {
  try {
    const { timeRange = 'all' } = req.query;
    const leaderboard = await adminActivityService.getLeaderboard(timeRange);
    res.status(200).json({ timeRange, leaderboard });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
};

// GET /api/admin/admins/:id/profile - Admin profile drawer data
const getAdminProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeRange = 'all' } = req.query;

    const admin = await Admin.findById(id).populate('department', 'name shortName code').lean();
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const [contributions, recentActivities] = await Promise.all([
      adminActivityService.getAdminContributionStats(admin._id, timeRange),
      AdminActivity.find({ adminId: admin._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
    ]);

    res.status(200).json({
      admin,
      contributions,
      recentActivities
    });
  } catch (err) {
    console.error('getAdminProfile error:', err);
    res.status(500).json({ error: 'Server error fetching admin profile' });
  }
};

module.exports = {
  listAdmins,
  createAdmin,
  updateAdmin,
  toggleAdminStatus,
  deleteAdmin,
  getActivityLogs,
  getLeaderboard,
  getAdminProfile
};
