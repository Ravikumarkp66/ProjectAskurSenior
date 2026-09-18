import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { isSuperAdmin, hasPermission } from '../utils/permissions';
import subjectService from '../services/subjectService';
import evaluationGroupService from '../services/evaluationGroupService';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  CheckSquare,
  Square,
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const CATEGORIES = [
  { key: 'Theory', label: 'Theory Only', description: 'Subjects classified under the Theory category.' },
  { key: 'Theory + Lab', label: 'Theory + Lab', description: 'Subjects classified under the Theory + Lab category.' },
  { key: 'Lab Only', label: 'Lab Only', description: 'Subjects classified under the Lab Only category.' },
  { key: 'Practical', label: 'Practical', description: 'Subjects classified under the Practical category.' }
];

export const EvaluationGroupsPage = () => {
  const { admin } = useAdminAuth();
  const isSuper = isSuperAdmin(admin);
  const canView = isSuper || hasPermission(admin, 'subjects', 'view') || hasPermission(admin, 'academic_structure', 'view');
  const canManage = isSuper || hasPermission(admin, 'subjects', 'update') || hasPermission(admin, 'academic_structure', 'update');

  const [schemes, setSchemes] = useState([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedScheme, setSelectedScheme] = useState(null);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expanded categories / groups for subject inspection
  const [expandedGroups, setExpandedGroups] = useState({});

  // Modals
  // Create Modal: null | { category: string }
  const [createModal, setCreateModal] = useState(null);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Edit / Manage Subjects Modal: null | group object
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'Active', subjects: [] });
  const [categorySubjects, setCategorySubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete Modal: null | group object
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Load schemes on mount
  useEffect(() => {
    const loadSchemes = async () => {
      try {
        const res = await subjectService.getSchemes();
        const schemeList = Array.isArray(res) ? res : (res.data || res.schemes || []);
        setSchemes(schemeList);

        if (schemeList.length > 0) {
          // Prefer Scheme 2025 if available, else first active scheme
          const scheme2025 = schemeList.find((s) => s.year === 2025 || s.name?.includes('2025'));
          const defaultScheme = scheme2025 || schemeList.find((s) => s.status === 'Active') || schemeList[0];
          setSelectedSchemeId(defaultScheme._id);
          setSelectedScheme(defaultScheme);
        }
      } catch (err) {
        console.error('Failed to load schemes:', err);
        setError('Failed to load schemes.');
      }
    };
    loadSchemes();
  }, []);

  // Update selectedScheme object whenever selectedSchemeId changes
  useEffect(() => {
    if (selectedSchemeId && schemes.length > 0) {
      const found = schemes.find((s) => s._id === selectedSchemeId);
      setSelectedScheme(found || null);
    }
  }, [selectedSchemeId, schemes]);

  // Load evaluation groups for selected scheme
  const fetchGroups = useCallback(async () => {
    if (!selectedSchemeId || !canView) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await evaluationGroupService.getEvaluationGroups({ scheme: selectedSchemeId });
      setGroups(res.data || []);
    } catch (err) {
      console.error('Failed to load evaluation groups:', err);
      setError(err.response?.data?.error || 'Failed to load evaluation groups.');
    } finally {
      setLoading(false);
    }
  }, [selectedSchemeId, canView]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Grouping by category
  const groupsByCategory = useMemo(() => {
    const map = {
      'Theory': [],
      'Theory + Lab': [],
      'Lab Only': [],
      'Practical': []
    };
    groups.forEach((g) => {
      if (map[g.category]) {
        map[g.category].push(g);
      }
    });
    return map;
  }, [groups]);

  const [totalEligibleSubjects, setTotalEligibleSubjects] = useState(0);

  // Load scheme subject stats (total eligible subjects in scheme)
  useEffect(() => {
    const fetchSchemeSubjectCount = async () => {
      if (!selectedSchemeId) {
        setTotalEligibleSubjects(0);
        return;
      }
      try {
        const res = await subjectService.getSubjects({ scheme: selectedSchemeId, limit: 1 });
        setTotalEligibleSubjects(res.pagination?.total || 0);
      } catch (err) {
        console.error('Failed to load scheme subject count:', err);
      }
    };
    fetchSchemeSubjectCount();
  }, [selectedSchemeId]);

  // Total assigned subjects across all groups in selected scheme
  const totalAssignedSubjects = useMemo(() => {
    return groups.reduce(
      (sum, g) => sum + (Array.isArray(g.subjects) ? g.subjects.length : 0),
      0
    );
  }, [groups]);

  // Toggle group row subject preview
  const toggleGroupExpand = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Open Create Modal for a category
  const openCreateModal = (category) => {
    setCreateModal({ category });
    setCreateForm({ name: '', description: '' });
    setCreateError(null);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setCreateError('Group name is required');
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      await evaluationGroupService.createEvaluationGroup({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        scheme: selectedSchemeId,
        category: createModal.category,
        subjects: []
      });
      setCreateModal(null);
      fetchGroups();
    } catch (err) {
      console.error('Create group failed:', err);
      setCreateError(err.response?.data?.error || err.message || 'Failed to create group');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit / Manage Modal
  const openEditModal = async (group) => {
    setEditModal(group);
    setEditForm({
      name: group.name,
      description: group.description || '',
      status: group.status || 'Active',
      subjects: Array.isArray(group.subjects) ? group.subjects.map((s) => (typeof s === 'object' ? s._id : s)) : []
    });
    setSubjectSearch('');
    setEditError(null);
    setSubjectsLoading(true);

    try {
      const res = await evaluationGroupService.getAvailableSubjects({
        scheme: selectedSchemeId,
        category: group.category,
        currentGroupId: group._id
      });
      setCategorySubjects(res.data || []);
    } catch (err) {
      console.error('Failed to load category subjects:', err);
      setEditError('Failed to load available subjects for this category.');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const toggleSubjectSelection = (subjectId, isAssignedToOther) => {
    if (isAssignedToOther) return; // Cannot select subjects owned by another group

    setEditForm((prev) => {
      const current = prev.subjects;
      const exists = current.includes(subjectId);
      const updated = exists ? current.filter((id) => id !== subjectId) : [...current, subjectId];
      return { ...prev, subjects: updated };
    });
  };

  const handleSelectAllAvailable = () => {
    const availableIds = categorySubjects
      .filter((s) => !s.isAssignedToOtherGroup)
      .map((s) => s._id);
    setEditForm((prev) => ({ ...prev, subjects: availableIds }));
  };

  const handleDeselectAll = () => {
    setEditForm((prev) => ({ ...prev, subjects: [] }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditError('Group name is required');
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError(null);
      await evaluationGroupService.updateEvaluationGroup(editModal._id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        status: editForm.status,
        subjects: editForm.subjects
      });
      setEditModal(null);
      fetchGroups();
    } catch (err) {
      console.error('Update group failed:', err);
      setEditError(err.response?.data?.error || err.message || 'Failed to update group');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (group) => {
    setDeleteModal(group);
    setDeleteError(null);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteModal) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await evaluationGroupService.deleteEvaluationGroup(deleteModal._id);
      setDeleteModal(null);
      fetchGroups();
    } catch (err) {
      console.error('Delete group failed:', err);
      setDeleteError(err.response?.data?.error || err.message || 'Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  // Filter subjects in Edit Modal by search input
  const filteredCategorySubjects = useMemo(() => {
    if (!subjectSearch.trim()) return categorySubjects;
    const term = subjectSearch.toLowerCase().trim();
    return categorySubjects.filter(
      (s) =>
        s.code?.toLowerCase().includes(term) ||
        s.name?.toLowerCase().includes(term) ||
        s.evaluationType?.toLowerCase().includes(term)
    );
  }, [categorySubjects, subjectSearch]);

  if (!canView) {
    return (
      <div className="p-8 text-center font-mono text-sm text-gray-500 dark:text-zinc-400">
        <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-amber-500" />
        You do not have permission to view academic evaluation groups.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Scheme Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 border-b border-gray-200 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Evaluation Groups
              </h1>
            </div>
            <Link
              to="/evaluation-rules"
              className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              [→ Manage Evaluation Rules]
            </Link>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Organize scheme subjects into evaluation groups across academic categories.
          </p>
        </div>

        {/* Scheme Selector & Summary */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <label htmlFor="scheme-select" className="text-gray-500 dark:text-zinc-400 font-semibold whitespace-nowrap">
            Scheme:
          </label>
          <select
            id="scheme-select"
            value={selectedSchemeId}
            onChange={(e) => setSelectedSchemeId(e.target.value)}
            className="border border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-none"
          >
            {schemes.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name || `Scheme ${s.year}`} ({s.status || 'Active'})
              </option>
            ))}
          </select>

          <span className="text-gray-400 dark:text-zinc-600">|</span>
          <span className="text-gray-600 dark:text-zinc-400">
            Total Groups: <span className="font-semibold text-gray-900 dark:text-gray-100">{groups.length}</span>
          </span>
          <span className="text-gray-400 dark:text-zinc-600">|</span>
          <span className="text-gray-600 dark:text-zinc-400">
            Subjects Assigned:{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {totalAssignedSubjects} / {totalEligibleSubjects}
            </span>
          </span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Categories Grid / Sections */}
      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-gray-500 dark:text-zinc-400">
          Loading evaluation groups for {selectedScheme?.name || 'scheme'}...
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const catGroups = groupsByCategory[cat.key] || [];
            const totalAssignedSubjects = catGroups.reduce(
              (sum, g) => sum + (Array.isArray(g.subjects) ? g.subjects.length : 0),
              0
            );

            return (
              <div
                key={cat.key}
                className="border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#111113]"
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-zinc-800 gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-gray-900 dark:text-gray-100">
                        {cat.label}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-none bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700">
                        {catGroups.length} {catGroups.length === 1 ? 'group' : 'groups'}
                      </span>
                      <span className="text-xs font-mono text-gray-500 dark:text-zinc-400">
                        ({totalAssignedSubjects} {totalAssignedSubjects === 1 ? 'subject' : 'subjects'} assigned)
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
                      {cat.description}
                    </p>
                  </div>

                  {canManage && (
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => openCreateModal(cat.key)}
                        className="inline-flex items-center gap-1 rounded-none border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-gray-50 active:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-700 font-sans"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Group</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Groups List Table */}
                {catGroups.length === 0 ? (
                  <div className="p-4 text-center font-mono text-xs text-gray-500 dark:text-zinc-500">
                    No evaluation groups configured.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono divide-y divide-gray-200 dark:divide-zinc-800">
                      <thead className="bg-gray-50/50 dark:bg-zinc-900/40 text-gray-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-3 py-2 w-10 text-center">#</th>
                          <th className="px-3 py-2">Group Name</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2 text-center w-28">Subjects</th>
                          <th className="px-3 py-2 text-center w-20">Status</th>
                          <th className="px-3 py-2 text-right w-36">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                        {catGroups.map((group, idx) => {
                          const subjectCount = Array.isArray(group.subjects) ? group.subjects.length : 0;
                          const isExpanded = !!expandedGroups[group._id];

                          return (
                            <React.Fragment key={group._id}>
                              <tr className="hover:bg-gray-50/80 dark:hover:bg-zinc-900/30 transition-colors">
                                <td className="px-3 py-2 text-center text-gray-400 dark:text-zinc-600">
                                  {idx + 1}
                                </td>
                                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => toggleGroupExpand(group._id)}
                                      className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
                                      title={isExpanded ? 'Collapse subjects' : 'View assigned subjects'}
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <span>{group.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-gray-500 dark:text-zinc-400 max-w-xs truncate">
                                  {group.description || <span className="text-gray-400 dark:text-zinc-600 italic">None</span>}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleGroupExpand(group._id)}
                                    className={`px-1.5 py-0.5 rounded-none text-[11px] font-semibold border ${
                                      subjectCount > 0
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
                                        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                    }`}
                                  >
                                    {subjectCount} {subjectCount === 1 ? 'subject' : 'subjects'}
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-semibold border ${
                                      group.status === 'Active'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                                        : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                    }`}
                                  >
                                    {group.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right whitespace-nowrap">
                                  {canManage && (
                                    <div className="flex items-center justify-end gap-2 font-mono text-[11px]">
                                      <button
                                        type="button"
                                        onClick={() => openEditModal(group)}
                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline"
                                      >
                                        [Edit / Assign]
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openDeleteModal(group)}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold hover:underline"
                                      >
                                        [Delete]
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>

                              {/* Expanded Subjects Row */}
                              {isExpanded && (
                                <tr className="bg-gray-50/70 dark:bg-zinc-900/50">
                                  <td colSpan={6} className="px-6 py-2.5 border-t border-b border-gray-200 dark:border-zinc-800">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700 dark:text-zinc-300 font-mono">
                                        <span>Assigned Subjects ({subjectCount}):</span>
                                        {canManage && (
                                          <button
                                            type="button"
                                            onClick={() => openEditModal(group)}
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                          >
                                            + Manage Subjects
                                          </button>
                                        )}
                                      </div>

                                      {subjectCount === 0 ? (
                                        <p className="text-[11px] text-gray-500 dark:text-zinc-500 italic">
                                          No subjects assigned to this group yet. Click "[Edit / Assign]" to add subjects.
                                        </p>
                                      ) : (
                                        <div className="pt-1.5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
                                          {group.subjects.map((sub) => {
                                            const code = typeof sub === 'object' ? sub.code : sub;
                                            const name = typeof sub === 'object' ? sub.name : '';
                                            return (
                                              <div
                                                key={typeof sub === 'object' ? sub._id : sub}
                                                className="flex items-baseline gap-2 py-0.5 border-b border-gray-100 dark:border-zinc-800/40 min-w-0"
                                              >
                                                <span className="font-bold text-gray-900 dark:text-gray-100 shrink-0">{code}</span>
                                                <span className="text-gray-400 dark:text-zinc-600 shrink-0">·</span>
                                                <span className="text-gray-600 dark:text-zinc-300 truncate" title={name}>{name}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
          <div className="w-full max-w-md bg-white dark:bg-[#111113] border border-gray-300 dark:border-zinc-700 shadow-xl">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 uppercase">
                  Create Evaluation Group ({createModal.category})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCreateModal(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-3 space-y-3 font-mono text-xs">
              {createError && (
                <div className="p-2 border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 text-[11px]">
                  {createError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-gray-600 dark:text-zinc-400 font-semibold block">Scheme</label>
                <div className="p-1.5 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-200">
                  {selectedScheme?.name || `Scheme ${selectedScheme?.year}`}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 dark:text-zinc-400 font-semibold block">Category</label>
                <div className="p-1.5 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-200">
                  {createModal.category}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="create-group-name" className="text-gray-600 dark:text-zinc-400 font-semibold block">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-group-name"
                  type="text"
                  required
                  placeholder={`e.g. ${createModal.category} Group 01`}
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full border border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-1.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="create-group-desc" className="text-gray-600 dark:text-zinc-400 font-semibold block">
                  Description
                </label>
                <textarea
                  id="create-group-desc"
                  rows={2}
                  placeholder="Optional brief description of evaluation model..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full border border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-1.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-zinc-800 font-sans">
                <button
                  type="button"
                  onClick={() => setCreateModal(null)}
                  className="border border-gray-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-3 py-1 text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="border border-blue-600 bg-blue-600 text-white px-3 py-1 text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit & Subject Assignment Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111113] border border-gray-300 dark:border-zinc-700 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 uppercase">
                  Edit Group & Assign Subjects: {editModal.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-3 space-y-3 font-mono text-xs overflow-y-auto flex-1">
              {editError && (
                <div className="p-2 border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 text-[11px]">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="edit-group-name" className="text-gray-600 dark:text-zinc-400 font-semibold block">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-group-name"
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-1 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-group-status" className="text-gray-600 dark:text-zinc-400 font-semibold block">
                    Status
                  </label>
                  <select
                    id="edit-group-status"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full border border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-1 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-group-desc" className="text-gray-600 dark:text-zinc-400 font-semibold block">
                  Description
                </label>
                <input
                  id="edit-group-desc"
                  type="text"
                  placeholder="Optional brief description..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-1 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Subject Assignment Section */}
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      Assign Subjects ({editForm.subjects.length} selected)
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                      [Category: {editModal.category}]
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={handleSelectAllAvailable}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline"
                    >
                      Select Available
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-gray-600 hover:text-gray-800 dark:text-zinc-400 hover:underline"
                    >
                      Clear Selected
                    </button>
                  </div>
                </div>

                {/* Subject search input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search subject code or name..."
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    className="w-full border border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-1 pl-7 text-[11px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
                </div>

                {/* Subjects list */}
                {subjectsLoading ? (
                  <div className="p-6 text-center text-xs text-gray-500 dark:text-zinc-400 font-mono">
                    Loading category subjects...
                  </div>
                ) : categorySubjects.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500 dark:text-zinc-500 border border-gray-200 dark:border-zinc-800">
                    No subjects in Scheme 2025 match category "{editModal.category}".
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-zinc-800 max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800">
                    {filteredCategorySubjects.map((sub) => {
                      const isSelected = editForm.subjects.includes(sub._id);
                      const isOther = sub.isAssignedToOtherGroup;

                      return (
                        <div
                          key={sub._id}
                          onClick={() => toggleSubjectSelection(sub._id, isOther)}
                          className={`p-2 flex items-center justify-between text-xs transition-colors select-none ${
                            isOther
                              ? 'bg-gray-50 dark:bg-zinc-900/40 text-gray-400 dark:text-zinc-600 cursor-not-allowed opacity-75'
                              : isSelected
                              ? 'bg-blue-50/60 dark:bg-blue-950/30 text-gray-900 dark:text-gray-100 cursor-pointer'
                              : 'hover:bg-gray-50 dark:hover:bg-zinc-800/40 cursor-pointer text-gray-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isOther ? (
                              <Square className="w-4 h-4 text-gray-300 dark:text-zinc-700 shrink-0" />
                            ) : isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400 dark:text-zinc-500 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-900 dark:text-gray-100">{sub.code}</span>
                                <span className="text-[10px] text-gray-500 dark:text-zinc-400">({sub.credits} credits)</span>
                                <span className="text-[9px] px-1 py-0.2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700">
                                  {sub.evaluationType || 'STANDARD'}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                                {sub.name}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {isOther ? (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                                In: {sub.assignedGroupName}
                              </span>
                            ) : isSelected ? (
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                                Assigned
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                                Available
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-zinc-800 font-sans">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="border border-gray-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-3 py-1 text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="border border-blue-600 bg-blue-600 text-white px-3 py-1 text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
          <div className="w-full max-w-sm bg-white dark:bg-[#111113] border border-gray-300 dark:border-zinc-700 shadow-xl">
            <div className="flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/50">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-mono text-xs font-bold uppercase">
                <Trash2 className="w-4 h-4" />
                <span>Delete Evaluation Group</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-2 text-xs font-mono">
              {deleteError && (
                <div className="p-2 border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 text-[11px]">
                  {deleteError}
                </div>
              )}

              <p className="text-gray-700 dark:text-zinc-300">
                Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-gray-100">{deleteModal.name}</span>?
              </p>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                Any assigned subjects ({Array.isArray(deleteModal.subjects) ? deleteModal.subjects.length : 0}) will be unassigned from this group. The subjects themselves will not be modified or deleted.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-zinc-800 font-sans">
                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className="border border-gray-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-3 py-1 text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteSubmit}
                  className="border border-red-600 bg-red-600 text-white px-3 py-1 text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationGroupsPage;
