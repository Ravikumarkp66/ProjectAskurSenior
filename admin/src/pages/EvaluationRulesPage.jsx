import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { isSuperAdmin, hasPermission } from '../utils/permissions';
import subjectService from '../services/subjectService';
import evaluationGroupService from '../services/evaluationGroupService';
import evaluationRuleService from '../services/evaluationRuleService';
import EvaluationRuleEditor from '../components/evaluation/EvaluationRuleEditor';
import {
  ScrollText,
  AlertCircle,
  Plus,
  ArrowLeft,
  Copy,
  Layers,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { detectGroupPattern, PATTERN_KEYS } from '../utils/evaluationGroupPatterns';

export const EvaluationRulesPage = () => {
  const { admin } = useAdminAuth();
  const isSuper = isSuperAdmin(admin);
  const canView = isSuper || hasPermission(admin, 'subjects', 'view') || hasPermission(admin, 'academic_structure', 'view');
  const canManage = isSuper || hasPermission(admin, 'subjects', 'update') || hasPermission(admin, 'academic_structure', 'update');

  const [schemes, setSchemes] = useState([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedScheme, setSelectedScheme] = useState(null);

  const [groups, setGroups] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Group currently selected for rule configuration / viewing
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Load schemes on mount
  useEffect(() => {
    const loadSchemes = async () => {
      try {
        const res = await subjectService.getSchemes();
        const schemeList = Array.isArray(res) ? res : (res.data || res.schemes || []);
        setSchemes(schemeList);

        if (schemeList.length > 0) {
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

  // Load evaluation groups & existing rules for selected scheme
  const fetchData = useCallback(async () => {
    if (!selectedSchemeId) return;
    setLoading(true);
    setError(null);
    try {
      const [groupsRes, rulesRes] = await Promise.all([
        evaluationGroupService.getEvaluationGroups({ scheme: selectedSchemeId }),
        evaluationRuleService.getEvaluationRules({ scheme: selectedSchemeId })
      ]);

      const groupList = Array.isArray(groupsRes.data) ? groupsRes.data : Array.isArray(groupsRes) ? groupsRes : [];
      const ruleList = Array.isArray(rulesRes.data) ? rulesRes.data : Array.isArray(rulesRes) ? rulesRes : [];

      setGroups(groupList);
      setRules(ruleList);

      // If a group was selected, update its reference
      if (selectedGroup) {
        const updatedSelected = groupList.find((g) => g._id === selectedGroup._id);
        if (updatedSelected) setSelectedGroup(updatedSelected);
      }
    } catch (err) {
      console.error('Failed to load evaluation groups/rules:', err);
      setError('Failed to load evaluation groups or rules for selected scheme.');
    } finally {
      setLoading(false);
    }
  }, [selectedSchemeId, selectedGroup?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Index rules by evaluationGroup ID
  const rulesByGroup = useMemo(() => {
    const map = {};
    for (const rule of rules) {
      const gId = typeof rule.evaluationGroup === 'object' ? rule.evaluationGroup?._id : rule.evaluationGroup;
      if (!gId) continue;
      if (!map[gId]) map[gId] = [];
      map[gId].push(rule);
    }
    // Sort versions descending
    for (const gId in map) {
      map[gId].sort((a, b) => (b.version || 1) - (a.version || 1));
    }
    return map;
  }, [rules]);

  // Compute total subjects assigned across all groups
  const totalAssignedSubjects = useMemo(() => {
    const seen = new Set();
    groups.forEach((g) => {
      (g.subjects || []).forEach((s) => {
        const id = typeof s === 'object' ? s._id : s;
        if (id) seen.add(String(id));
      });
    });
    return seen.size;
  }, [groups]);

  // Helper to get active or latest rule for a group
  const getGroupRule = (groupId) => {
    const groupRuleList = rulesByGroup[groupId] || [];
    const active = groupRuleList.find((r) => r.status === 'ACTIVE');
    return active || groupRuleList[0] || null;
  };

  // Helper to format rule summary string
  const formatRuleSummary = (rule, group) => {
    if (!rule) return 'Rule: Not configured';
    const pattern = detectGroupPattern(group);

    if (pattern === PATTERN_KEYS.NCMC || !rule.see?.enabled) {
      return `CIE ${rule.cie?.maxMarks || 100} · SEE Disabled · PP / NP · SGPA Excluded`;
    }

    const cieMax = rule.cie?.maxMarks ?? 50;
    const seeMax = rule.see?.maxMarks ?? 50;
    return `CIE ${cieMax} · SEE ${seeMax}`;
  };

  if (!canView) {
    return (
      <div className="p-8 text-center font-mono text-sm text-gray-500 dark:text-zinc-400">
        <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-amber-500" />
        You do not have permission to view academic evaluation rules.
      </div>
    );
  }

  // If a group is selected, render the contextual EvaluationRuleEditor
  if (selectedGroup) {
    const groupRuleList = rulesByGroup[selectedGroup._id] || [];
    const activeRule = groupRuleList.find((r) => r.status === 'ACTIVE') || groupRuleList[0] || null;

    return (
      <EvaluationRuleEditor
        group={selectedGroup}
        scheme={selectedScheme}
        existingRule={activeRule}
        groupRules={groupRuleList}
        onBack={() => setSelectedGroup(null)}
        onRuleUpdated={fetchData}
      />
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header & Scheme Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 border-b border-gray-200 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 font-mono uppercase">
                Evaluation Rules
              </h1>
            </div>
            <Link
              to="/evaluation-groups"
              className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              [← Manage Groups]
            </Link>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Configure contextual CIE, SEE, eligibility conditions, and grade scales per evaluation group.
          </p>
        </div>

        {/* Scheme Selector & Summary Counters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <label htmlFor="rule-scheme-select" className="text-gray-500 dark:text-zinc-400 font-semibold whitespace-nowrap">
            Scheme:
          </label>
          <select
            id="rule-scheme-select"
            value={selectedSchemeId}
            onChange={(e) => setSelectedSchemeId(e.target.value)}
            className="border border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs focus:outline-none rounded-none"
          >
            {schemes.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name || `Scheme ${s.year}`} ({s.status || 'Active'})
              </option>
            ))}
          </select>

          <span className="text-gray-400 dark:text-zinc-600">|</span>
          <span className="text-gray-600 dark:text-zinc-400">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{groups.length}</span> Groups
          </span>
          <span className="text-gray-400 dark:text-zinc-600">|</span>
          <span className="text-gray-600 dark:text-zinc-400">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{totalAssignedSubjects}</span> Subjects
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Evaluation Groups & Rules Table */}
      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-gray-500 dark:text-zinc-400">
          Loading evaluation rules for {selectedScheme?.name || 'scheme'}...
        </div>
      ) : groups.length === 0 ? (
        <div className="p-8 text-center border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#111113] font-mono text-xs text-gray-500">
          No evaluation groups found for this scheme. Please configure evaluation groups first.
        </div>
      ) : (
        <div className="border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#111113] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono divide-y divide-gray-200 dark:divide-zinc-800">
            <thead className="bg-gray-50 dark:bg-zinc-900/80 text-gray-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">#</th>
                <th className="px-3 py-2.5 w-64">Group</th>
                <th className="px-3 py-2.5 w-40 text-center">Subjects</th>
                <th className="px-3 py-2.5 w-36 text-center">Rule Status</th>
                <th className="px-3 py-2.5">Version & Mark Summary</th>
                <th className="px-3 py-2.5 text-right w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {groups.map((group, idx) => {
                const subjectCount = Array.isArray(group.subjects) ? group.subjects.length : 0;
                const rule = getGroupRule(group._id);
                const hasActiveRule = rule?.status === 'ACTIVE';
                const hasDraftRule = rule?.status === 'DRAFT';
                const summary = formatRuleSummary(rule, group);

                return (
                  <tr key={group._id} className="hover:bg-gray-50/80 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="px-3 py-3 text-center text-gray-400 dark:text-zinc-600">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex flex-col">
                        <span className="font-bold">{group.name}</span>
                        <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                          Category: {group.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-[11px] font-semibold text-gray-700 dark:text-zinc-300">
                        {subjectCount} {subjectCount === 1 ? 'subject' : 'subjects'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {hasActiveRule ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          v{rule.version} · ACTIVE
                        </span>
                      ) : hasDraftRule ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                          v{rule.version} · DRAFT
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 dark:text-zinc-600 italic">
                          Not configured
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {rule ? (
                        <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-zinc-200">
                          <span>{summary}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-zinc-600 text-[11px]">
                          No active rule defined
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {canManage && (
                        <div className="flex items-center justify-end gap-2 text-[11px]">
                          {!rule ? (
                            <button
                              type="button"
                              onClick={() => setSelectedGroup(group)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold hover:underline"
                            >
                              [Configure]
                            </button>
                          ) : hasActiveRule ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedGroup(group)}
                                className="text-gray-700 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-white font-semibold hover:underline"
                              >
                                [View]
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedGroup(group)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold hover:underline"
                              >
                                [New Version]
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedGroup(group)}
                              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 font-bold hover:underline"
                            >
                              [Edit Draft]
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EvaluationRulesPage;
