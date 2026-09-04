import React, { useState, useEffect, useMemo } from 'react';
import materialService from '../services/materialService';
import { useAdminAuth } from '../context/AdminAuthContext';
import { canManageMaterials } from '../utils/permissions';

export default function DuplicateReviewModal({ isOpen, onClose, onResolved }) {
  const { admin } = useAdminAuth();
  const { canView, canUpdate, canDelete } = useMemo(() => canManageMaterials(admin), [admin]);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchDuplicates();
    }
  }, [isOpen]);

  const fetchDuplicates = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await materialService.getDuplicates();
      setDuplicateGroups(data || []);
    } catch (err) {
      console.error('Failed to fetch duplicates:', err);
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to load duplicate groups');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // View file in browser
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

  // Keep one, trash the other(s) in the group
  const handleKeepOne = async (keepItem, allItemsInGroup) => {
    const toTrash = allItemsInGroup.filter((m) => m._id !== keepItem._id);
    if (toTrash.length === 0) return;

    setActionInProgressId(keepItem._id);
    try {
      for (const item of toTrash) {
        await materialService.trashMaterial(item._id);
      }
      // Remove group from view
      setDuplicateGroups((prev) =>
        prev.filter((g) => !g.materials.some((m) => m._id === keepItem._id))
      );
      onResolved?.();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve duplicates');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Keep both / Ignore duplicate
  const handleIgnore = async (material, groupId) => {
    setActionInProgressId(material._id);
    try {
      await materialService.ignoreDuplicate(material._id);
      // Remove or update the group
      setDuplicateGroups((prev) =>
        prev
          .map((g) => {
            if (g.groupId !== groupId) return g;
            const updatedMaterials = g.materials.filter((m) => m._id !== material._id);
            return updatedMaterials.length > 1 ? { ...g, materials: updatedMaterials } : null;
          })
          .filter(Boolean)
      );
      onResolved?.();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to ignore duplicate warning');
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono text-xs">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col border border-gray-300 bg-white shadow-xl dark:border-zinc-700 dark:bg-[#18181b]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Duplicate Materials Resolution
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
              Review and resolve files detected with identical SHA-256 hashes or matching metadata
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="border border-red-300 bg-red-50 p-2 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              ⚠ {errorMessage}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-gray-500">
              Scanning database for duplicates...
            </div>
          ) : duplicateGroups.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-green-600 font-semibold text-sm">
                ✓ No duplicates found!
              </div>
              <p className="text-gray-500 text-[11px]">
                All materials have distinct SHA-256 file hashes and metadata.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-[11px] text-gray-600 dark:text-gray-400">
                Found <strong>{duplicateGroups.length}</strong> duplicate group(s):
              </div>

              {duplicateGroups.map((group, groupIdx) => (
                <div
                  key={group.groupId || groupIdx}
                  className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#141414] overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="border-b border-gray-200 bg-gray-50 px-3.5 py-2 flex items-center justify-between dark:border-zinc-800 dark:bg-[#18181b]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white">
                        Group {groupIdx + 1}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 ${
                          group.matchType?.includes('Hash')
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}
                      >
                        {group.matchType || 'Potential Match'}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {group.materials.length} copies detected
                    </span>
                  </div>

                  {/* Duplicate Comparison Table */}
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-100 text-[10px] uppercase text-gray-400 dark:border-zinc-800 dark:text-gray-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Title / Subject</th>
                        <th className="px-3 py-2 font-semibold">Type</th>
                        <th className="px-3 py-2 font-semibold">Size</th>
                        <th className="px-3 py-2 font-semibold">Uploaded By</th>
                        <th className="px-3 py-2 font-semibold">Date</th>
                        <th className="px-3 py-2 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 font-mono">
                      {group.materials.map((m) => {
                        const isWorking = actionInProgressId === m._id;
                        return (
                          <tr key={m._id} className="hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]">
                            <td className="px-3 py-2.5 max-w-xs">
                              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={m.title}>
                                {m.title}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">
                                {m.subject ? `${m.subject.code} - ${m.subject.name}` : (m.legacySubjectName || 'Unassigned')}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">
                              {m.materialType || 'Others'}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {formatFileSize(m.fileSize)}
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 max-w-[140px] truncate" title={m.uploaderEmail || m.uploadedBy?.email || '—'}>
                              {m.uploaderEmail || m.uploadedBy?.email || '—'}
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                              {formatDate(m.createdAt)}
                            </td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap space-x-1.5 font-mono text-xs">
                              {(() => {
                                const actions = [];
                                if (canView) {
                                  actions.push(
                                    <button
                                      key="view"
                                      type="button"
                                      onClick={() => handleView(m)}
                                      className="text-cyan-600 hover:underline dark:text-cyan-400 font-medium"
                                      title="View file in browser"
                                    >
                                      View
                                    </button>
                                  );
                                }
                                if (canDelete) {
                                  actions.push(
                                    <button
                                      key="keep-this"
                                      type="button"
                                      disabled={isWorking}
                                      onClick={() => handleKeepOne(m, group.materials)}
                                      className="text-green-600 font-semibold hover:underline dark:text-green-400 disabled:opacity-50"
                                      title="Keep this version and move other duplicate copies to Trash"
                                    >
                                      Keep This
                                    </button>
                                  );
                                }
                                if (canUpdate) {
                                  actions.push(
                                    <button
                                      key="keep-both"
                                      type="button"
                                      disabled={isWorking}
                                      onClick={() => handleIgnore(m, group.groupId)}
                                      className="text-gray-500 hover:underline hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                                      title="Mark this file as not a duplicate"
                                    >
                                      Keep Both
                                    </button>
                                  );
                                }
                                if (actions.length === 0) {
                                  return <span className="text-gray-400 dark:text-zinc-600">—</span>;
                                }
                                return actions.map((act, i) => (
                                  <React.Fragment key={act.key || i}>
                                    {i > 0 && <span className="text-gray-300 dark:text-zinc-700">|</span>}
                                    {act}
                                  </React.Fragment>
                                ));
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-200 px-5 py-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
