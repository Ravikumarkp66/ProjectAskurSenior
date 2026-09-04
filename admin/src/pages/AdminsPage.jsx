import React, { useState, useEffect } from 'react';
import adminManagementService from '../services/adminManagementService';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminProfileDrawer from '../components/admin/AdminProfileDrawer';
import AdminActivityLogsTab from '../components/admin/AdminActivityLogsTab';
import AdminLeaderboardTab from '../components/admin/AdminLeaderboardTab';
import ActivityDiffModal from '../components/admin/ActivityDiffModal';

const MODULE_PERMISSIONS = {
  users: [
    { key: 'view', label: 'View' },
    { key: 'create', label: 'Create' },
    { key: 'update', label: 'Update' },
    { key: 'delete', label: 'Delete' }
  ],
  subjects: [
    { key: 'view', label: 'View' },
    { key: 'create', label: 'Create' },
    { key: 'update', label: 'Update' },
    { key: 'delete', label: 'Delete' }
  ],
  materials: [
    { key: 'view', label: 'View' },
    { key: 'create', label: 'Create' },
    { key: 'update', label: 'Update' },
    { key: 'delete', label: 'Delete' },
    { key: 'publish', label: 'Publish' },
    { key: 'archive', label: 'Archive' }
  ],
  queries: [
    { key: 'view', label: 'View' },
    { key: 'respond', label: 'Respond' },
    { key: 'resolve', label: 'Resolve' },
    { key: 'delete', label: 'Delete' }
  ],
  requests: [
    { key: 'view', label: 'View' },
    { key: 'approve', label: 'Approve' },
    { key: 'reject', label: 'Reject' }
  ]
};

const DEFAULT_PERMISSIONS = {
  users: { view: true, create: false, update: false, delete: false },
  subjects: { view: true, create: false, update: false, delete: false },
  materials: { view: true, create: false, update: false, delete: false, publish: false, archive: false },
  queries: { view: true, respond: false, resolve: false, delete: false },
  requests: { view: true, approve: false, reject: false }
};

