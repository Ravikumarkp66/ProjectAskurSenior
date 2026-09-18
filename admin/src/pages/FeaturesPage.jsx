import React, { useState, useEffect, useCallback } from 'react';
import featureService from '../services/featureService';
import {
  Sparkles,
  CheckCircle2,
  Ban,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  X,
  Sliders,
  AlertTriangle,
  Check,
  ShieldAlert
} from 'lucide-react';

const CATEGORIES = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'ACADEMIC', label: 'Academic' },
  { key: 'CONTENT', label: 'Content' },
  { key: 'CAREER', label: 'Career' },
  { key: 'TOOLS', label: 'Tools' },
  { key: 'COMMUNITY', label: 'Community' }
];

const ACCESS_TIERS = [
  { key: 'ALL', label: 'All Tiers' },
  { key: 'PLUS', label: 'Plus' },
  { key: 'FREE', label: 'Free' },
  { key: 'DISABLED', label: 'Disabled' }
];

export const FeaturesPage = () => {
  const [features, setFeatures] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    plusCount: 0,
    freeCount: 0,
    disabledCount: 0,
    previewEnabledCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [accessFilter, setAccessFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Configuration Modal state
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [editAccess, setEditAccess] = useState('PLUS');
  const [editPreviewEnabled, setEditPreviewEnabled] = useState(true);
  const [editEnabled, setEditEnabled] = useState(true);
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await featureService.getFeatures({
        category: categoryFilter,
        access: accessFilter,
        search: activeSearch
      });

      setFeatures(data.features || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load features:', err);
      setError('Failed to load features. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, accessFilter, activeSearch]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleOpenConfig = (feature) => {
    setSelectedFeature(feature);
    setEditAccess(feature.access);
    setEditPreviewEnabled(feature.previewEnabled ?? true);
    setEditEnabled(feature.enabled ?? true);
    setEditDescription(feature.description || '');
    setShowConfirmModal(false);
  };

  const handleCloseConfig = () => {
    setSelectedFeature(null);
    setShowConfirmModal(false);
  };

  const executeSave = async () => {
    if (!selectedFeature) return;
    try {
      setSaving(true);
      setError(null);

      const updates = {
        access: editAccess,
        previewEnabled: editPreviewEnabled,
        enabled: editEnabled,
        description: editDescription
      };

      const res = await featureService.updateFeature(selectedFeature.key, updates);

      // Update local state
      const updated = res.feature;
      setFeatures((prev) =>
        prev.map((f) => (f.key === updated.key ? { ...f, ...updated } : f))
      );

      setSuccessMessage(`Feature "${updated.name}" updated successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);

      handleCloseConfig();
      fetchFeatures();
    } catch (err) {
      console.error('Failed to update feature:', err);
      setError(err.response?.data?.error || 'Failed to save feature configuration.');
    } finally {
      setSaving(false);
      setShowConfirmModal(false);
    }
  };

  const handleSaveClick = () => {
    if (!selectedFeature) return;
    const accessChanged = editAccess !== selectedFeature.access;
    const enabledChanged = editEnabled !== selectedFeature.enabled;

    if (accessChanged || enabledChanged) {
      setShowConfirmModal(true);
    } else {
      executeSave();
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'ACADEMIC':
        return 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40';
      case 'CONTENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40';
      case 'CAREER':
        return 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40';
      case 'TOOLS':
        return 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
      case 'COMMUNITY':
        return 'bg-pink-50 text-pink-700 border-pink-200/60 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/40';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  };

  const renderAccessBadge = (access, enabled) => {
    if (!enabled || access === 'DISABLED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50">
          <Ban className="w-3.5 h-3.5" />
          DISABLED
        </span>
      );
    }

    if (access === 'PLUS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          PLUS
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        FREE
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Feature Registry
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              STEP-04
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Centralized platform control for Free, Plus, and Disabled features with preview configuration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchFeatures}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-800 dark:hover:text-rose-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Total Features
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            {summary.total}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Active catalog</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111113] border border-purple-200/70 dark:border-purple-900/40 shadow-sm">
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Plus Exclusive
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
            {summary.plusCount}
          </div>
          <div className="text-[11px] text-purple-500/80 dark:text-purple-400/70 mt-0.5">Entitled users</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111113] border border-emerald-200/70 dark:border-emerald-900/40 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Free for All
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {summary.freeCount}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">Open access</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111113] border border-rose-200/70 dark:border-rose-900/40 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <Ban className="w-3 h-3" />
            Disabled
          </div>
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">
            {summary.disabledCount}
          </div>
          <div className="text-[11px] text-rose-500/80 dark:text-rose-400/70 mt-0.5">Kill switch active</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111113] border border-blue-200/70 dark:border-blue-900/40 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Preview Mode
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
            {summary.previewEnabledCount}
          </div>
          <div className="text-[11px] text-blue-500/80 dark:text-blue-400/70 mt-0.5">Teasers enabled</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, key, or route..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setActiveSearch(searchInput);
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-50 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setActiveSearch('');
                }}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Access Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mr-1 shrink-0">
              Access:
            </span>
            {ACCESS_TIERS.map((tier) => (
              <button
                key={tier.key}
                type="button"
                onClick={() => setAccessFilter(tier.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors shrink-0 ${
                  accessFilter === tier.key
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-gray-100 dark:border-zinc-800/80 pt-2.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mr-1 shrink-0">
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors shrink-0 ${
                categoryFilter === cat.key
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Features List Table */}
      <div className="rounded-xl bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/40 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">Feature Name & Key</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Access Tier</th>
                <th className="py-3 px-3">Preview Mode</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Configure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
              {loading && features.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading feature registry...
                  </td>
                </tr>
              ) : features.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-zinc-400">
                    No features match the selected filters.
                  </td>
                </tr>
              ) : (
                features.map((item) => (
                  <tr
                    key={item.key}
                    className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Feature & Key */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        {item.name}
                        {item.route && (
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800/80 px-1.5 py-0.2 rounded">
                            {item.route}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {item.key}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1 max-w-md">
                          {item.description}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border tracking-wide uppercase ${getCategoryBadgeClass(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </td>

                    {/* Access Tier */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {renderAccessBadge(item.access, item.enabled)}
                    </td>

                    {/* Preview Mode */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {item.previewEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40">
                          <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          Preview On
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200/60 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                          <EyeOff className="w-3 h-3 text-zinc-400" />
                          Preview Off
                        </span>
                      )}
                    </td>

                    {/* Status / Kill switch */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {item.enabled ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Disabled
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenConfig(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Configure
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Configuration Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#161618] border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Configure Feature: {selectedFeature.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${getCategoryBadgeClass(
                      selectedFeature.category
                    )}`}
                  >
                    {selectedFeature.category}
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-400 mt-0.5">
                  key: {selectedFeature.key} {selectedFeature.route ? `• ${selectedFeature.route}` : ''}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseConfig}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Access Tier Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Access Entitlement Tier
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* PLUS Card */}
                  <button
                    type="button"
                    onClick={() => setEditAccess('PLUS')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editAccess === 'PLUS'
                        ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 ring-1 ring-purple-500'
                        : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        PLUS
                      </span>
                      {editAccess === 'PLUS' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      Exclusive to Plus members (Admins, Test Users, Subscriptions).
                    </p>
                  </button>

                  {/* FREE Card */}
                  <button
                    type="button"
                    onClick={() => setEditAccess('FREE')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editAccess === 'FREE'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                        : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        FREE
                      </span>
                      {editAccess === 'FREE' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      Available to every student unconditionally without restriction.
                    </p>
                  </button>

                  {/* DISABLED Card */}
                  <button
                    type="button"
                    onClick={() => setEditAccess('DISABLED')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editAccess === 'DISABLED'
                        ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 ring-1 ring-rose-500'
                        : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" />
                        DISABLED
                      </span>
                      {editAccess === 'DISABLED' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      Access completely disabled platform-wide for maintenance.
                    </p>
                  </button>
                </div>
              </div>

              {/* Preview Toggle Setting */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800/80 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-500" />
                    Preview Mode for Free Students
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    When enabled on Plus features, Free students can see a preview/teaser instead of an inaccessible blank page.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={editPreviewEnabled}
                    onChange={(e) => setEditPreviewEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Kill Switch Toggle */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800/80 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Feature Kill Switch (Master Enabled)
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    If toggled off, this feature is completely unreachable regardless of user plan or Plus status.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={editEnabled}
                    onChange={(e) => setEditEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Description field */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Short description of what this feature does..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/40 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseConfig}
                disabled={saving}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={saving}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal on Tier Mutation */}
      {showConfirmModal && selectedFeature && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#161618] border border-amber-300 dark:border-amber-800/80 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Confirm Access Tier Change
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Immediate platform-wide effect
                </p>
              </div>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-2 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-800/40">
              <p>
                You are changing <strong>{selectedFeature.name}</strong> from{' '}
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedFeature.access}
                </span>{' '}
                to{' '}
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                  {editAccess}
                </span>
                .
              </p>
              {!editEnabled && (
                <p className="text-rose-600 dark:text-rose-400 font-medium">
                  Warning: The feature kill switch is also being toggled OFF.
                </p>
              )}
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                This change will be audited in the administrator security logs.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={saving}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? 'Applying...' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturesPage;
