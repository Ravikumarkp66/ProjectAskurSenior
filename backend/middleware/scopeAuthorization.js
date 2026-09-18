/**
 * Server-Side Scope & Role-Based Authorization Middleware
 * Enforces: Access = Role + Scope + Permissions
 * Defends against IDOR and out-of-scope administrative access across colleges, branches, and sections.
 */

/**
 * Checks if admin's assigned scopes satisfy the target resource academic context.
 * Supports wildcards when higher-level attributes are omitted (e.g. HoD with sections: []).
 * 
 * @param {Array} adminScopes - Array of scope objects assigned to the admin
 * @param {Object} target - The targeted academic context
 * @returns {boolean}
 */
function isScopeMatching(adminScopes, target) {
    if (!Array.isArray(adminScopes) || adminScopes.length === 0) {
        return false;
    }

    if (!target || !target.collegeId) {
        return false;
    }

    const targetCollege = String(target.collegeId);
    const targetProgram = target.programId ? String(target.programId) : null;
    const targetBranch = target.branchId ? String(target.branchId) : null;
    const targetBatch = target.batchId ? String(target.batchId) : null;
    const targetSemester = target.semester != null ? Number(target.semester) : null;
    const targetSection = target.sectionId ? String(target.sectionId) : null;

    return adminScopes.some(scope => {
        // College match is always mandatory
        if (!scope.college || String(scope.college._id || scope.college) !== targetCollege) {
            return false;
        }

        // If scope specifies a program, target must match
        if (scope.program) {
            const scopeProg = String(scope.program._id || scope.program);
            if (targetProgram && scopeProg !== targetProgram) {
                return false;
            }
        }

        // If scope specifies a branch, target must match
        if (scope.branch) {
            const scopeBranch = String(scope.branch._id || scope.branch);
            if (targetBranch && scopeBranch !== targetBranch) {
                return false;
            }
        }

        // If scope specifies a batch, target must match
        if (scope.batch) {
            const scopeBatch = String(scope.batch._id || scope.batch);
            if (targetBatch && scopeBatch !== targetBatch) {
                return false;
            }
        }

        // If scope specifies a semester, target must match
        if (scope.semester != null) {
            if (targetSemester != null && Number(scope.semester) !== targetSemester) {
                return false;
            }
        }

        // If scope specifies specific sections, target section must be included
        if (Array.isArray(scope.sections) && scope.sections.length > 0) {
            if (targetSection) {
                const allowedSections = scope.sections.map(s => String(s._id || s));
                if (!allowedSections.includes(targetSection)) {
                    return false;
                }
            }
        }

        return true;
    });
}

/**
 * Checks if admin's permission flags grant the required action on the module.
 * 
 * @param {Object} permissions 
 * @param {string} module 
 * @param {string} action 
 * @returns {boolean}
 */
function hasPermission(permissions, module, action) {
    if (!permissions || !module || !action) {
        return false;
    }
    const modulePerms = permissions[module];
    if (!modulePerms) {
        return false;
    }
    return Boolean(modulePerms[action]);
}

/**
 * Universal access evaluation for an admin against a target context and required permission.
 * 
 * @param {Object} admin - Admin document with role, scopes, and permissions
 * @param {Object} targetContext - Target academic context
 * @param {string} module - Academic module name (e.g. 'timetable', 'subjects')
 * @param {string} action - Action verb (e.g. 'view', 'create', 'update', 'publish')
 * @returns {{ allowed: boolean, reason?: string }}
 */
function validateAdminAccess(admin, targetContext, module, action) {
    if (!admin) {
        return { allowed: false, reason: 'Authentication required' };
    }

    // Super Admin has unrestricted platform-wide access
    if (admin.role === 'SUPER_ADMIN') {
        return { allowed: true };
    }

    if (admin.role !== 'ADMIN') {
        return { allowed: false, reason: 'Invalid administrative role' };
    }

    // Verify module action permission
    if (module && action) {
        if (!hasPermission(admin.permissions, module, action)) {
            return {
                allowed: false,
                reason: `Missing required permission: ${module}.${action}`
            };
        }
    }

    // Verify institutional scope
    if (targetContext) {
        if (!isScopeMatching(admin.scopes, targetContext)) {
            return {
                allowed: false,
                reason: 'Out of authorized administrative scope'
            };
        }
    }

    return { allowed: true };
}

/**
 * Express Middleware generator enforcing scope and permission checks.
 * 
 * @param {Object} options
 * @param {string} [options.module] - e.g. 'timetable'
 * @param {string} [options.action] - e.g. 'publish'
 * @param {Function} [options.getTargetContext] - Custom extractor (req) => targetContext
 */
function requireScope(options = {}) {
    const { module, action, getTargetContext } = options;

    return async (req, res, next) => {
        const admin = req.admin || req.user;

        // Resolve target context from helper or standard request locations
        let targetContext = null;
        if (typeof getTargetContext === 'function') {
            try {
                targetContext = await getTargetContext(req);
                if (targetContext === null) {
                    return res.status(404).json({
                        success: false,
                        error: 'Target resource not found'
                    });
                }
            } catch (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message || 'Error resolving resource scope'
                });
            }
        } else {
            targetContext = {
                collegeId: req.params.collegeId || req.body.collegeId || req.query.collegeId,
                programId: req.params.programId || req.body.programId || req.query.programId,
                branchId: req.params.branchId || req.body.branchId || req.query.branchId,
                batchId: req.params.batchId || req.body.batchId || req.query.batchId,
                semester: req.params.semester || req.body.semester || req.query.semester,
                sectionId: req.params.sectionId || req.body.sectionId || req.query.sectionId
            };
        }

        const accessResult = validateAdminAccess(admin, targetContext, module, action);

        if (!accessResult.allowed) {
            return res.status(403).json({
                success: false,
                error: accessResult.reason || 'Forbidden: Access denied',
                requiredScope: targetContext
            });
        }

        req.academicContext = targetContext;
        return next();
    };
}

module.exports = {
    isScopeMatching,
    hasPermission,
    validateAdminAccess,
    requireScope
};
