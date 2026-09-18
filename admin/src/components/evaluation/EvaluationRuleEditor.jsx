import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Layers,
  BookOpen,
  Info,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import evaluationRuleService from '../../services/evaluationRuleService';
import {
  PATTERN_KEYS,
  detectGroupPattern,
  PATTERN_CONFIGS
} from '../../utils/evaluationGroupPatterns';

export const EvaluationRuleEditor = ({
  group,
  scheme,
  existingRule,
  groupRules = [],
  onBack,
  onRuleUpdated
}) => {
  const patternKey = useMemo(() => detectGroupPattern(group), [group]);
  const patternConfig = PATTERN_CONFIGS[patternKey] || PATTERN_CONFIGS[PATTERN_KEYS.STANDARD_THEORY];

  // Active or selected rule state
  const [selectedRuleId, setSelectedRuleId] = useState(existingRule?._id || null);
  const [currentRule, setCurrentRule] = useState(null);
  const [isNewRule, setIsNewRule] = useState(!existingRule);

  // Form state
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Initialize or switch rule
  useEffect(() => {
    if (existingRule) {
      setCurrentRule(existingRule);
      setSelectedRuleId(existingRule._id);
      setIsNewRule(false);
      setFormData(JSON.parse(JSON.stringify(existingRule)));
    } else {
      // Initialize with pattern-specific template
      const template = patternConfig.getDefaultTemplate(group, scheme);
      template.scheme = scheme?._id;
      template.evaluationGroup = group?._id;
      template.version = 1;
      template.status = 'DRAFT';
      setCurrentRule(null);
      setSelectedRuleId(null);
      setIsNewRule(true);
      setFormData(template);
    }
  }, [existingRule, group, scheme, patternConfig]);

  // Handle switching between historical versions of this group
  const handleSelectVersion = async (ruleId) => {
    if (ruleId === 'new') {
      const template = patternConfig.getDefaultTemplate(group, scheme);
      template.scheme = scheme?._id;
      template.evaluationGroup = group?._id;
      template.version = (groupRules[0]?.version || 1) + 1;
      template.status = 'DRAFT';
      setCurrentRule(null);
      setSelectedRuleId(null);
      setIsNewRule(true);
      setFormData(template);
      return;
    }

    try {
      setLoading(true);
      const res = await evaluationRuleService.getEvaluationRuleById(ruleId);
      const rule = res.data || res;
      setCurrentRule(rule);
      setSelectedRuleId(rule._id);
      setIsNewRule(false);
      setFormData(JSON.parse(JSON.stringify(rule)));
      setActionError(null);
    } catch (err) {
      setActionError('Failed to load selected rule version');
    } finally {
      setLoading(false);
    }
  };

  const isDraft = !currentRule || currentRule.status === 'DRAFT';
  const isActive = currentRule?.status === 'ACTIVE';
  const isArchived = currentRule?.status === 'ARCHIVED';

  // Form change helpers
  const handleFieldChange = (field, value) => {
    if (!isDraft) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCieChange = (field, value) => {
    if (!isDraft) return;
    setFormData((prev) => ({
      ...prev,
      cie: { ...(prev.cie || {}), [field]: value }
    }));
  };

  const handleSeeChange = (field, value) => {
    if (!isDraft) return;
    setFormData((prev) => ({
      ...prev,
      see: { ...(prev.see || {}), [field]: value }
    }));
  };

  // Component management
  const updateCieComponent = (index, field, value) => {
    if (!isDraft) return;
    setFormData((prev) => {
      const components = [...(prev.cie?.components || [])];
      components[index] = { ...components[index], [field]: value };
      return {
        ...prev,
        cie: { ...prev.cie, components }
      };
    });
  };

  const addCieComponent = () => {
    if (!isDraft) return;
    const newComp = {
      key: `COMP_${Date.now().toString().slice(-4)}`,
      name: 'New Assessment Component',
      type: 'ASSESSMENT',
      entryMode: 'COUNTED',
      entries: { count: 1, maxMarksEach: 25 },
      aggregation: { method: 'SUM' },
      conversion: { enabled: false, sourceMax: 25, targetMax: 25 },
      order: (formData.cie?.components?.length || 0) + 1
    };
    setFormData((prev) => ({
      ...prev,
      cie: {
        ...prev.cie,
        components: [...(prev.cie?.components || []), newComp]
      }
    }));
  };

  const removeCieComponent = (index) => {
    if (!isDraft) return;
    setFormData((prev) => {
      const components = (prev.cie?.components || []).filter((_, i) => i !== index);
      return {
        ...prev,
        cie: { ...prev.cie, components }
      };
    });
  };

  const addSeeComponent = () => {
    if (!isDraft) return;
    const newComp = {
      key: `SEE_COMP_${Date.now().toString().slice(-4)}`,
      name: 'Semester End Component',
      type: 'THEORY_EXAM',
      entryMode: 'COUNTED',
      entries: { count: 1, maxMarksEach: 50 },
      aggregation: { method: 'SUM' },
      conversion: { enabled: false, sourceMax: 50, targetMax: 50 },
      order: (formData.see?.components?.length || 0) + 1
    };
    setFormData((prev) => ({
      ...prev,
      see: {
        ...prev.see,
        components: [...(prev.see?.components || []), newComp]
      }
    }));
  };

  const removeSeeComponent = (index) => {
    if (!isDraft) return;
    setFormData((prev) => {
      const components = (prev.see?.components || []).filter((_, i) => i !== index);
      return {
        ...prev,
        see: { ...prev.see, components }
      };
    });
  };

  // Eligibility condition management
  const addEligibilityCondition = () => {
    if (!isDraft) return;
    const newCondition = {
      type: 'CIE_MIN',
      value: 20,
      description: 'Minimum CIE threshold'
    };
    setFormData((prev) => ({
      ...prev,
      eligibility: {
        ...(prev.eligibility || { enabled: true, operator: 'AND' }),
        conditions: [...(prev.eligibility?.conditions || []), newCondition]
      }
    }));
  };

  const updateEligibilityCondition = (index, field, value) => {
    if (!isDraft) return;
    setFormData((prev) => {
      const conditions = [...(prev.eligibility?.conditions || [])];
      conditions[index] = { ...conditions[index], [field]: value };
      return {
        ...prev,
        eligibility: { ...prev.eligibility, conditions }
      };
    });
  };

  const removeEligibilityCondition = (index) => {
    if (!isDraft) return;
    setFormData((prev) => {
      const conditions = (prev.eligibility?.conditions || []).filter((_, i) => i !== index);
      return {
        ...prev,
        eligibility: { ...prev.eligibility, conditions }
      };
    });
  };

  // Grade Scale updates
  const updateGradeRow = (index, field, value) => {
    if (!isDraft) return;
    setFormData((prev) => {
      const grades = [...(prev.gradeScale?.grades || [])];
      grades[index] = { ...grades[index], [field]: Number(value) };
      return {
        ...prev,
        gradeScale: { ...prev.gradeScale, grades }
      };
    });
  };

  // Reset to default template
  const handleResetToTemplate = () => {
    if (!isDraft) return;
    if (window.confirm('Reset this draft rule to the official Scheme 2025 academic template?')) {
      const template = patternConfig.getDefaultTemplate(group, scheme);
      template.scheme = scheme?._id;
      template.evaluationGroup = group?._id;
      template.version = formData?.version || 1;
      template.status = 'DRAFT';
      setFormData(template);
      setActionMessage('Reset to academic template');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // Save Draft (Create or Update)
  const handleSaveDraft = async () => {
    setSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      let saved;
      if (isNewRule || !currentRule?._id) {
        const res = await evaluationRuleService.createEvaluationRule({
          ...formData,
          scheme: scheme._id,
          evaluationGroup: group._id
        });
        saved = res.data || res;
        setIsNewRule(false);
      } else {
        const res = await evaluationRuleService.updateEvaluationRule(currentRule._id, formData);
        saved = res.data || res;
      }

      setCurrentRule(saved);
      setSelectedRuleId(saved._id);
      setFormData(JSON.parse(JSON.stringify(saved)));
      setActionMessage(`Draft rule saved successfully (v${saved.version})`);
      if (onRuleUpdated) onRuleUpdated();
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to save draft rule');
    } finally {
      setSaving(false);
    }
  };

  // Activate Rule
  const handleActivate = async () => {
    if (!currentRule?._id) {
      setActionError('Please save the draft rule before activating.');
      return;
    }

    if (!window.confirm(`Activate evaluation rule "${currentRule.name}" (v${currentRule.version})? This will make it the authoritative active rule for ${group.name}.`)) {
      return;
    }

    setSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const res = await evaluationRuleService.activateEvaluationRule(currentRule._id);
      const activated = res.data || res;
      setCurrentRule(activated);
      setFormData(JSON.parse(JSON.stringify(activated)));
      setActionMessage(`Rule v${activated.version} is now ACTIVE.`);
      if (onRuleUpdated) onRuleUpdated();
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to activate rule');
    } finally {
      setSaving(false);
    }
  };

  // Create New Version from Active Rule
  const handleCreateNewVersion = async () => {
    if (!currentRule?._id) return;
    if (!window.confirm(`Create a new DRAFT version cloned from v${currentRule.version}? Historical rules remain immutable.`)) {
      return;
    }

    setSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const res = await evaluationRuleService.createNewVersion(currentRule._id);
      const newVersionRule = res.data || res;
      setCurrentRule(newVersionRule);
      setSelectedRuleId(newVersionRule._id);
      setIsNewRule(false);
      setFormData(JSON.parse(JSON.stringify(newVersionRule)));
      setActionMessage(`Created new DRAFT version v${newVersionRule.version}. You can now make changes and activate.`);
      if (onRuleUpdated) onRuleUpdated();
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to create new version');
    } finally {
      setSaving(false);
    }
  };

  if (!formData) {
    return (
      <div className="p-8 text-center text-xs font-mono text-gray-500">
        Loading rule editor...
      </div>
    );
  }

  const assignedSubjects = Array.isArray(group.subjects) ? group.subjects : [];

  // Partition components for IPCC
  const theoryComponents = patternConfig.hasIpccSections
    ? (formData.cie?.components || []).filter((c) => c.key?.startsWith('IPCC_THEORY') || c.type === 'ASSESSMENT')
    : formData.cie?.components || [];

  const practicalComponents = patternConfig.hasIpccSections
    ? (formData.cie?.components || []).filter((c) => !theoryComponents.includes(c))
    : [];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Navigation & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-300 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="border border-gray-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 p-1.5 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
            title="Back to Evaluation Groups"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wider text-gray-900 dark:text-gray-100">
                {group.name}
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700">
                {assignedSubjects.length} subjects
              </span>
              {/* Status Badge */}
              <span
                className={`px-2 py-0.5 text-[11px] font-mono font-bold border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : isDraft
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                }`}
              >
                Rule v{formData.version || 1} · {currentRule?.status || 'DRAFT'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Category: <span className="font-semibold text-gray-700 dark:text-zinc-300">{group.category}</span> · Pattern:{' '}
              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{patternConfig.title}</span>
            </p>
          </div>
        </div>

        {/* Version Switcher & Primary Action Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {groupRules.length > 0 && (
            <div className="flex items-center gap-1">
              <label htmlFor="version-select" className="text-gray-500 dark:text-zinc-400">Version:</label>
              <select
                id="version-select"
                value={selectedRuleId || (isNewRule ? 'new' : '')}
                onChange={(e) => handleSelectVersion(e.target.value)}
                className="border border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
              >
                {groupRules.map((r) => (
                  <option key={r._id} value={r._id}>
                    v{r.version} ({r.status})
                  </option>
                ))}
                {isNewRule && <option value="new">v{formData.version} (New Draft)</option>}
              </select>
            </div>
          )}

          {isDraft && (
            <>
              <button
                type="button"
                onClick={handleResetToTemplate}
                className="border border-gray-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-2.5 py-1 text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-50 flex items-center gap-1"
                title="Reset to official academic template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Template</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveDraft}
                className="border border-gray-400 bg-gray-100 dark:bg-zinc-800 dark:border-zinc-600 px-3 py-1 text-xs font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                disabled={saving || !currentRule?._id}
                onClick={handleActivate}
                className="border border-emerald-600 bg-emerald-600 text-white px-3 py-1 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                title={!currentRule?._id ? 'Save draft before activating' : 'Make this rule active'}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Activate Rule</span>
              </button>
            </>
          )}

          {isActive && (
            <button
              type="button"
              disabled={saving}
              onClick={handleCreateNewVersion}
              className="border border-blue-600 bg-blue-600 text-white px-3 py-1 text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Create New Version</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Banners */}
      {actionMessage && (
        <div className="flex items-center gap-2 p-2 border border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 p-2 border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {isActive && (
        <div className="p-2 border border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-mono flex items-center justify-between">
          <span>
            <strong>ACTIVE RULE (IMMUTABLE):</strong> This rule version is currently active. To protect historical mark records, direct editing is disabled. Click "[Create New Version]" to edit a new draft.
          </span>
        </div>
      )}

      {isArchived && (
        <div className="p-2 border border-zinc-300 bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-mono">
          <strong>ARCHIVED RULE:</strong> This rule is an archived historical version (read-only).
        </div>
      )}

      {/* Group Subjects Strip */}
      <div className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111113] p-2.5 font-mono">
        <div className="text-[11px] font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase flex items-center justify-between">
          <span>Assigned Subjects ({assignedSubjects.length})</span>
          <span className="text-gray-400 font-normal text-[10px]">Configured via Evaluation Groups</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
          {assignedSubjects.map((sub) => {
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
      </div>

      {/* Rule Metadata */}
      <div className="border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#111113] p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-1.5">
          <span className="text-xs font-mono font-bold uppercase text-gray-900 dark:text-gray-100">
            Rule Metadata & SGPA Impact
          </span>
          {patternKey === PATTERN_KEYS.NCMC && (
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300">
              SGPA EXCLUDED (0 CREDITS / NCMC)
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div>
            <label className="block text-gray-600 dark:text-zinc-400 mb-1">Rule Name:</label>
            <input
              type="text"
              disabled={!isDraft}
              value={formData.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full border border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-gray-600 dark:text-zinc-400 mb-1">Description / Academic Notes:</label>
            <input
              type="text"
              disabled={!isDraft}
              value={formData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full border border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-zinc-800"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer">
            <input
              type="checkbox"
              disabled={!isDraft || patternKey === PATTERN_KEYS.NCMC}
              checked={patternKey === PATTERN_KEYS.NCMC ? false : formData.contributesToSGPA !== false}
              onChange={(e) => handleFieldChange('contributesToSGPA', e.target.checked)}
              className="rounded-none border-gray-300"
            />
            <span className="text-gray-800 dark:text-zinc-200">
              Contributes to SGPA Calculation {patternKey === PATTERN_KEYS.NCMC && '(Locked: Excluded for NCMC)'}
            </span>
          </label>
        </div>
      </div>

      {/* SECTION 1: CIE CONFIGURATION */}
      <div className="border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#111113]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 bg-gray-50 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-zinc-800 gap-2 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-900 dark:text-gray-100">
              1. Continuous Internal Evaluation (CIE)
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              Total Target: {formData.cie?.maxMarks || 50} Marks
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Max:</span>
              <input
                type="number"
                disabled={!isDraft}
                value={formData.cie?.maxMarks ?? 50}
                onChange={(e) => handleCieChange('maxMarks', Number(e.target.value))}
                className="w-14 border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-center disabled:bg-gray-100"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Passing Min:</span>
              <input
                type="number"
                disabled={!isDraft}
                value={formData.cie?.passingMarks ?? 20}
                onChange={(e) => handleCieChange('passingMarks', Number(e.target.value))}
                className="w-14 border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-center disabled:bg-gray-100"
              />
            </div>
            {isDraft && (patternConfig.isConfigurableComponents || patternConfig.hasIpccSections) && (
              <button
                type="button"
                onClick={addCieComponent}
                className="border border-gray-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-gray-50 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Component</span>
              </button>
            )}
          </div>
        </div>

        {/* Pattern 5 Contextual Notice for Standard Lab */}
        {patternConfig.isRuntimeLabSession && (
          <div className="px-3 py-2 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-900 text-xs font-mono text-blue-900 dark:text-blue-300">
            <p>
              <strong>CRITICAL RUNTIME ARCHITECTURE:</strong> Continuous Lab Conduction marks per session ={' '}
              <span className="font-bold">35</span>, Target = <span className="font-bold">35</span>.
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
              The number of conducted sessions <span className="font-bold italic">(N)</span> is not fixed by rule; it is supplied at runtime from section timetable conduction data. Calculation formula:{' '}
              <code>(Raw Sum / (N × 35)) × 35</code>.
            </p>
          </div>
        )}

        {/* Pattern 4 Partitioned Dual CIE (Theory vs Practical) */}
        {patternConfig.hasIpccSections ? (
          <div className="p-3 space-y-4">
            {/* Theory Sub-section */}
            <div className="border border-gray-200 dark:border-zinc-800">
              <div className="px-3 py-1.5 bg-gray-100/70 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-gray-800 dark:text-zinc-200 uppercase">Theory CIE Component (50 → 25 Marks)</span>
                <span className="text-[11px] text-gray-500">Tests (100→34) + Quizzes (40→8) + Assignments (40→8)</span>
              </div>
              <ComponentsTable
                components={theoryComponents}
                isDraft={isDraft}
                allComponents={formData.cie?.components || []}
                onUpdate={(idx, field, val) => {
                  const globalIdx = (formData.cie?.components || []).findIndex((c) => c.key === theoryComponents[idx].key);
                  if (globalIdx !== -1) updateCieComponent(globalIdx, field, val);
                }}
                onRemove={(idx) => {
                  const globalIdx = (formData.cie?.components || []).findIndex((c) => c.key === theoryComponents[idx].key);
                  if (globalIdx !== -1) removeCieComponent(globalIdx);
                }}
              />
            </div>

            {/* Practical Sub-section */}
            <div className="border border-gray-200 dark:border-zinc-800">
              <div className="px-3 py-1.5 bg-gray-100/70 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-gray-800 dark:text-zinc-200 uppercase">Practical CIE Component (25 Marks)</span>
                <span className="text-[11px] text-gray-500">Lab Conduction & Record (15) + Lab Internal Test (15→10)</span>
              </div>
              <ComponentsTable
                components={practicalComponents}
                isDraft={isDraft}
                allComponents={formData.cie?.components || []}
                onUpdate={(idx, field, val) => {
                  const globalIdx = (formData.cie?.components || []).findIndex((c) => c.key === practicalComponents[idx].key);
                  if (globalIdx !== -1) updateCieComponent(globalIdx, field, val);
                }}
                onRemove={(idx) => {
                  const globalIdx = (formData.cie?.components || []).findIndex((c) => c.key === practicalComponents[idx].key);
                  if (globalIdx !== -1) removeCieComponent(globalIdx);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="p-3">
            <ComponentsTable
              components={formData.cie?.components || []}
              isDraft={isDraft}
              allComponents={formData.cie?.components || []}
              onUpdate={updateCieComponent}
              onRemove={removeCieComponent}
            />
          </div>
        )}
      </div>

      {/* SECTION 2: SEE CONFIGURATION (HIDDEN FOR NCMC!) */}
      {patternConfig.hasSee ? (
        <div className="border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#111113]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 bg-gray-50 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-zinc-800 gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-gray-900 dark:text-gray-100">
                2. Semester End Examination (SEE)
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                Total Target: {formData.see?.maxMarks || 50} Marks
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Max:</span>
                <input
                  type="number"
                  disabled={!isDraft}
                  value={formData.see?.maxMarks ?? 50}
                  onChange={(e) => handleSeeChange('maxMarks', Number(e.target.value))}
                  className="w-14 border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-center disabled:bg-gray-100"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Passing Min:</span>
                <input
                  type="number"
                  disabled={!isDraft}
                  value={formData.see?.passingMarks ?? 18}
                  onChange={(e) => handleSeeChange('passingMarks', Number(e.target.value))}
                  className="w-14 border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-center disabled:bg-gray-100"
                />
              </div>
              {isDraft && patternConfig.isConfigurableComponents && (
                <button
                  type="button"
                  onClick={addSeeComponent}
                  className="border border-gray-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-gray-50 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add SEE Component</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-3">
            <ComponentsTable
              components={formData.see?.components || []}
              isDraft={isDraft}
              allComponents={formData.see?.components || []}
              onUpdate={(idx, field, val) => {
                const components = [...(formData.see?.components || [])];
                components[idx] = { ...components[idx], [field]: val };
                handleSeeChange('components', components);
              }}
              onRemove={removeSeeComponent}
            />
          </div>
        </div>
      ) : (
        /* Explicit NCMC Notice: SEE Disabled */
        <div className="border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#111113] p-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase text-gray-700 dark:text-zinc-300">
                2. Semester End Examination (SEE)
              </span>
              <span className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold">
                DISABLED
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-500">
              <span>RESULT: <strong className="text-gray-900 dark:text-gray-100">PP / NP</strong></span>
              <span>SGPA: <strong className="text-amber-600 dark:text-amber-400">EXCLUDED</strong></span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
            As per academic regulations for NCMC Non-Credit courses, there is no university semester-end examination. Evaluation is 100% continuous internal assessment.
          </p>
        </div>
      )}

      {/* SECTION 3: ELIGIBILITY CONDITIONS */}
      <div className="border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#111113]">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-zinc-800 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-900 dark:text-gray-100">
              3. Eligibility & Minimum Passing Thresholds
            </span>
            <span className="text-[11px] text-gray-500">
              ({formData.eligibility?.conditions?.length || 0} conditions)
            </span>
          </div>
          {isDraft && (
            <button
              type="button"
              onClick={addEligibilityCondition}
              className="border border-gray-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-gray-50 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Condition</span>
            </button>
          )}
        </div>

        <div className="p-3 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono divide-y divide-gray-200 dark:divide-zinc-800">
            <thead className="bg-gray-50/60 dark:bg-zinc-900/40 text-gray-500 text-[11px] uppercase">
              <tr>
                <th className="px-2 py-1.5 w-10 text-center">#</th>
                <th className="px-2 py-1.5 w-48">Condition Type</th>
                <th className="px-2 py-1.5 w-36 text-center">Threshold</th>
                <th className="px-2 py-1.5 w-48">Component Key (if applicable)</th>
                <th className="px-2 py-1.5">Academic Description</th>
                {isDraft && <th className="px-2 py-1.5 w-16 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {(formData.eligibility?.conditions || []).map((cond, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30">
                  <td className="px-2 py-1.5 text-center text-gray-400">{idx + 1}</td>
                  <td className="px-2 py-1.5">
                    <select
                      disabled={!isDraft}
                      value={cond.type}
                      onChange={(e) => updateEligibilityCondition(idx, 'type', e.target.value)}
                      className="w-full border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-xs disabled:bg-gray-100"
                    >
                      <option value="CIE_MIN">CIE Minimum (CIE_MIN)</option>
                      {patternConfig.hasSee && <option value="SEE_MIN">SEE Minimum (SEE_MIN)</option>}
                      {patternConfig.hasSee && <option value="AGGREGATE_MIN">Aggregate Total (AGGREGATE_MIN)</option>}
                      <option value="COMPONENT_MIN">Component Minimum (COMPONENT_MIN)</option>
                      {patternKey !== PATTERN_KEYS.NCMC && <option value="ATTENDANCE_MIN">Attendance % (ATTENDANCE_MIN)</option>}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-gray-400">&ge;</span>
                      <input
                        type="number"
                        disabled={!isDraft}
                        value={cond.value ?? 0}
                        onChange={(e) => updateEligibilityCondition(idx, 'value', Number(e.target.value))}
                        className="w-16 border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-center text-xs disabled:bg-gray-100"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    {cond.type === 'COMPONENT_MIN' ? (
                      <input
                        type="text"
                        disabled={!isDraft}
                        placeholder="e.g. IPCC_THEORY_TEST"
                        value={cond.componentKey || ''}
                        onChange={(e) => updateEligibilityCondition(idx, 'componentKey', e.target.value)}
                        className="w-full border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-xs disabled:bg-gray-100"
                      />
                    ) : (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      disabled={!isDraft}
                      value={cond.description || ''}
                      onChange={(e) => updateEligibilityCondition(idx, 'description', e.target.value)}
                      className="w-full border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-xs disabled:bg-gray-100"
                    />
                  </td>
                  {isDraft && (
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => removeEligibilityCondition(idx)}
                        className="text-red-500 hover:text-red-700 p-0.5"
                        title="Remove condition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: GRADE SCALE */}
      <div className="border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#111113]">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-zinc-800 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-900 dark:text-gray-100">
              4. Grade Scale & Letter Classifications
            </span>
            <span className="text-xs font-semibold px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700">
              Type: {formData.gradeScale?.type || patternConfig.resultType}
            </span>
          </div>
        </div>

        <div className="p-3 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono divide-y divide-gray-200 dark:divide-zinc-800">
            <thead className="bg-gray-50/60 dark:bg-zinc-900/40 text-gray-500 text-[11px] uppercase">
              <tr>
                <th className="px-3 py-1.5 w-24">Grade</th>
                <th className="px-3 py-1.5 w-32 text-center">Min Marks</th>
                <th className="px-3 py-1.5 w-32 text-center">Max Marks</th>
                <th className="px-3 py-1.5 w-28 text-center">Grade Point</th>
                <th className="px-3 py-1.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {(formData.gradeScale?.grades || []).map((g, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30">
                  <td className="px-3 py-1.5 font-bold text-gray-900 dark:text-gray-100">{g.grade}</td>
                  <td className="px-3 py-1.5 text-center">
                    <input
                      type="number"
                      disabled={!isDraft}
                      value={g.minMarks}
                      onChange={(e) => updateGradeRow(idx, 'minMarks', e.target.value)}
                      className="w-16 border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-center disabled:bg-gray-100"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <input
                      type="number"
                      disabled={!isDraft}
                      value={g.maxMarks}
                      onChange={(e) => updateGradeRow(idx, 'maxMarks', e.target.value)}
                      className="w-16 border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-center disabled:bg-gray-100"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <input
                      type="number"
                      disabled={!isDraft}
                      value={g.gradePoint}
                      onChange={(e) => updateGradeRow(idx, 'gradePoint', e.target.value)}
                      className="w-16 border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-center disabled:bg-gray-100"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-gray-500">
                    {g.grade === 'PP' && 'Pass (NCMC non-credit)'}
                    {g.grade === 'NP' && 'Not Passed (NCMC non-credit)'}
                    {g.grade === 'O' && 'Outstanding (90-100)'}
                    {g.grade === 'A+' && 'Excellent (80-89)'}
                    {g.grade === 'A' && 'Very Good (70-79)'}
                    {g.grade === 'B+' && 'Good (60-69)'}
                    {g.grade === 'B' && 'Above Average (55-59)'}
                    {g.grade === 'C' && 'Average (50-54)'}
                    {g.grade === 'P' && 'Pass (40-49)'}
                    {g.grade === 'F' && 'Fail (<40)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * Reusable Components Table for CIE / SEE sections
 */
function ComponentsTable({ components, isDraft, allComponents, onUpdate, onRemove }) {
  if (!components || components.length === 0) {
    return (
      <div className="p-3 text-center text-xs font-mono text-gray-400">
        No components configured in this section.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs font-mono divide-y divide-gray-200 dark:divide-zinc-800">
        <thead className="bg-gray-50/60 dark:bg-zinc-900/40 text-gray-500 text-[11px] uppercase">
          <tr>
            <th className="px-2 py-1.5 w-8 text-center">#</th>
            <th className="px-2 py-1.5 w-48">Name & Key</th>
            <th className="px-2 py-1.5 w-28">Type</th>
            <th className="px-2 py-1.5 w-28 text-center">Entry Mode</th>
            <th className="px-2 py-1.5 w-28 text-center">Entries × Marks</th>
            <th className="px-2 py-1.5 w-28 text-center">Aggregation</th>
            <th className="px-2 py-1.5 w-32 text-center">Conversion</th>
            {isDraft && <th className="px-2 py-1.5 w-12 text-right">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
          {components.map((c, idx) => {
            const hasConversion = c.conversion?.enabled;
            const count = c.entries?.count || 1;
            const maxEach = c.entries?.maxMarksEach || 0;
            const rawTotal = count * maxEach;
            const targetTotal = hasConversion ? c.conversion?.targetMax : rawTotal;

            return (
              <tr key={c.key || idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30">
                <td className="px-2 py-1.5 text-center text-gray-400">{idx + 1}</td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    disabled={!isDraft}
                    value={c.name || ''}
                    onChange={(e) => onUpdate(idx, 'name', e.target.value)}
                    className="w-full font-bold border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-xs text-gray-900 dark:text-gray-100 disabled:bg-gray-100"
                  />
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Key: <span className="text-gray-600 dark:text-zinc-400">{c.key}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <select
                    disabled={!isDraft}
                    value={c.type || 'ASSESSMENT'}
                    onChange={(e) => onUpdate(idx, 'type', e.target.value)}
                    className="w-full border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-xs disabled:bg-gray-100"
                  >
                    <option value="ASSESSMENT">Assessment / Test</option>
                    <option value="LAB_RECORD">Lab Record</option>
                    <option value="LAB_TEST">Lab Test</option>
                    <option value="PROJECT">Project</option>
                    <option value="PRACTICAL_EXAM">Practical Exam</option>
                    <option value="THEORY_EXAM">Theory Exam</option>
                    <option value="OTHER">Other</option>
                  </select>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-[10px]">
                    {c.entryMode || 'COUNTED'}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      disabled={!isDraft}
                      value={count}
                      onChange={(e) =>
                        onUpdate(idx, 'entries', {
                          ...(c.entries || {}),
                          count: Number(e.target.value)
                        })
                      }
                      className="w-10 border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-center text-xs disabled:bg-gray-100"
                    />
                    <span className="text-gray-400">×</span>
                    <input
                      type="number"
                      disabled={!isDraft}
                      value={maxEach}
                      onChange={(e) =>
                        onUpdate(idx, 'entries', {
                          ...(c.entries || {}),
                          maxMarksEach: Number(e.target.value)
                        })
                      }
                      className="w-12 border border-gray-300 bg-white dark:bg-zinc-900 px-1 py-0.5 text-center text-xs disabled:bg-gray-100"
                    />
                  </div>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className="text-[11px] text-gray-700 dark:text-zinc-300">
                    {c.aggregation?.method || 'SUM'}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  {hasConversion ? (
                    <div className="flex items-center justify-center gap-1 font-bold text-blue-700 dark:text-blue-400">
                      <span>{c.conversion.sourceMax}</span>
                      <span className="text-gray-400">→</span>
                      <span>{c.conversion.targetMax}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 font-medium">{rawTotal} (No scale)</span>
                  )}
                </td>
                {isDraft && (
                  <td className="px-2 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="text-red-500 hover:text-red-700 p-0.5"
                      title="Remove component"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default EvaluationRuleEditor;
