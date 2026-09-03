import React, { useState, useEffect, useCallback, useMemo } from 'react';
import materialService from '../services/materialService';
import subjectService from '../services/subjectService';
import MaterialUploadModal from '../components/MaterialUploadModal';
import DuplicateReviewModal from '../components/DuplicateReviewModal';

const MATERIAL_TYPES = [
  'Notes',
  'PYQs',
  'Question Banks',
  'Syllabus',
  'Lab Manuals',
  'Textbooks',
  'Others',
  'SEE',
  'Internals'
];

const ACADEMIC_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const STATUS_OPTIONS = ['Published', 'Hidden', 'Draft'];
const MIGRATION_OPTIONS = ['Auto Matched', 'Needs Review', 'Manually Assigned'];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    hidden: 0,
    draft: 0,
    needsReview: 0,
    possibleDuplicates: 0,
    trashCount: 0
  });

  const [subjectsList, setSubjectsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMigration, setSelectedMigration] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isTrashView, setIsTrashView] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });

  // Batch Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchReassignOpen, setIsBatchReassignOpen] = useState(false);
  const [batchReassignSearch, setBatchReassignSearch] = useState('');
  const [batchNewSubjectId, setBatchNewSubjectId] = useState('');
  const [isExecutingBatch, setIsExecutingBatch] = useState(false);

  // Dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDuplicatesOpen, setIsDuplicatesOpen] = useState(false);

  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', materialType: 'Notes', status: 'Published' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [reassigningMaterial, setReassigningMaterial] = useState(null);
  const [reassignSearch, setReassignSearch] = useState('');
  const [selectedNewSubjectId, setSelectedNewSubjectId] = useState('');
  const [isSavingReassign, setIsSavingReassign] = useState(false);

  const [confirmTrashItem, setConfirmTrashItem] = useState(null);
  const [confirmPermanentDeleteItem, setConfirmPermanentDeleteItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await materialService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Load subjects for filter dropdown and reassigning
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await subjectService.getSubjects({ limit: 1000 });
      setSubjectsList(res.subjects || []);
    } catch (err) {
      console.error('Failed to fetch subjects list:', err);
    }
  }, []);

  // Load materials
  const fetchMaterials = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await materialService.getMaterials({
        page,
        limit: 50,
        search,
        year: selectedYear,
        materialType: selectedType,
        status: selectedStatus,
        migrationStatus: selectedMigration,
        subjectId: selectedSubject,
        trash: isTrashView
      });
      setMaterials(data.materials || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 50, pages: 1 });
      setSelectedIds([]); // Clear selection when page/filter changes
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load materials');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedYear, selectedType, selectedStatus, selectedMigration, selectedSubject, isTrashView]);

  useEffect(() => {
    fetchStats();
    fetchSubjects();
  }, [fetchStats, fetchSubjects]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Toast auto-clear
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Handle preview/view
  const handleView = async (material) => {
    try {
      const data = await materialService.getViewUrl(material._id);
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        alert('View link could not be generated.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to open file.');
    }
  };

  // Handle direct download
  const handleDownload = async (material) => {
    try {
      const data = await materialService.getDownloadUrl(material._id);
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Download link could not be generated.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to download file.');
    }
  };

  // Open Edit Modal
  const openEditDialog = (m) => {
    setEditingMaterial(m);
    setEditForm({
      title: m.title || '',
      materialType: m.materialType || 'Notes',
      status: m.status || 'Published'
    });
  };

  // Save Edit Changes
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setIsSavingEdit(true);
    try {
      await materialService.updateMaterial(editingMaterial._id, {
        title: editForm.title.trim(),
        materialType: editForm.materialType,
        status: editForm.status
      });
      setSuccessMessage(`Updated "${editForm.title}" successfully.`);
      setEditingMaterial(null);
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update material');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open Reassign Modal
  const openReassignDialog = (m) => {
    setReassigningMaterial(m);
    setSelectedNewSubjectId(m.subject?._id || '');
    setReassignSearch('');
  };

  // Filtered subjects for reassign dropdown
  const filteredReassignSubjects = useMemo(() => {
    if (!reassignSearch.trim()) return subjectsList;
    const q = reassignSearch.toLowerCase();
    return subjectsList.filter(
      (s) => (s.code && s.code.toLowerCase().includes(q)) || (s.name && s.name.toLowerCase().includes(q))
    );
  }, [subjectsList, reassignSearch]);

  // Save Reassign Subject
  const handleSaveReassign = async (e) => {
    e.preventDefault();
    if (!reassigningMaterial || !selectedNewSubjectId) return;
    setIsSavingReassign(true);
    try {
      await materialService.updateMaterial(reassigningMaterial._id, {
        subject: selectedNewSubjectId
      });
      setSuccessMessage(`Reassigned "${reassigningMaterial.title}" to selected subject.`);
      setReassigningMaterial(null);
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reassign subject');
    } finally {
      setIsSavingReassign(false);
    }
  };

  // Handle Move to Trash (Soft Delete)
  const handleMoveToTrash = async () => {
    if (!confirmTrashItem) return;
    setIsDeleting(true);
    try {
      await materialService.trashMaterial(confirmTrashItem._id);
      setSuccessMessage(`Moved "${confirmTrashItem.title}" to Trash.`);
      setConfirmTrashItem(null);
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to move to Trash');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Restore from Trash
  const handleRestore = async (material) => {
    try {
      await materialService.restoreMaterial(material._id);
      setSuccessMessage(`Restored "${material.title}" from Trash.`);
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to restore material');
    }
  };

  // Handle Permanent Delete
  const handlePermanentDelete = async () => {
    if (!confirmPermanentDeleteItem) return;
    setIsDeleting(true);
    try {
      await materialService.deletePermanent(confirmPermanentDeleteItem._id);
      setSuccessMessage(`Permanently deleted "${confirmPermanentDeleteItem.title}".`);
      setConfirmPermanentDeleteItem(null);
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to permanently delete material');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- BATCH SELECTION & ACTIONS (PHASE 6) ---
  const handleToggleSelectAll = () => {
    if (selectedIds.length === materials.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(materials.map((m) => m._id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Status Change
  const handleBulkStatus = async (status) => {
    if (selectedIds.length === 0 || !status) return;
    setIsExecutingBatch(true);
    try {
      const res = await materialService.bulkUpdateStatus(selectedIds, status);
      setSuccessMessage(res.message || `Updated status to "${status}" for selected items.`);
      setSelectedIds([]);
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Bulk status update failed');
    } finally {
      setIsExecutingBatch(false);
    }
  };

  // Bulk Move to Trash (Soft Delete)
  const handleBulkTrash = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Move ${selectedIds.length} selected material(s) to Trash?`)) return;
    setIsExecutingBatch(true);
    try {
      const res = await materialService.bulkDelete(selectedIds, false);
      setSuccessMessage(res.message || `Moved ${selectedIds.length} materials to Trash.`);
      setSelectedIds([]);
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Bulk trash failed');
    } finally {
      setIsExecutingBatch(false);
    }
  };

  // Bulk Restore from Trash
  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    setIsExecutingBatch(true);
    try {
      for (const id of selectedIds) {
        await materialService.restoreMaterial(id);
      }
      setSuccessMessage(`Restored ${selectedIds.length} material(s) from Trash.`);
      setSelectedIds([]);
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Bulk restore failed');
    } finally {
      setIsExecutingBatch(false);
    }
  };

  // Bulk Permanent Delete
  const handleBulkPermanentDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`PERMANENTLY erase ${selectedIds.length} materials? This cannot be undone.`)) return;
    setIsExecutingBatch(true);
    try {
      const res = await materialService.bulkDelete(selectedIds, true);
      setSuccessMessage(res.message || `Permanently erased ${selectedIds.length} material(s).`);
      setSelectedIds([]);
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Bulk permanent delete failed');
    } finally {
      setIsExecutingBatch(false);
    }
  };

  // Filtered subjects for batch reassign dialog
  const filteredBatchSubjects = useMemo(() => {
    if (!batchReassignSearch.trim()) return subjectsList;
    const q = batchReassignSearch.toLowerCase();
    return subjectsList.filter(
      (s) => (s.code && s.code.toLowerCase().includes(q)) || (s.name && s.name.toLowerCase().includes(q))
    );
  }, [subjectsList, batchReassignSearch]);

  // Execute Bulk Reassign
  const handleExecuteBulkReassign = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0 || !batchNewSubjectId) return;
    setIsExecutingBatch(true);
    try {
      const res = await materialService.bulkReassign(selectedIds, batchNewSubjectId);
      setSuccessMessage(res.message || `Reassigned ${selectedIds.length} materials successfully.`);
      setIsBatchReassignOpen(false);
      setSelectedIds([]);
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Bulk reassign failed');
    } finally {
      setIsExecutingBatch(false);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearch('');
    setSelectedYear('');
    setSelectedType('');
    setSelectedStatus('');
    setSelectedMigration('');
    setSelectedSubject('');
    setIsTrashView(false);
    setSelectedIds([]);
    setPage(1);
  };

  const isFiltered = Boolean(search || selectedYear || selectedType || selectedStatus || selectedMigration || selectedSubject || isTrashView);

  return (
    <div className="space-y-4 font-mono text-sm">
      {/* 1. Top Section - CSES Plain Academic Summary */}
      <div className="border-b border-gray-200 pb-3 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Study Materials {isTrashView && <span className="text-red-500 font-semibold">[ Trash View ]</span>}
          </h1>
          {isTrashView && (
            <button
              onClick={() => { setIsTrashView(false); setPage(1); }}
              className="border border-gray-300 bg-white px-2.5 py-1 text-xs text-blue-600 hover:underline dark:border-zinc-700 dark:bg-[#18181b] dark:text-blue-400"
            >
              ← Back to Active Materials
            </button>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
          <span>Total: <strong className="text-gray-900 dark:text-white font-semibold">{stats.total.toLocaleString()}</strong></span>
          <span className="text-gray-300 dark:text-zinc-700">|</span>
          <span>Published: <strong className="text-green-600 dark:text-green-400 font-semibold">{stats.published.toLocaleString()}</strong></span>
          <span className="text-gray-300 dark:text-zinc-700">|</span>
          <span>Hidden: <strong className="text-gray-500 font-semibold">{stats.hidden.toLocaleString()}</strong></span>
          <span className="text-gray-300 dark:text-zinc-700">|</span>
          <span>Draft: <strong className="text-amber-600 dark:text-amber-400 font-semibold">{stats.draft.toLocaleString()}</strong></span>
          <span className="text-gray-300 dark:text-zinc-700">|</span>
          <button
            onClick={() => { setSelectedMigration('Needs Review'); setIsTrashView(false); setPage(1); }}
            className="hover:underline text-left cursor-pointer"
          >
            Needs Review: <strong className={stats.needsReview > 0 ? "text-amber-600 dark:text-amber-400 font-semibold underline" : "text-gray-500 font-semibold"}>
              {stats.needsReview.toLocaleString()}
            </strong>
          </button>
          <span className="text-gray-300 dark:text-zinc-700">|</span>
          <button
            onClick={() => setIsDuplicatesOpen(true)}
            className="hover:underline text-left cursor-pointer"
          >
            Possible Duplicates: <strong className={stats.possibleDuplicates > 0 ? "text-red-500 font-semibold underline" : "text-gray-500 font-semibold"}>
              {stats.possibleDuplicates.toLocaleString()}
            </strong>
          </button>
          <span className="text-gray-300 dark:text-zinc-700">|</span>
          <button
            onClick={() => { setIsTrashView(!isTrashView); setPage(1); }}
            className={`hover:underline text-left cursor-pointer ${isTrashView ? 'font-bold text-red-600 dark:text-red-400 underline' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Trash: <strong className="text-gray-900 dark:text-white font-semibold">{(stats.trashCount || 0).toLocaleString()}</strong>
          </button>
        </div>
      </div>

      {/* Success notification */}
      {successMessage && (
        <div className="border border-green-300 bg-green-50 p-2 text-xs text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
          ✓ {successMessage}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="border border-red-300 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 2. Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-56 border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100"
          />

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-200"
          >
            <option value="">Year ▾</option>
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-200"
          >
            <option value="">Type ▾</option>
            {MATERIAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          {!isTrashView && (
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-200"
            >
              <option value="">Status ▾</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* Migration Status Filter */}
          <select
            value={selectedMigration}
            onChange={(e) => {
              setSelectedMigration(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-200"
          >
            <option value="">Migration ▾</option>
            {MIGRATION_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setPage(1);
            }}
            className="max-w-xs border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-200"
          >
            <option value="">Subject ▾</option>
            {subjectsList.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Upload Button */}
        <div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="border border-blue-600 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            + Upload Materials
          </button>
        </div>
      </div>

      {/* --- 2.5 BATCH ACTIONS BAR (PHASE 6) --- */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border border-blue-300 bg-blue-50/80 px-3 py-2 text-xs dark:border-blue-900 dark:bg-blue-950/40">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-900 dark:text-blue-200">
              {selectedIds.length} material{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <span className="text-gray-300 dark:text-zinc-700">|</span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
            >
              Deselect All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isTrashView ? (
              <>
                <button
                  type="button"
                  disabled={isExecutingBatch}
                  onClick={() => setIsBatchReassignOpen(true)}
                  className="border border-purple-600 bg-purple-600 px-2.5 py-1 text-white hover:bg-purple-700 font-semibold disabled:opacity-50"
                >
                  Reassign Subject
                </button>

                <select
                  disabled={isExecutingBatch}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatus(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-200"
                >
                  <option value="">Set Status ▾</option>
                  <option value="Published">Published</option>
                  <option value="Hidden">Hidden</option>
                  <option value="Draft">Draft</option>
                </select>

                <button
                  type="button"
                  disabled={isExecutingBatch}
                  onClick={handleBulkTrash}
                  className="border border-red-600 bg-red-600 px-2.5 py-1 text-white hover:bg-red-700 font-semibold disabled:opacity-50"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isExecutingBatch}
                  onClick={handleBulkRestore}
                  className="border border-green-600 bg-green-600 px-2.5 py-1 text-white hover:bg-green-700 font-semibold disabled:opacity-50"
                >
                  Restore Selected
                </button>

                <button
                  type="button"
                  disabled={isExecutingBatch}
                  onClick={handleBulkPermanentDelete}
                  className="border border-red-700 bg-red-700 px-2.5 py-1 text-white hover:bg-red-800 font-semibold disabled:opacity-50"
                >
                  Permanently Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. Main CSES Materials Table */}
      <div className="overflow-x-auto border border-gray-200 bg-white dark:border-zinc-800 dark:bg-[#141414]">
        <table className="w-full text-left text-xs text-gray-800 dark:text-gray-200">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 dark:border-zinc-800 dark:bg-[#18181b] dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 w-8 text-center">
                <input
                  type="checkbox"
                  checked={materials.length > 0 && selectedIds.length === materials.length}
                  onChange={handleToggleSelectAll}
                  className="cursor-pointer"
                  title="Select all on this page"
                />
              </th>
              <th className="px-2 py-2 w-8 text-center font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Title</th>
              <th className="px-3 py-2 font-semibold">Subject</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Migration</th>
              <th className="px-3 py-2 font-semibold">File</th>
              <th className="px-3 py-2 font-semibold">Size</th>
              <th className="px-3 py-2 font-semibold">Uploaded By</th>
              <th className="px-3 py-2 font-semibold">{isTrashView ? 'Deleted At' : 'Created'}</th>
              <th className="px-3 py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan="12" className="py-8 text-center text-xs text-gray-500">
                  Loading materials...
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan="12" className="py-8 text-center text-xs text-gray-500">
                  {isTrashView ? 'Trash is empty.' : 'No materials found matching the selected criteria.'}
                </td>
              </tr>
            ) : (
              materials.map((m, idx) => {
                const rowNum = (page - 1) * pagination.limit + idx + 1;
                const subject = m.subject;
                const subjectCode = subject?.code || '—';
                const subjectName = subject?.name || m.legacySubjectName || 'Unassigned';
                const isSelected = selectedIds.includes(m._id);

                return (
                  <tr
                    key={m._id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/20'
                        : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(m._id)}
                        className="cursor-pointer"
                      />
                    </td>

                    {/* Row number */}
                    <td className="px-2 py-2 text-center text-gray-400 dark:text-zinc-600">
                      {rowNum}
                    </td>

                    {/* Title */}
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate" title={m.title}>
                      {m.title}
                    </td>

                    {/* Subject */}
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={`${subjectCode} - ${subjectName}`}>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {subjectCode}
                      </span>
                      {subjectCode !== '—' && <span className="text-gray-400 mx-1">·</span>}
                      <span className="text-gray-500 dark:text-gray-400">
                        {subjectName}
                      </span>
                    </td>

                    {/* Material Type */}
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {m.materialType || 'Others'}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={
                          m.status === 'Published'
                            ? 'text-green-700 dark:text-green-400 font-medium'
                            : m.status === 'Draft'
                            ? 'text-amber-600 dark:text-amber-400 font-medium'
                            : 'text-gray-500 dark:text-gray-400'
                        }
                      >
                        {m.status}
                      </span>
                    </td>

                    {/* Migration Status */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={
                          m.migrationStatus === 'Needs Review'
                            ? 'text-amber-600 dark:text-amber-400 font-semibold'
                            : m.migrationStatus === 'Manually Assigned'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }
                      >
                        {m.migrationStatus || '—'}
                      </span>
                    </td>

                    {/* File Ext */}
                    <td className="px-3 py-2 uppercase text-gray-600 dark:text-gray-400">
                      {m.fileType || 'PDF'}
                    </td>

                    {/* File Size */}
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatFileSize(m.fileSize)}
                    </td>

                    {/* Uploaded By */}
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400 max-w-[160px] truncate" title={m.uploaderEmail || m.uploadedBy?.email || '—'}>
                      {m.uploaderEmail || m.uploadedBy?.email || '—'}
                    </td>

                    {/* Created Date / Deleted Date */}
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(isTrashView ? m.deletedAt : m.createdAt)}
                    </td>

                    {/* Text Actions */}
                    <td className="px-3 py-2 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => handleView(m)}
                        className="text-cyan-600 hover:underline dark:text-cyan-400 font-medium"
                        title="View file in browser"
                      >
                        View
                      </button>

                      {!isTrashView ? (
                        <>
                          <span className="text-gray-300 dark:text-zinc-700">|</span>
                          <button
                            onClick={() => openEditDialog(m)}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300 dark:text-zinc-700">|</span>
                          <button
                            onClick={() => openReassignDialog(m)}
                            className="text-purple-600 hover:underline dark:text-purple-400"
                          >
                            Reassign
                          </button>
                          <span className="text-gray-300 dark:text-zinc-700">|</span>
                          <button
                            onClick={() => handleDownload(m)}
                            className="text-green-600 hover:underline dark:text-green-400"
                            title="Download file"
                          >
                            Download
                          </button>
                          <span className="text-gray-300 dark:text-zinc-700">|</span>
                          <button
                            onClick={() => setConfirmTrashItem(m)}
                            className="text-red-600 hover:underline dark:text-red-400"
                          >
                            Trash
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-300 dark:text-zinc-700">|</span>
                          <button
                            onClick={() => handleRestore(m)}
                            className="text-green-600 hover:underline dark:text-green-400 font-medium"
                          >
                            Restore
                          </button>
                          <span className="text-gray-300 dark:text-zinc-700">|</span>
                          <button
                            onClick={() => setConfirmPermanentDeleteItem(m)}
                            className="text-red-600 hover:underline dark:text-red-400 font-medium"
                          >
                            Delete Permanently
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Text-Based Pagination */}
      {pagination.pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-3 text-xs text-gray-600 dark:border-zinc-800 dark:text-gray-400">
          <div>
            Showing {(page - 1) * pagination.limit + 1}–{Math.min(page * pagination.limit, pagination.total)} of{' '}
            <strong className="text-gray-900 dark:text-white">{pagination.total}</strong> materials
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border border-gray-300 px-2 py-0.5 hover:bg-gray-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Previous
            </button>

            <span>
              Page {page} of {pagination.pages}
            </span>

            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              className="border border-gray-300 px-2 py-0.5 hover:bg-gray-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* 5. Edit Metadata Dialog */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg border border-gray-300 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-[#18181b]">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
              Edit Material
            </h2>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              {/* Title */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-2.5 py-1.5 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#121212] dark:text-gray-100"
                />
              </div>

              {/* Material Type */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Material Type
                </label>
                <select
                  value={editForm.materialType}
                  onChange={(e) => setEditForm({ ...editForm, materialType: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-2.5 py-1.5 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#121212] dark:text-gray-100"
                >
                  {MATERIAL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Visibility Status */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Status (Visibility)
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full border border-gray-300 bg-white px-2.5 py-1.5 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#121212] dark:text-gray-100"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Readonly Info Box */}
              <div className="border border-gray-200 bg-gray-50 p-2.5 text-[11px] text-gray-600 dark:border-zinc-800 dark:bg-[#141414] dark:text-gray-400 space-y-1">
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Current Subject:</span>{' '}
                  {editingMaterial.subject ? `${editingMaterial.subject.code} - ${editingMaterial.subject.name}` : (editingMaterial.legacySubjectName || 'Unassigned')}
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Migration Status:</span>{' '}
                  {editingMaterial.migrationStatus || '—'}
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">File:</span>{' '}
                  {editingMaterial.originalFileName || editingMaterial.title} ({formatFileSize(editingMaterial.fileSize)})
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Uploaded By:</span>{' '}
                  {editingMaterial.uploaderEmail || editingMaterial.uploadedBy?.email || 'System / Migrated'}
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Created:</span>{' '}
                  {formatDate(editingMaterial.createdAt)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="border border-blue-600 bg-blue-600 px-3 py-1 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Reassign Subject Dialog (Single) */}
      {reassigningMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg border border-gray-300 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-[#18181b]">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              Reassign Subject
            </h2>

            <form onSubmit={handleSaveReassign} className="space-y-3.5 text-xs">
              <div>
                <span className="font-semibold text-gray-800 dark:text-gray-200">Material:</span>
                <p className="mt-0.5 font-medium text-gray-900 dark:text-white truncate">
                  {reassigningMaterial.title}
                </p>
              </div>

              <div>
                <span className="font-semibold text-gray-800 dark:text-gray-200">Current Subject:</span>
                <p className="mt-0.5 text-gray-600 dark:text-gray-400">
                  {reassigningMaterial.subject ? (
                    <span className="font-medium text-gray-900 dark:text-white">
                      {reassigningMaterial.subject.code} - {reassigningMaterial.subject.name}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      {reassigningMaterial.legacySubjectName || 'Unassigned (Needs Review)'}
                    </span>
                  )}
                </p>
              </div>

              {/* Instant Search input for Subjects */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Search & Select New Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Filter subjects by code or name..."
                  value={reassignSearch}
                  onChange={(e) => setReassignSearch(e.target.value)}
                  className="w-full border border-gray-300 bg-white px-2.5 py-1.5 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#121212] dark:text-gray-100 mb-2"
                />

                <select
                  size={7}
                  value={selectedNewSubjectId}
                  onChange={(e) => setSelectedNewSubjectId(e.target.value)}
                  className="w-full border border-gray-300 bg-white p-1 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#121212] dark:text-gray-100"
                >
                  {filteredReassignSubjects.length === 0 ? (
                    <option disabled value="">No subjects match your search</option>
                  ) : (
                    filteredReassignSubjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.code} — {s.name} ({s.year})
                      </option>
                    ))
                  )}
                </select>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Showing {filteredReassignSubjects.length} of {subjectsList.length} subjects
                </span>
              </div>

              <div className="border border-blue-200 bg-blue-50 p-2 text-[11px] text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                ℹ Reassigning updates course material counters and sets migrationStatus to <strong>"Manually Assigned"</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassigningMaterial(null)}
                  className="border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingReassign || !selectedNewSubjectId}
                  className="border border-purple-600 bg-purple-600 px-3 py-1 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSavingReassign ? 'Reassigning...' : 'Reassign Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6.5. Batch Reassign Dialog (Phase 6) */}
      {isBatchReassignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg border border-gray-300 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-[#18181b]">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              Batch Reassign Subjects
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
              Reassign <strong className="text-purple-600 dark:text-purple-400">{selectedIds.length}</strong> selected material(s) to a new subject:
            </p>

            <form onSubmit={handleExecuteBulkReassign} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Search & Select New Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Filter subjects by code or name..."
                  value={batchReassignSearch}
                  onChange={(e) => setBatchReassignSearch(e.target.value)}
                  className="w-full border border-gray-300 bg-white px-2.5 py-1.5 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#121212] dark:text-gray-100 mb-2"
                />

                <select
                  size={7}
                  value={batchNewSubjectId}
                  onChange={(e) => setBatchNewSubjectId(e.target.value)}
                  className="w-full border border-gray-300 bg-white p-1 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-[#121212] dark:text-gray-100"
                >
                  {filteredBatchSubjects.length === 0 ? (
                    <option disabled value="">No subjects match your search</option>
                  ) : (
                    filteredBatchSubjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.code} — {s.name} ({s.year})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="border border-purple-200 bg-purple-50 p-2 text-[11px] text-purple-800 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-300">
                ℹ All {selectedIds.length} materials will be moved to the selected subject with migrationStatus set to <strong>"Manually Assigned"</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBatchReassignOpen(false)}
                  className="border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExecutingBatch || !batchNewSubjectId}
                  className="border border-purple-600 bg-purple-600 px-3 py-1 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {isExecutingBatch ? 'Reassigning...' : `Reassign All (${selectedIds.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Move to Trash Confirmation Dialog (Single) */}
      {confirmTrashItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md border border-gray-300 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-[#18181b]">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              Move to Trash
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
              Are you sure you want to move <strong>"{confirmTrashItem.title}"</strong> to Trash?
            </p>
            <div className="border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 mb-4">
              The material will be hidden from students, but the S3 file and database record will remain preserved in Trash.
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmTrashItem(null)}
                className="border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleMoveToTrash}
                className="border border-red-600 bg-red-600 px-3 py-1 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Moving...' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Permanent Delete Confirmation Dialog (Trash only, Single) */}
      {confirmPermanentDeleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md border border-red-300 bg-white p-5 shadow-lg dark:border-red-900 dark:bg-[#18181b]">
            <h2 className="text-base font-bold text-red-600 dark:text-red-400 mb-2">
              Delete Permanently
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
              Are you sure you want to permanently delete <strong>"{confirmPermanentDeleteItem.title}"</strong>?
            </p>
            <div className="border border-red-200 bg-red-50 p-2 text-[11px] text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 mb-4">
              ⚠ This action cannot be undone. The database record will be completely erased.
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmPermanentDeleteItem(null)}
                className="border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handlePermanentDelete}
                className="border border-red-700 bg-red-700 px-3 py-1 font-semibold text-white hover:bg-red-800 disabled:opacity-50"
              >
                {isDeleting ? 'Erasing...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Bulk Drag & Drop Upload Modal (Phases 3 & 4) */}
      <MaterialUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(msg) => {
          setSuccessMessage(msg);
          fetchMaterials();
          fetchStats();
        }}
        subjectsList={subjectsList}
      />

      {/* 10. Duplicate Review Modal (Phase 5) */}
      <DuplicateReviewModal
        isOpen={isDuplicatesOpen}
        onClose={() => setIsDuplicatesOpen(false)}
        onResolved={() => {
          fetchMaterials();
          fetchStats();
        }}
      />
    </div>
  );
}
