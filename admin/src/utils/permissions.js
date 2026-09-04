/**
 * Utility helpers to verify admin permissions across modules.
 * Super Admins (role === 'SUPER_ADMIN' or isSuperAdmin === true) bypass all module checks.
 */

export const isSuperAdmin = (admin) => {
  if (!admin) return false;
  return admin.isSuperAdmin === true || admin.role === 'SUPER_ADMIN';
};

export const hasPermission = (admin, moduleKey, actionKey) => {
  if (!admin) return false;
  if (isSuperAdmin(admin)) return true;

  const permissions = admin.permissions;
  if (!permissions) {
    // If no explicit permissions object exists, default view to true, others to false
    return actionKey === 'view';
  }

  const modulePerms = permissions[moduleKey];
  if (!modulePerms) {
    return actionKey === 'view';
  }

  // Check explicit boolean in module permissions
  if (typeof modulePerms[actionKey] === 'boolean') {
    return modulePerms[actionKey];
  }

  return actionKey === 'view';
};

export const canManageMaterials = (admin) => {
  return {
    canView: hasPermission(admin, 'materials', 'view'),
    canCreate: hasPermission(admin, 'materials', 'create'),
    canUpdate: hasPermission(admin, 'materials', 'update'),
    canDelete: hasPermission(admin, 'materials', 'delete'),
    canPublish: hasPermission(admin, 'materials', 'publish'),
    canArchive: hasPermission(admin, 'materials', 'archive')
  };
};

export const canManageSubjects = (admin) => {
  return {
    canView: hasPermission(admin, 'subjects', 'view'),
    canCreate: hasPermission(admin, 'subjects', 'create'),
    canUpdate: hasPermission(admin, 'subjects', 'update'),
    canDelete: hasPermission(admin, 'subjects', 'delete')
  };
};

export const canManageUsers = (admin) => {
  return {
    canView: hasPermission(admin, 'users', 'view'),
    canCreate: hasPermission(admin, 'users', 'create'),
    canUpdate: hasPermission(admin, 'users', 'update'),
    canDelete: hasPermission(admin, 'users', 'delete')
  };
};

export const canManageQueries = (admin) => {
  return {
    canView: hasPermission(admin, 'queries', 'view'),
    canRespond: hasPermission(admin, 'queries', 'respond'),
    canResolve: hasPermission(admin, 'queries', 'resolve'),
    canDelete: hasPermission(admin, 'queries', 'delete')
  };
};

export const canManageRequests = (admin) => {
  return {
    canView: hasPermission(admin, 'requests', 'view'),
    canApprove: hasPermission(admin, 'requests', 'approve'),
    canReject: hasPermission(admin, 'requests', 'reject')
  };
};