export default function AdminsPage() {
  const { admin: currentAdmin } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({ total: 0, superAdmins: 0, maxSuperAdmins: 3, active: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Tab State: 'directory' | 'activities' | 'leaderboard'
  const [activeTab, setActiveTab] = useState('directory');
  const [drawerAdminId, setDrawerAdminId] = useState(null);
  const [diffModalActivity, setDiffModalActivity] = useState(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'ADMIN',
    department: '',
    status: 'ACTIVE',
    permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS))
  });

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminManagementService.getAdmins();
      setAdmins(data.admins || []);
      setBranches(data.branches || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
      setError(err.response?.data?.error || 'Failed to load administrators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openAddModal = () => {
    const defaultBranch = branches[0]?._id || '';
    setFormData({
      name: '',
      email: '',
      role: 'ADMIN',
      department: defaultBranch,
      status: 'ACTIVE',
      permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS))
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      role: admin.role || 'ADMIN',
      department: admin.department?._id || admin.department || '',
      status: admin.status || 'ACTIVE',
      permissions: admin.permissions ? JSON.parse(JSON.stringify(admin.permissions)) : JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS))
    });
    setIsEditModalOpen(true);
  };

  const handlePermissionToggle = (moduleKey, actionKey) => {
    setFormData((prev) => {
      const currentModule = prev.permissions[moduleKey] || {};
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleKey]: {
            ...currentModule,
            [actionKey]: !currentModule[actionKey]
          }
        }
      };
    });
  };

  const handleSelectAllModule = (moduleKey, value) => {
    setFormData((prev) => {
      const currentModule = prev.permissions[moduleKey] || {};
      const updatedModule = {};
      MODULE_PERMISSIONS[moduleKey].forEach((act) => {
        updatedModule[act.key] = value;
      });
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleKey]: updatedModule
        }
      };
    });
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.role === 'SUPER_ADMIN' ? null : formData.department,
        status: formData.status,
        permissions: formData.permissions
      };
      const res = await adminManagementService.createAdmin(payload);
      setActionMessage(res.message || 'Admin created successfully.');
      setIsAddModalOpen(false);
      fetchAdmins();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formData.name,
        role: formData.role,
        department: formData.role === 'SUPER_ADMIN' ? null : formData.department,
        status: formData.status,
        permissions: formData.permissions
      };
      const res = await adminManagementService.updateAdmin(selectedAdmin._id, payload);
      setActionMessage(res.message || 'Admin updated successfully.');
      setIsEditModalOpen(false);
      fetchAdmins();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    const nextStatus = admin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmMsg = admin.status === 'ACTIVE'
      ? `Disable administrator "${admin.name}" (${admin.email})? They will lose admin portal access immediately.`
      : `Reactivate administrator "${admin.name}" (${admin.email})?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminManagementService.toggleStatus(admin._id, nextStatus);
      setActionMessage(res.message || `Admin status changed to ${nextStatus}.`);
      fetchAdmins();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change admin status.');
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm(`Permanently delete administrator "${admin.name}" (${admin.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await adminManagementService.deleteAdmin(admin._id);
      setActionMessage(res.message || 'Admin deleted successfully.');
      fetchAdmins();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete administrator.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? 'Never'
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-6">
      {/* CSES Dense Header */}
      <div className="border-b border-gray-200 pb-3 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 font-mono">
              Admins
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Manage administrators, roles, department scopes, and action permissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition"
            >
              + Add Admin
            </button>
          </div>
        </div>

        {/* CSES Inline Metrics */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-zinc-400 font-mono">
          <span>Total: <strong className="text-gray-900 dark:text-zinc-100">{stats.total}</strong></span>
          <span className="text-gray-300 dark:text-zinc-700">|</span>
          <span>
            Super Admins: <strong className="text-blue-600 dark:text-blue-400">{stats.superAdmins}/{stats.maxSuperAdmins}</strong>
          </span>
          <span className="text-gray-300 dark:text-zinc-700">|</span>
          <span>
            Department Admins: <strong className="text-gray-900 dark:text-zinc-100">{stats.total - stats.superAdmins}</strong>
          </span>
          <span className="text-gray-300 dark:text-zinc-700">|</span>
          <span>Active: <strong className="text-emerald-600 dark:text-emerald-400">{stats.active}</strong></span>
        </div>
        {/* CSES Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 mt-3 border-b border-gray-200 dark:border-zinc-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('directory')}
            className={`py-2 px-3 border-b-2 font-semibold transition ${
              activeTab === 'directory'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            All Admins ({admins.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`py-2 px-3 border-b-2 font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'activities'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span>Activity Logs</span>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-2 px-3 border-b-2 font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span>Contributions & Leaderboard</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div className="mt-3 p-2 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 font-mono">
          ✓ {actionMessage}
        </div>
      )}
      {error && (
        <div className="mt-3 p-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 font-mono">
          ✕ {error}
        </div>
      )}

      {/* TAB 1: ALL ADMINS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="mt-4 border border-gray-200 dark:border-zinc-800 rounded overflow-hidden bg-white dark:bg-[#121212]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 dark:bg-zinc-900/50 dark:border-zinc-800 text-gray-500 dark:text-zinc-400">
                <tr>
                  <th className="py-2 px-3 w-10 text-center">#</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3 text-right">Contributions</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3">Last Login</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-gray-400 dark:text-zinc-500">
                      Loading administrators...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-gray-400 dark:text-zinc-500">
                      No administrators found.
                    </td>
                  </tr>
                ) : (
                  admins.map((adm, idx) => {
                    const isSuper = adm.role === 'SUPER_ADMIN';
                    const isActive = adm.status === 'ACTIVE';
                    const deptDisplay = isSuper
                      ? 'All Departments (Unrestricted)'
                      : (adm.department?.shortName
                          ? `${adm.department.shortName} - ${adm.department.name}`
                          : (adm.department || 'Not Assigned'));

                    return (
                      <tr
                        key={adm._id}
                        className="hover:bg-gray-50/75 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <td className="py-2 px-3 text-center text-gray-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => setDrawerAdminId(adm._id)}
                            className="font-semibold text-gray-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 text-left transition"
                            title="Click to view profile & activity"
                          >
                            {adm.name}
                          </button>
                          {currentAdmin?.email?.toLowerCase() === adm.email?.toLowerCase() && (
                            <span className="ml-1.5 px-1 py-0.2 bg-blue-100 text-blue-700 text-[10px] rounded dark:bg-blue-900/50 dark:text-blue-300">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-zinc-300">{adm.email}</td>
                        <td className="py-2 px-3">
                          {isSuper ? (
                            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              SUPER ADMIN
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                              ADMIN
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-700 dark:text-zinc-300">
                          {deptDisplay}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => setDrawerAdminId(adm._id)}
                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded text-[11px] font-bold transition"
                            title="View contribution breakdown"
                          >
                            {adm.contributionsCount || 0}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-500 dark:text-zinc-400 text-[11px]">
                          {formatDate(adm.lastLogin)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setDrawerAdminId(adm._id)}
                              className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200 underline underline-offset-2"
                            >
                              Profile
                            </button>
                            <span className="text-gray-300 dark:text-zinc-700">|</span>
                            <button
                              onClick={() => openEditModal(adm)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2"
                            >
                              Edit
                            </button>
                            <span className="text-gray-300 dark:text-zinc-700">|</span>
                            <button
                              onClick={() => handleToggleStatus(adm)}
                              className={
                                isActive
                                  ? 'text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300'
                                  : 'text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300'
                              }
                            >
                              {isActive ? 'Disable' : 'Enable'}
                            </button>
                            <span className="text-gray-300 dark:text-zinc-700">|</span>
                            <button
                              onClick={() => handleDeleteAdmin(adm)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVITY LOGS */}
      {activeTab === 'activities' && (
        <div className="mt-4">
          <AdminActivityLogsTab
            branches={branches}
            onOpenDiffModal={(activity) => setDiffModalActivity(activity)}
          />
        </div>
      )}

      {/* TAB 3: CONTRIBUTIONS & LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="mt-4">
          <AdminLeaderboardTab
            onSelectAdmin={(id) => setDrawerAdminId(id)}
          />
        </div>
      )}

      {/* ADD ADMIN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-700 rounded shadow-xl max-h-[90vh] flex flex-col font-mono text-xs">
            <div className="p-3 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center bg-gray-50 dark:bg-zinc-900">
              <h2 className="font-bold text-gray-900 dark:text-zinc-100">
                + Add Administrator
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-base leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-4 overflow-y-auto space-y-4 flex-1">
              {error && (
                <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded dark:bg-red-950/40 dark:text-red-400 dark:border-red-800">
                  ✕ {error}
                </div>
              )}

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-zinc-300 font-semibold mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-zinc-300 font-semibold mb-1">
                    Gmail / Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Admin does not need to pre-exist as a student. They will be recognized automatically when logging in with this Gmail.
                  </p>
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-zinc-300 font-semibold mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="ADMIN">ADMIN (Department Scoped)</option>
                    <option
                      value="SUPER_ADMIN"
                      disabled={stats.superAdmins >= 3}
                    >
                      SUPER_ADMIN (Unrestricted - {stats.superAdmins}/3 used)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-zinc-300 font-semibold mb-1">
                    Department {formData.role === 'ADMIN' && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    disabled={formData.role === 'SUPER_ADMIN'}
                    required={formData.role === 'ADMIN'}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none disabled:opacity-50"
                  >
                    {formData.role === 'SUPER_ADMIN' ? (
                      <option value="">All Departments (Unrestricted)</option>
                    ) : (
                      branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.shortName} - {b.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Modular Action Permissions */}
              <div className="border-t border-gray-200 dark:border-zinc-700 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-900 dark:text-zinc-100 font-bold uppercase tracking-wider text-[11px]">
                    Module Permissions
                  </label>
                  {formData.role === 'SUPER_ADMIN' && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                      Super Admins have full unrestricted permissions across all modules
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {Object.entries(MODULE_PERMISSIONS).map(([modKey, actions]) => {
                    const modPerms = formData.permissions[modKey] || {};
                    const isSuper = formData.role === 'SUPER_ADMIN';

                    return (
                      <div
                        key={modKey}
                        className="p-2.5 bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 rounded"
                      >
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-1.5 mb-2">
                          <span className="font-bold uppercase text-gray-800 dark:text-zinc-200">
                            {modKey}
                          </span>
                          {!isSuper && (
                            <div className="flex gap-2 text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleSelectAllModule(modKey, true)}
                                className="text-blue-600 hover:underline"
                              >
                                Select All
                              </button>
                              <span className="text-gray-300 dark:text-zinc-700">|</span>
                              <button
                                type="button"
                                onClick={() => handleSelectAllModule(modKey, false)}
                                className="text-gray-500 hover:underline"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {actions.map((act) => {
                            const isChecked = isSuper ? true : !!modPerms[act.key];
                            return (
                              <label
                                key={act.key}
                                className={`flex items-center gap-1.5 cursor-pointer ${
                                  isSuper ? 'cursor-not-allowed opacity-75' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={isSuper}
                                  checked={isChecked}
                                  onChange={() => handlePermissionToggle(modKey, act.key)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-0"
                                />
                                <span className="text-gray-700 dark:text-zinc-300">{act.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="border-t border-gray-200 dark:border-zinc-700 pt-3">
                <label className="block text-gray-700 dark:text-zinc-300 font-semibold mb-1">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="ACTIVE"
                      checked={formData.status === 'ACTIVE'}
                      onChange={() => setFormData({ ...formData, status: 'ACTIVE' })}
                    />
                    <span className="text-emerald-600 font-semibold">Active</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="INACTIVE"
                      checked={formData.status === 'INACTIVE'}
                      onChange={() => setFormData({ ...formData, status: 'INACTIVE' })}
                    />
                    <span className="text-red-600 font-semibold">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="border-t border-gray-200 dark:border-zinc-700 pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-zinc-700 rounded text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN MODAL */}
      {isEditModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-700 rounded shadow-xl max-h-[90vh] flex flex-col font-mono text-xs">
            <div className="p-3 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center bg-gray-50 dark:bg-zinc-900">
              <h2 className="font-bold text-gray-900 dark:text-zinc-100">
                Edit Administrator: {selectedAdmin.name}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-base leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="p-4 overflow-y-auto space-y-4 flex-1">
              {error && (
                <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded dark:bg-red-950/40 dark:text-red-400 dark:border-red-800">
                  ✕ {error}
                </div>
              )}

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-zinc-300 font-semibold mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-zinc-300 font-semibold mb-1">
                    Email (Identity anchor - read only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-zinc-300 font-semibold mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="ADMIN">ADMIN (Department Scoped)</option>
                    <option
                      value="SUPER_ADMIN"
                      disabled={selectedAdmin.role !== 'SUPER_ADMIN' && stats.superAdmins >= 3}
                    >
                      SUPER_ADMIN (Unrestricted)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-zinc-300 font-semibold mb-1">
                    Department {formData.role === 'ADMIN' && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    disabled={formData.role === 'SUPER_ADMIN'}
                    required={formData.role === 'ADMIN'}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none disabled:opacity-50"
                  >
                    {formData.role === 'SUPER_ADMIN' ? (
                      <option value="">All Departments (Unrestricted)</option>
                    ) : (
                      branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.shortName} - {b.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Modular Permissions */}
              <div className="border-t border-gray-200 dark:border-zinc-700 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-900 dark:text-zinc-100 font-bold uppercase tracking-wider text-[11px]">
                    Module Permissions
                  </label>
                  {formData.role === 'SUPER_ADMIN' && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                      Super Admins have full unrestricted permissions across all modules
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {Object.entries(MODULE_PERMISSIONS).map(([modKey, actions]) => {
                    const modPerms = formData.permissions[modKey] || {};
                    const isSuper = formData.role === 'SUPER_ADMIN';

                    return (
                      <div
                        key={modKey}
                        className="p-2.5 bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 rounded"
                      >
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-1.5 mb-2">
                          <span className="font-bold uppercase text-gray-800 dark:text-zinc-200">
                            {modKey}
                          </span>
                          {!isSuper && (
                            <div className="flex gap-2 text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleSelectAllModule(modKey, true)}
                                className="text-blue-600 hover:underline"
                              >
                                Select All
                              </button>
                              <span className="text-gray-300 dark:text-zinc-700">|</span>
                              <button
                                type="button"
                                onClick={() => handleSelectAllModule(modKey, false)}
                                className="text-gray-500 hover:underline"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {actions.map((act) => {
                            const isChecked = isSuper ? true : !!modPerms[act.key];
                            return (
                              <label
                                key={act.key}
                                className={`flex items-center gap-1.5 cursor-pointer ${
                                  isSuper ? 'cursor-not-allowed opacity-75' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={isSuper}
                                  checked={isChecked}
                                  onChange={() => handlePermissionToggle(modKey, act.key)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-0"
                                />
                                <span className="text-gray-700 dark:text-zinc-300">{act.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="border-t border-gray-200 dark:border-zinc-700 pt-3">
                <label className="block text-gray-700 dark:text-zinc-300 font-semibold mb-1">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="ACTIVE"
                      checked={formData.status === 'ACTIVE'}
                      onChange={() => setFormData({ ...formData, status: 'ACTIVE' })}
                    />
                    <span className="text-emerald-600 font-semibold">Active</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="INACTIVE"
                      checked={formData.status === 'INACTIVE'}
                      onChange={() => setFormData({ ...formData, status: 'INACTIVE' })}
                    />
                    <span className="text-red-600 font-semibold">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="border-t border-gray-200 dark:border-zinc-700 pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-zinc-700 rounded text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PROFILE DRAWER */}
      {drawerAdminId && (
        <AdminProfileDrawer
          adminId={drawerAdminId}
          onClose={() => setDrawerAdminId(null)}
          onOpenDiffModal={(act) => setDiffModalActivity(act)}
        />
      )}

      {/* ACTIVITY DIFF MODAL */}
      {diffModalActivity && (
        <ActivityDiffModal
          activity={diffModalActivity}
          onClose={() => setDiffModalActivity(null)}
        />
      )}
    </div>
  );
}
