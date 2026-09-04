const Admin = require('../models/Admin');

/**
 * Ensures the authenticated user is an active Administrator.
 * Binds fresh admin details (role, department, permissions) from MongoDB.
 */
const requireAdmin = async (req, res, next) => {
  try {
    // If already resolved by authMiddleware with full Branch population
    if (req.admin && req.admin.status === 'ACTIVE' && req.admin.department !== undefined) {
      return next();
    }

    const email = (req.user?.email || req.adminEmail || req.userEmail || '').toLowerCase().trim();
    if (!email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Always fetch fresh from database as the source of truth
    const admin = await Admin.findOne({ email }).populate('department');
    if (!admin) {
      return res.status(403).json({ error: 'Administrator access required' });
    }

    if (admin.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Administrator account is disabled. Please contact a Super Administrator.'
      });
    }

    req.admin = admin;
    req.isAdmin = true;
    req.isSuperAdmin = admin.role === 'SUPER_ADMIN';
    req.adminRole = admin.role;
    req.adminDepartment = admin.department || null;
    req.adminDepartmentId = admin.department?._id || null;
    req.adminDepartmentCode = admin.department?.shortName || null;
    req.adminPermissions = admin.permissions || {};

    next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    res.status(500).json({ error: 'Server authorization error' });
  }
};

/**
 * Ensures the user has SUPER_ADMIN role.
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.isAdmin || !req.isSuperAdmin) {
    return res.status(403).json({
      error: 'Super Admin access required. This action is restricted to Super Administrators.'
    });
  }
  next();
};

/**
 * Factory middleware to enforce granular, action-based module permissions.
 * Super Admins automatically bypass permission checks.
 * @param {string} permissionKey - e.g. "materials.update", "materials.publish", "subjects.create", "queries.respond"
 */
const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    // Super Admins have unrestricted access across all modules
    if (req.isSuperAdmin) {
      return next();
    }

    if (!req.admin || req.admin.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Active administrator privileges required' });
    }

    // Traverse permissions object (e.g. "materials.publish" -> permissions.materials.publish)
    const parts = permissionKey.split('.');
    let current = req.adminPermissions || {};
    for (const part of parts) {
      current = current?.[part];
    }

    if (current === true) {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden: You do not have '${permissionKey}' permission to perform this action.`
    });
  };
};

/**
 * Middleware that strictly confines a normal Admin to their assigned department.
 * Uses the Branch model as the source of truth.
 * Overrides any manipulated client query or body parameters.
 * Super Admins bypass department confinement and can view/filter all departments.
 */
const enforceDepartmentScope = (req, res, next) => {
  if (req.isSuperAdmin) {
    req.departmentScope = null; // Unrestricted across all departments
    return next();
  }

  const deptCode = req.adminDepartmentCode || req.admin?.department?.shortName;
  const deptId = req.adminDepartmentId || req.admin?.department?._id;

  if (!deptCode) {
    return res.status(403).json({
      error: 'Admin is not assigned to a valid department. Contact a Super Administrator.'
    });
  }

  req.departmentScope = { code: deptCode, id: deptId };

  // Force department scope on query parameters regardless of client input
  req.query.branch = deptCode;
  req.query.department = deptCode;

  // Force department scope on creation/mutation requests
  if (req.body && typeof req.body === 'object') {
    req.body.branch = deptCode;
    req.body.department = deptCode;
    if (deptId) {
      req.body.branchId = deptId;
    }
  }

  next();
};

module.exports = {
  requireAdmin,
  requireSuperAdmin,
  requirePermission,
  enforceDepartmentScope
};
