import React, { useState, useEffect, useCallback, useMemo } from 'react';
import interviewAdminService from '../services/interviewAdminService';
import { useAdminAuth } from '../context/AdminAuthContext';
import { canManageInterviews } from '../utils/permissions';
import {
  Briefcase,
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Archive,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
  RefreshCw,
  Check,
  X,
  ThumbsUp
} from 'lucide-react';

const STATUS_OPTIONS = ['all', 'Pending', 'Published', 'Rejected', 'Archived'];
const BATCH_OPTIONS = ['', '2027', '2026', '2025', '2024', '2023', '2022'];
const COMPANY_TYPES = ['Product', 'Service', 'Startup', 'Consulting', 'Other'];
const ROUND_TYPES = [
  'Online Assessment',
  'Technical',
  'DSA Round',
  'System Design',
  'HR / Behavioral',
  'Managerial'
];

const ALL_BRANCHES = [
  'CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT',
  'AIDS', 'AIML', 'CSD', 'CSM', 'IOT',
  'Chemical', 'Biotechnology', 'Other'
];

export const InterviewsPage = () => {
  const { admin } = useAdminAuth();
  const permissions = useMemo(() => canManageInterviews(admin), [admin]);
  const {
    canView,
    canCreate,
    canPublish,
    canArchive,
    canViewCompanies,
    canCreateCompany,
    canUpdateCompany,
    canDeleteCompany
  } = permissions;

  // Active subtab
  const [activeTab, setActiveTab] = useState('experiences'); // 'experiences' | 'companies'

  // Toast / feedback state
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback((current) => (current?.text === text ? null : current));
    }, 4000);
  };

  // -------------------------------------------------------------
  // EXPERIENCES STATE & ACTIONS
  // -------------------------------------------------------------
  const [experiences, setExperiences] = useState([]);
  const [expLoading, setExpLoading] = useState(true);
  const [expError, setExpError] = useState(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('newest');

  // Modals
  const [inspectItem, setInspectItem] = useState(null);

  // Experience Create & Edit Modal state
  const [experienceModal, setExperienceModal] = useState(null); // { mode: 'create' | 'edit', data: object | null }
  const [expForm, setExpForm] = useState({
    companyId: '',
    role: '',
    ctc: '',
    batch: '',
    status: 'Published',
    overallExperience: '',
    rounds: [
      {
        roundNumber: 1,
        type: 'Online Assessment',
        notes: '',
        questions: [{ text: '', solveLink: '' }]
      },
      {
        roundNumber: 2,
        type: 'Technical',
        notes: '',
        questions: [{ text: '', solveLink: '' }]
      }
    ]
  });
  const [expFormSubmitting, setExpFormSubmitting] = useState(false);
  const [expFormError, setExpFormError] = useState(null);

  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectError, setRejectError] = useState(null);

  const [archivingItem, setArchivingItem] = useState(null);
  const [archiveSubmitting, setArchiveSubmitting] = useState(false);
  const [archiveError, setArchiveError] = useState(null);

  // Fetch experiences
  const fetchExperiences = useCallback(async (targetPage = 1, searchOverride = null, statusOverride = null) => {
    if (!canView) return;
    try {
      setExpLoading(true);
      setExpError(null);

      const effectiveStatus = statusOverride !== null ? statusOverride : statusFilter;
      const effectiveSearch = searchOverride !== null ? searchOverride : activeSearch;

      const data = await interviewAdminService.getExperiences({
        page: targetPage,
        limit,
        status: effectiveStatus,
        search: effectiveSearch,
        batch: batchFilter,
        sort: sortFilter
      });

      const expList = Array.isArray(data) ? data : (data.experiences || []);
      setExperiences(expList);
      const total = data.pagination?.total || expList.length;
      const pages = data.pagination?.pages || Math.max(1, Math.ceil(total / limit));
      setTotalPages(pages);
      setTotalCount(total);
      setPage(data.pagination?.page || targetPage);
    } catch (err) {
      console.error('Failed to load experiences:', err);
      setExpError(err.response?.data?.message || err.message || 'Failed to load interview experiences');
    } finally {
      setExpLoading(false);
    }
  }, [canView, statusFilter, activeSearch, batchFilter, sortFilter, limit]);

  const paginatedExperiences = useMemo(() => {
    if (experiences.length > limit) {
      const startIndex = (page - 1) * limit;
      return experiences.slice(startIndex, startIndex + limit);
    }
    return experiences;
  }, [experiences, page, limit]);

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  };

  useEffect(() => {
    if (activeTab === 'experiences') {
      fetchExperiences(page);
    }
  }, [fetchExperiences, page, activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchInput);
    fetchExperiences(1, searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setStatusFilter('all');
    setBatchFilter('');
    setSortFilter('newest');
    setPage(1);
    fetchExperiences(1, '', 'all');
  };

  // Quick Approve
  const handleApprove = async (id) => {
    if (!canPublish) return;
    try {
      await interviewAdminService.updateExperienceStatus(id, 'Published');
      showFeedback('Experience approved and published successfully.');
      if (inspectItem?._id === id) {
        setInspectItem((prev) => ({ ...prev, status: 'Published' }));
      }
      fetchExperiences(page);
    } catch (err) {
      console.error('Failed to approve experience:', err);
      showFeedback(err.response?.data?.message || err.message || 'Failed to approve experience', 'error');
    }
  };

  // Reject Submit
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!canPublish || !rejectingItem) return;
    try {
      setRejectSubmitting(true);
      setRejectError(null);

      await interviewAdminService.updateExperienceStatus(rejectingItem._id, 'Rejected', rejectReason.trim());
      showFeedback('Experience rejected.');
      if (inspectItem?._id === rejectingItem._id) {
        setInspectItem((prev) => ({ ...prev, status: 'Rejected', rejectionReason: rejectReason.trim() }));
      }
      setRejectingItem(null);
      setRejectReason('');
      fetchExperiences(page);
    } catch (err) {
      console.error('Failed to reject experience:', err);
      setRejectError(err.response?.data?.message || err.message || 'Failed to reject experience');
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Archive Submit
  const handleArchiveSubmit = async () => {
    if (!canArchive || !archivingItem) return;
    try {
      setArchiveSubmitting(true);
      setArchiveError(null);

      await interviewAdminService.archiveExperience(archivingItem._id);
      showFeedback('Experience archived.');
      if (inspectItem?._id === archivingItem._id) {
        setInspectItem((prev) => ({ ...prev, status: 'Archived' }));
      }
      setArchivingItem(null);
      fetchExperiences(page);
    } catch (err) {
      console.error('Failed to archive experience:', err);
      setArchiveError(err.response?.data?.message || err.message || 'Failed to archive experience');
    } finally {
      setArchiveSubmitting(false);
    }
  };

  // Experience Modal Open & Handlers
  const openCreateExperienceModal = () => {
    const defaultCompanyId = companies.length > 0 ? (companies[0]._id || '') : '';
    setExpForm({
      companyId: defaultCompanyId,
      role: '',
      ctc: '',
      batch: String(new Date().getFullYear()),
      status: 'Published',
      overallExperience: '',
      rounds: [
        {
          roundNumber: 1,
          type: 'Online Assessment',
          notes: '',
          questions: [{ text: '', solveLink: '' }]
        },
        {
          roundNumber: 2,
          type: 'Technical',
          notes: '',
          questions: [{ text: '', solveLink: '' }]
        }
      ]
    });
    setExpFormError(null);
    setExperienceModal({ mode: 'create', data: null });
  };

  const openEditExperienceModal = (exp) => {
    const compId = exp.companyId?._id || exp.companyId || exp.company?._id || '';
    let parsedRounds = [];

    if (Array.isArray(exp.rounds) && exp.rounds.length > 0) {
      parsedRounds = exp.rounds.map((r, rIdx) => ({
        roundNumber: r.roundNumber || rIdx + 1,
        type: r.type || 'Technical',
        notes: Array.isArray(r.notes) ? r.notes.join('\n') : (r.notes || ''),
        questions: Array.isArray(r.questions) && r.questions.length > 0
          ? r.questions.map((q) => {
              if (typeof q === 'string') return { text: q, solveLink: '' };
              return { text: q.text || '', solveLink: q.solveLink || '' };
            })
          : [{ text: '', solveLink: '' }]
      }));
    } else {
      parsedRounds = [
        {
          roundNumber: 1,
          type: 'Technical',
          notes: '',
          questions: [{ text: '', solveLink: '' }]
        }
      ];
    }

    setExpForm({
      companyId: String(compId),
      role: exp.role || '',
      ctc: exp.ctc ? String(exp.ctc) : '',
      batch: exp.batch !== undefined && exp.batch !== null ? String(exp.batch) : '',
      status: exp.status || 'Published',
      overallExperience: exp.overallExperience || '',
      rounds: parsedRounds
    });
    setExpFormError(null);
    setExperienceModal({ mode: 'edit', data: exp });
  };

  const handleRoundFieldChange = (roundIndex, field, value) => {
    setExpForm((prev) => {
      const newRounds = [...prev.rounds];
      newRounds[roundIndex] = { ...newRounds[roundIndex], [field]: value };
      return { ...prev, rounds: newRounds };
    });
  };

  const handleQuestionFieldChange = (roundIndex, qIndex, field, value) => {
    setExpForm((prev) => {
      const newRounds = [...prev.rounds];
      const newQuestions = [...(newRounds[roundIndex].questions || [])];
      newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
      newRounds[roundIndex] = { ...newRounds[roundIndex], questions: newQuestions };
      return { ...prev, rounds: newRounds };
    });
  };

  const addQuestionToRound = (roundIndex) => {
    setExpForm((prev) => {
      const newRounds = [...prev.rounds];
      const newQuestions = [...(newRounds[roundIndex].questions || []), { text: '', solveLink: '' }];
      newRounds[roundIndex] = { ...newRounds[roundIndex], questions: newQuestions };
      return { ...prev, rounds: newRounds };
    });
  };

  const removeQuestionFromRound = (roundIndex, qIndex) => {
    setExpForm((prev) => {
      const newRounds = [...prev.rounds];
      const newQuestions = (newRounds[roundIndex].questions || []).filter((_, idx) => idx !== qIndex);
      newRounds[roundIndex] = {
        ...newRounds[roundIndex],
        questions: newQuestions.length > 0 ? newQuestions : [{ text: '', solveLink: '' }]
      };
      return { ...prev, rounds: newRounds };
    });
  };

  const addRoundToExp = () => {
    setExpForm((prev) => ({
      ...prev,
      rounds: [
        ...prev.rounds,
        {
          roundNumber: prev.rounds.length + 1,
          type: 'Technical',
          notes: '',
          questions: [{ text: '', solveLink: '' }]
        }
      ]
    }));
  };

  const removeRoundFromExp = (roundIndex) => {
    setExpForm((prev) => {
      if (prev.rounds.length <= 1) return prev;
      const newRounds = prev.rounds
        .filter((_, idx) => idx !== roundIndex)
        .map((r, idx) => ({ ...r, roundNumber: idx + 1 }));
      return { ...prev, rounds: newRounds };
    });
  };

  const handleExperienceSubmit = async (e) => {
    e.preventDefault();
    if (!expForm.companyId) {
      setExpFormError('Please select a company.');
      return;
    }
    if (!expForm.role.trim()) {
      setExpFormError('Please enter a job role.');
      return;
    }

    try {
      setExpFormSubmitting(true);
      setExpFormError(null);

      const formattedRounds = expForm.rounds.map((r, idx) => {
        const cleanQuestions = (r.questions || [])
          .map((q) => ({
            text: (q.text || '').trim(),
            solveLink: (q.solveLink || '').trim()
          }))
          .filter((q) => q.text.length > 0 || q.solveLink.length > 0);

        const notesArray = typeof r.notes === 'string'
          ? r.notes.split('\n').map((n) => n.trim()).filter(Boolean)
          : Array.isArray(r.notes) ? r.notes : [];

        return {
          roundNumber: idx + 1,
          type: r.type || 'Technical',
          notes: notesArray,
          questions: cleanQuestions
        };
      });

      const payload = {
        companyId: expForm.companyId,
        role: expForm.role.trim(),
        ctc: expForm.ctc.trim() || 'Role Based',
        batch: String(expForm.batch).trim() || String(new Date().getFullYear()),
        status: expForm.status,
        overallExperience: expForm.overallExperience.trim(),
        rounds: formattedRounds
      };

      if (experienceModal.mode === 'create') {
        await interviewAdminService.createExperience(payload);
        showFeedback('Experience created successfully.');
      } else {
        await interviewAdminService.updateExperience(experienceModal.data._id, payload);
        showFeedback('Experience details updated.');
        if (inspectItem?._id === experienceModal.data._id) {
          setInspectItem((prev) => ({ ...prev, ...payload }));
        }
      }

      setExperienceModal(null);
      fetchExperiences(page);
    } catch (err) {
      console.error('Failed to save experience:', err);
      setExpFormError(err.response?.data?.message || err.message || 'Failed to save experience');
    } finally {
      setExpFormSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // COMPANIES STATE & ACTIONS
  // -------------------------------------------------------------
  const [companies, setCompanies] = useState([]);
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState(null);

  const [compSearch, setCompSearch] = useState('');
  const [compStatusFilter, setCompStatusFilter] = useState('all');
  const [compTypeFilter, setCompTypeFilter] = useState('all');

  // Company Modals
  const [companyModal, setCompanyModal] = useState(null); // { mode: 'create' | 'edit', data: object | null }
  const [companyForm, setCompanyForm] = useState({
    name: '',
    logo: '',
    type: 'Product',
    cutoff: '',
    industry: '',
    website: '',
    description: '',
    status: 'Active',
    eligibleBranches: [...ALL_BRANCHES]
  });
  const [companySubmitting, setCompanySubmitting] = useState(false);
  const [companyFormError, setCompanyFormError] = useState(null);

  const [deactivatingCompany, setDeactivatingCompany] = useState(null);
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);
  const [deactivateError, setDeactivateError] = useState(null);

  const fetchCompanies = useCallback(async () => {
    if (!canViewCompanies) return;
    try {
      setCompLoading(true);
      setCompError(null);
      const data = await interviewAdminService.getCompanies();
      const compList = Array.isArray(data) ? data : (data.companies || []);
      setCompanies(compList);
    } catch (err) {
      console.error('Failed to load companies:', err);
      setCompError(err.response?.data?.message || err.message || 'Failed to load companies');
    } finally {
      setCompLoading(false);
    }
  }, [canViewCompanies]);

  useEffect(() => {
    if (canViewCompanies) {
      fetchCompanies();
    }
  }, [fetchCompanies, canViewCompanies, activeTab]);

  const openCreateCompanyModal = () => {
    setCompanyModal({ mode: 'create', data: null });
    setCompanyForm({
      name: '',
      logo: '',
      type: 'Product',
      cutoff: '',
      industry: '',
      website: '',
      description: '',
      status: 'Active',
      eligibleBranches: [...ALL_BRANCHES]
    });
    setCompanyFormError(null);
  };

  const openEditCompanyModal = (comp) => {
    setCompanyModal({ mode: 'edit', data: comp });
    setCompanyForm({
      name: comp.name || '',
      logo: comp.logo || '',
      type: comp.type || 'Product',
      cutoff: comp.cutoff !== undefined && comp.cutoff !== null ? String(comp.cutoff) : '',
      industry: comp.industry || '',
      website: comp.website || '',
      description: comp.description || '',
      status: comp.status || (comp.isActive === false ? 'Inactive' : 'Active'),
      eligibleBranches: Array.isArray(comp.eligibleBranches) && comp.eligibleBranches.length > 0
        ? comp.eligibleBranches
        : [...ALL_BRANCHES]
    });
    setCompanyFormError(null);
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    if (!companyForm.name.trim()) {
      setCompanyFormError('Company name is required');
      return;
    }

    try {
      setCompanySubmitting(true);
      setCompanyFormError(null);

      let parsedCutoff = undefined;
      if (companyForm.cutoff !== undefined && companyForm.cutoff !== null && String(companyForm.cutoff).trim() !== '') {
        const num = parseFloat(String(companyForm.cutoff).replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) parsedCutoff = num;
      }

      const payload = {
        name: companyForm.name.trim(),
        logo: companyForm.logo ? String(companyForm.logo).trim() : undefined,
        type: companyForm.type,
        cutoff: parsedCutoff,
        industry: companyForm.industry ? String(companyForm.industry).trim() : undefined,
        website: companyForm.website ? String(companyForm.website).trim() : undefined,
        description: companyForm.description ? String(companyForm.description).trim() : undefined,
        status: companyForm.status,
        isActive: companyForm.status === 'Active',
        eligibleBranches: companyForm.eligibleBranches
      };

      if (companyModal.mode === 'create') {
        if (!canCreateCompany) return;
        await interviewAdminService.createCompany(payload);
        showFeedback('Company created successfully.');
      } else {
        if (!canUpdateCompany) return;
        await interviewAdminService.updateCompany(companyModal.data._id, payload);
        showFeedback('Company updated successfully.');
      }

      setCompanyModal(null);
      fetchCompanies();
    } catch (err) {
      console.error('Company save error:', err);
      setCompanyFormError(err.response?.data?.message || err.message || 'Failed to save company');
    } finally {
      setCompanySubmitting(false);
    }
  };

  const handleDeactivateSubmit = async () => {
    if (!canDeleteCompany || !deactivatingCompany) return;
    try {
      setDeactivateSubmitting(true);
      setDeactivateError(null);

      const res = await interviewAdminService.deleteCompany(deactivatingCompany._id);
      if (res.deactivated) {
        showFeedback('Company has experiences and was safely deactivated.');
      } else {
        showFeedback('Company deleted successfully.');
      }
      setDeactivatingCompany(null);
      fetchCompanies();
    } catch (err) {
      console.error('Company delete error:', err);
      setDeactivateError(err.response?.data?.message || err.message || 'Failed to remove/deactivate company');
    } finally {
      setDeactivateSubmitting(false);
    }
  };

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (compStatusFilter !== 'all') {
        const cStatus = c.status || (c.isActive === false ? 'Inactive' : 'Active');
        if (cStatus !== compStatusFilter) return false;
      }
      if (compTypeFilter !== 'all' && c.type !== compTypeFilter) {
        return false;
      }
      if (compSearch.trim()) {
        const q = compSearch.toLowerCase();
        const nameMatch = c.name?.toLowerCase().includes(q);
        const indMatch = c.industry?.toLowerCase().includes(q);
        if (!nameMatch && !indMatch) return false;
      }
      return true;
    });
  }, [companies, compStatusFilter, compTypeFilter, compSearch]);

  // Metric computations
  const experienceStats = useMemo(() => {
    let pending = 0;
    let published = 0;
    let rejectedOrArchived = 0;

    experiences.forEach((exp) => {
      if (exp.status === 'Pending') pending++;
      else if (exp.status === 'Published') published++;
      else if (exp.status === 'Rejected' || exp.status === 'Archived') rejectedOrArchived++;
    });

    return {
      total: totalCount,
      pending,
      published,
      rejectedOrArchived
    };
  }, [experiences, totalCount]);

  const companyStats = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let linkedExperiences = 0;

    companies.forEach((c) => {
      const isAct = c.status === 'Active' || (c.status !== 'Inactive' && c.isActive !== false);
      if (isAct) active++;
      else inactive++;
      linkedExperiences += c.experienceCount || 0;
    });

    return {
      total: companies.length,
      active,
      inactive,
      linkedExperiences
    };
  }, [companies]);

  const hasActiveExpFilters =
    activeSearch || statusFilter !== 'all' || batchFilter || sortFilter !== 'newest';

  const hasActiveCompFilters = compSearch || compStatusFilter !== 'all' || compTypeFilter !== 'all';

  if (!canView && !canViewCompanies) {
    return (
      <div className="p-6 text-center text-xs font-mono text-gray-500">
        You do not have permission to view Interview Experiences or Companies.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toast Feedback Banner */}
      {feedback && (
        <div
          className={`p-2.5 text-xs font-mono flex items-center justify-between border ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Subtabs */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Interviews & Companies
            </h1>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {activeTab === 'experiences' ? (
                <>
                  <span>Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{experienceStats.total}</span></span>
                  <span className="text-gray-300 dark:text-zinc-700">|</span>
                  <span>Pending: <span className="font-semibold text-amber-600 dark:text-amber-400">{experienceStats.pending}</span></span>
                  <span className="text-gray-300 dark:text-zinc-700">|</span>
                  <span>Published: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{experienceStats.published}</span></span>
                  <span className="text-gray-300 dark:text-zinc-700">|</span>
                  <span>Rejected/Archived: <span className="font-semibold text-gray-700 dark:text-gray-300">{experienceStats.rejectedOrArchived}</span></span>
                </>
              ) : (
                <>
                  <span>Total Companies: <span className="font-semibold text-gray-900 dark:text-gray-100">{companyStats.total}</span></span>
                  <span className="text-gray-300 dark:text-zinc-700">|</span>
                  <span>Active: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{companyStats.active}</span></span>
                  <span className="text-gray-300 dark:text-zinc-700">|</span>
                  <span>Inactive: <span className="font-semibold text-gray-500">{companyStats.inactive}</span></span>
                  <span className="text-gray-300 dark:text-zinc-700">|</span>
                  <span>Linked Experiences: <span className="font-semibold text-blue-600 dark:text-blue-400">{companyStats.linkedExperiences}</span></span>
                </>
              )}
            </div>
          </div>

          {/* Tab Actions */}
          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            {activeTab === 'experiences' && canCreate && (
              <button
                type="button"
                onClick={openCreateExperienceModal}
                className="rounded-none border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-gray-100 active:bg-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-700 font-sans"
              >
                + Add Experience
              </button>
            )}
            {activeTab === 'companies' && canCreateCompany && (
              <button
                type="button"
                onClick={openCreateCompanyModal}
                className="rounded-none border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-gray-100 active:bg-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-700 font-sans"
              >
                + Add Company
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'experiences') fetchExperiences(page);
                else fetchCompanies();
              }}
              className="rounded-none border border-gray-300 bg-white px-2 py-1 text-xs font-mono text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 inline-flex items-center gap-1"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Subtabs Switcher */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 pt-1 pb-1">
          {canView && (
            <button
              type="button"
              onClick={() => setActiveTab('experiences')}
              className={`px-3 py-1 text-xs font-mono font-semibold transition-colors ${
                activeTab === 'experiences'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              EXPERIENCES ({experienceStats.total})
            </button>
          )}
          {canViewCompanies && (
            <button
              type="button"
              onClick={() => setActiveTab('companies')}
              className={`px-3 py-1 text-xs font-mono font-semibold transition-colors ${
                activeTab === 'companies'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              COMPANIES ({companyStats.total})
            </button>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: EXPERIENCES */}
      {/* ============================================================= */}
      {activeTab === 'experiences' && canView && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
              <label htmlFor="exp-search" className="text-gray-600 dark:text-gray-400 whitespace-nowrap text-[11px]">
                Search:
              </label>
              <input
                id="exp-search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Role or keywords..."
                className="flex-1 sm:w-44 rounded-none border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
              />
              <button
                type="submit"
                className="rounded-none border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700 font-sans"
              >
                Search
              </button>
            </form>

            <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1">
              <label htmlFor="status-select" className="text-gray-600 dark:text-gray-400 text-[11px]">
                Status:
              </label>
              <select
                id="status-select"
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
                  setPage(1);
                  fetchExperiences(1, null, val);
                }}
                className="rounded-none border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st === 'all' ? 'All Statuses' : st}
                  </option>
                ))}
              </select>
            </div>

            <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

            {/* Batch Dropdown */}
            <div className="flex items-center gap-1">
              <label htmlFor="batch-select" className="text-gray-600 dark:text-gray-400 text-[11px]">
                Batch:
              </label>
              <select
                id="batch-select"
                value={batchFilter}
                onChange={(e) => {
                  setBatchFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-none border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
              >
                <option value="">All Batches</option>
                {BATCH_OPTIONS.filter(Boolean).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <label htmlFor="sort-select" className="text-gray-600 dark:text-gray-400 text-[11px]">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortFilter}
                onChange={(e) => {
                  setSortFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-none border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="upvotes">Most Upvoted</option>
              </select>
            </div>

            {hasActiveExpFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-red-600 hover:underline dark:text-red-400"
              >
                [Clear Filters]
              </button>
            )}
          </div>

          {/* Error Banner */}
          {expError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-mono flex items-center justify-between">
              <span>{expError}</span>
              <button
                type="button"
                onClick={() => fetchExperiences(page)}
                className="underline hover:text-rose-950 dark:hover:text-rose-100 ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table or Skeletons */}
          {expLoading ? (
            <div className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : experiences.length === 0 ? (
            <div className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-8 text-center">
              <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                {hasActiveExpFilters
                  ? 'No interview experiences match your current filters.'
                  : 'No interview experiences found in database.'}
              </p>
              {hasActiveExpFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-2 text-xs text-blue-600 hover:underline dark:text-blue-400 font-mono"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b]">
              <table className="w-full text-left text-xs text-gray-900 dark:text-gray-100 font-sans border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 font-mono text-[11px] text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    <th className="p-2 border-r border-gray-200 dark:border-zinc-800">Company</th>
                    <th className="p-2 border-r border-gray-200 dark:border-zinc-800">Role</th>
                    <th className="p-2 border-r border-gray-200 dark:border-zinc-800">CTC</th>
                    <th className="p-2 border-r border-gray-200 dark:border-zinc-800">Batch</th>
                    <th className="p-2 border-r border-gray-200 dark:border-zinc-800">Status</th>
                    <th className="p-2 border-r border-gray-200 dark:border-zinc-800">Upvotes</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {paginatedExperiences.map((exp) => {
                    const companyName = exp.company?.name || exp.companyId?.name || (typeof exp.company === 'string' ? exp.company : '—');
                    const companyLogo = exp.company?.logo || exp.companyId?.logo;

                    return (
                      <tr
                        key={exp._id}
                        className="hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        {/* Company */}
                        <td className="p-2 border-r border-gray-200 dark:border-zinc-800 font-medium">
                          <div className="flex items-center gap-2">
                            {companyLogo ? (
                              <img
                                src={companyLogo}
                                alt={companyName}
                                className="w-5 h-5 object-contain rounded bg-white dark:bg-zinc-800 p-0.5 border border-gray-200 dark:border-zinc-700"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-mono flex items-center justify-center font-bold">
                                {companyName.charAt(0) || 'C'}
                              </span>
                            )}
                            <span className="truncate max-w-[150px]" title={companyName}>
                              {companyName}
                            </span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="p-2 border-r border-gray-200 dark:border-zinc-800 font-medium">
                          <span className="truncate max-w-[160px] inline-block" title={exp.role}>
                            {exp.role || '—'}
                          </span>
                        </td>

                        {/* CTC */}
                        <td className="p-2 border-r border-gray-200 dark:border-zinc-800 font-mono text-[11px] whitespace-nowrap">
                          {exp.ctc ? (String(exp.ctc).toUpperCase().includes('LPA') ? exp.ctc : `${exp.ctc} LPA`) : '—'}
                        </td>

                        {/* Batch */}
                        <td className="p-2 border-r border-gray-200 dark:border-zinc-800 font-mono text-[11px] whitespace-nowrap">
                          {exp.batch || '—'}
                        </td>


                        {/* Status */}
                        <td className="p-2 border-r border-gray-200 dark:border-zinc-800 whitespace-nowrap">
                          <span
                            className={`inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                              exp.status === 'Published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : exp.status === 'Pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                                : exp.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                                : 'bg-zinc-100 text-zinc-600 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                            }`}
                          >
                            {exp.status || 'Published'}
                          </span>
                        </td>

                        {/* Upvotes */}
                        <td className="p-2 border-r border-gray-200 dark:border-zinc-800 font-mono text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 text-gray-400" />
                            <span>{exp.upvotes || 0}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-2 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 font-mono text-[11px]">
                            {/* Inspect */}
                            <button
                              type="button"
                              onClick={() => setInspectItem(exp)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400"
                              title="Inspect Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            {canPublish && (
                              <button
                                type="button"
                                onClick={() => openEditExperienceModal(exp)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Approve */}
                            {canPublish && exp.status !== 'Published' && (
                              <button
                                type="button"
                                onClick={() => handleApprove(exp._id)}
                                className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                title="Approve & Publish"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Reject */}
                            {canPublish && exp.status !== 'Rejected' && exp.status !== 'Archived' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingItem(exp);
                                  setRejectReason(exp.rejectionReason || '');
                                  setRejectError(null);
                                }}
                                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                                title="Reject"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Archive */}
                            {canArchive && exp.status !== 'Archived' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setArchivingItem(exp);
                                  setArchiveError(null);
                                }}
                                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                title="Archive"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!expLoading && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-gray-600 dark:text-gray-400 pt-2 select-none border-t border-gray-200 dark:border-zinc-800">
              <div>
                Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{(page - 1) * limit + 1}</span>–<span className="font-semibold text-gray-900 dark:text-gray-100">{Math.min(page * limit, totalCount)}</span> of{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">{totalCount}</span> experiences (Page {page} of {totalPages})
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-2 py-0.5 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 font-sans"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1 px-1">
                  {getPaginationRange().map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`px-2 py-0.5 border text-xs font-mono ${
                        p === page
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold dark:bg-blue-950/50 dark:border-blue-500 dark:text-blue-300'
                          : 'border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-2 py-0.5 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 font-sans"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: COMPANIES */}
      {/* ============================================================= */}
      {activeTab === 'companies' && canViewCompanies && (
        <div className="space-y-3">
          {/* Companies Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Search */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <label htmlFor="comp-search" className="text-gray-600 dark:text-gray-400 whitespace-nowrap text-[11px]">
                Search:
              </label>
              <input
                id="comp-search"
                type="text"
                value={compSearch}
                onChange={(e) => setCompSearch(e.target.value)}
                placeholder="Name or Industry..."
                className="flex-1 sm:w-48 rounded-none border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
              />
            </div>

            <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <label htmlFor="comp-status" className="text-gray-600 dark:text-gray-400 text-[11px]">
                Status:
              </label>
              <select
                id="comp-status"
                value={compStatusFilter}
                onChange={(e) => setCompStatusFilter(e.target.value)}
                className="rounded-none border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>

            {/* Type Filter */}
            <div className="flex items-center gap-1">
              <label htmlFor="comp-type" className="text-gray-600 dark:text-gray-400 text-[11px]">
                Type:
              </label>
              <select
                id="comp-type"
                value={compTypeFilter}
                onChange={(e) => setCompTypeFilter(e.target.value)}
                className="rounded-none border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
              >
                <option value="all">All Types</option>
                {COMPANY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveCompFilters && (
              <button
                type="button"
                onClick={() => {
                  setCompSearch('');
                  setCompStatusFilter('all');
                  setCompTypeFilter('all');
                }}
                className="text-xs text-red-600 hover:underline dark:text-red-400"
              >
                [Clear Filters]
              </button>
            )}
          </div>

          {/* Error Banner */}
          {compError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-mono flex items-center justify-between">
              <span>{compError}</span>
              <button
                type="button"
                onClick={fetchCompanies}
                className="underline hover:text-rose-950 dark:hover:text-rose-100 ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table or Loading */}
          {compLoading ? (
            <div className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-8 text-center">
              <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                {hasActiveCompFilters
                  ? 'No companies match your current filters.'
                  : 'No companies found in database.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b]">
              <table className="w-full text-left text-xs text-gray-900 dark:text-gray-100 font-sans border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 font-mono text-[11px] text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    <th className="p-2 border-r border-gray-200 dark:border-zinc-800">Company</th>
                    <th className="p-2 border-r border-gray-200 dark:border-zinc-800">Cutoff</th>
                    <th className="p-2 border-r border-gray-200 dark:border-zinc-800">Experiences</th>
                    <th className="p-2 border-r border-gray-200 dark:border-zinc-800">Status</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {filteredCompanies.map((c) => {
                    const isAct = c.status === 'Active' || (c.status !== 'Inactive' && c.isActive !== false);

                    return (
                      <tr
                        key={c._id}
                        className="hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        {/* Company */}
                        <td className="p-2 border-r border-gray-200 dark:border-zinc-800 font-medium">
                          <div className="flex items-center gap-2">
                            {c.logo ? (
                              <img
                                src={c.logo}
                                alt={c.name}
                                className="w-6 h-6 object-contain rounded bg-white dark:bg-zinc-800 p-0.5 border border-gray-200 dark:border-zinc-700"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="w-6 h-6 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-mono flex items-center justify-center font-bold">
                                {c.name?.charAt(0) || 'C'}
                              </span>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {c.industry && (
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                    {c.industry}
                                  </span>
                                )}
                                {c.industry && c.website && (
                                  <span className="text-gray-300 dark:text-zinc-700 text-[10px]">·</span>
                                )}
                                {c.website && (
                                  <a
                                    href={c.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                                  >
                                    <span>Website</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cutoff */}
                        <td className="p-2 border-r border-gray-200 dark:border-zinc-800 font-mono text-[11px] whitespace-nowrap">
                          {c.cutoff || '—'}
                        </td>

                        {/* Experience Count */}
                        <td className="p-2 border-r border-gray-200 dark:border-zinc-800 font-mono text-[11px] whitespace-nowrap">
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 font-semibold">
                            {c.experienceCount || 0}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-2 border-r border-gray-200 dark:border-zinc-800 whitespace-nowrap">
                          <span
                            className={`inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                              isAct
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-zinc-100 text-zinc-600 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                            }`}
                          >
                            {isAct ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-2 text-right whitespace-nowrap font-mono text-[11px]">
                          <div className="inline-flex items-center gap-1">
                            {canUpdateCompany && (
                              <button
                                type="button"
                                onClick={() => openEditCompanyModal(c)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                                title="Edit Company"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDeleteCompany && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeactivatingCompany(c);
                                  setDeactivateError(null);
                                }}
                                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                                title={c.experienceCount > 0 ? 'Deactivate Company' : 'Delete Company'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: INSPECT EXPERIENCE DETAILS */}
      {/* ============================================================= */}
      {inspectItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setInspectItem(null)}
        >
          <div
            className="w-full max-w-2xl border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-md dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100 max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">
                  Interview Experience Details
                </span>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {inspectItem.role} @ {inspectItem.company?.name || inspectItem.companyId?.name || (typeof inspectItem.company === 'string' ? inspectItem.company : 'Company')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono bg-gray-50 dark:bg-zinc-900/50 p-2.5 border border-gray-200 dark:border-zinc-800">
              <div>
                <span className="text-gray-500 text-[10px] block">CTC:</span>
                <span className="font-semibold">{inspectItem.ctc ? `${inspectItem.ctc} LPA` : '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Batch:</span>
                <span className="font-semibold">{inspectItem.batch || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Status:</span>
                <span className="font-bold uppercase text-blue-600 dark:text-blue-400">{inspectItem.status || 'Published'}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Upvotes:</span>
                <span className="font-semibold">{inspectItem.upvotes || 0}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500 text-[10px] block">Author:</span>
                <span className="truncate block font-semibold">{inspectItem.user?.name || inspectItem.user?.email || 'Anonymous / Student'}</span>
              </div>
            </div>

            {/* Rejection notice if present */}
            {inspectItem.rejectionReason && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300 font-mono text-xs">
                <span className="font-bold block">Rejection Reason:</span>
                <span>{inspectItem.rejectionReason}</span>
              </div>
            )}

            {/* Overall Experience */}
            <div>
              <h3 className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 font-mono text-[11px] mb-1">
                Overall Experience & Summary
              </h3>
              <p className="whitespace-pre-line text-gray-800 dark:text-gray-200 bg-gray-50/50 dark:bg-zinc-900/30 p-2.5 border border-gray-200 dark:border-zinc-800 leading-relaxed">
                {inspectItem.overallExperience || 'No summary notes provided.'}
              </p>
            </div>

            {/* Rounds breakdown */}
            {inspectItem.rounds && inspectItem.rounds.length > 0 && (
              <div>
                <h3 className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 font-mono text-[11px] mb-1.5">
                  Interview Rounds ({inspectItem.rounds.length})
                </h3>
                <div className="space-y-2">
                  {inspectItem.rounds.map((r, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 dark:border-zinc-800 p-2.5 bg-white dark:bg-zinc-900/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          Round {r.roundNumber || idx + 1}: {r.roundName || 'Round'}
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 uppercase text-[10px]">
                          {r.roundType || 'General'}
                        </span>
                      </div>
                      {r.notes && (
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-[11px]">
                          {r.notes}
                        </p>
                      )}
                      {r.questions && r.questions.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-gray-100 dark:border-zinc-800">
                          <span className="text-[10px] font-mono text-gray-500 block mb-0.5">Questions asked:</span>
                          <ul className="list-disc list-inside space-y-1 text-gray-800 dark:text-gray-200 text-[11px]">
                            {r.questions.map((q, qIdx) => (
                              <li key={qIdx} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span>{typeof q === 'string' ? q : (q.text || q.title || q.questionText || q.topic || 'Question')}</span>
                                {typeof q === 'object' && q.solveLink && (
                                  <a
                                    href={q.solveLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-blue-600 hover:underline dark:text-blue-400 font-mono inline-flex items-center gap-0.5"
                                  >
                                    <span>[LeetCode / Practice Link]</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {canPublish && inspectItem.status !== 'Published' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(inspectItem._id)}
                    className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700 font-sans font-medium text-xs"
                  >
                    Approve & Publish
                  </button>
                )}
                {canPublish && inspectItem.status !== 'Rejected' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingItem(inspectItem);
                      setRejectReason(inspectItem.rejectionReason || '');
                    }}
                    className="px-3 py-1 bg-rose-600 text-white hover:bg-rose-700 font-sans font-medium text-xs"
                  >
                    Reject
                  </button>
                )}
                {canArchive && inspectItem.status !== 'Archived' && (
                  <button
                    type="button"
                    onClick={() => setArchivingItem(inspectItem)}
                    className="px-3 py-1 border border-zinc-400 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-sans font-medium text-xs"
                  >
                    Archive
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="px-3 py-1 border border-gray-300 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: CREATE / EDIT EXPERIENCE */}
      {/* ============================================================= */}
      {experienceModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setExperienceModal(null)}
        >
          <div
            className="w-full max-w-2xl border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-md dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
              <h2 className="font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 font-mono">
                {experienceModal.mode === 'create' ? '+ Add Interview Experience' : 'Edit Interview Experience'}
              </h2>
              <button
                type="button"
                onClick={() => setExperienceModal(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {expFormError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 font-mono text-xs mt-3">
                {expFormError}
              </div>
            )}

            <form onSubmit={handleExperienceSubmit} className="mt-3 space-y-3 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-mono text-[11px] mb-0.5">
                    Select Company: <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={expForm.companyId}
                    onChange={(e) => setExpForm({ ...expForm, companyId: e.target.value })}
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
                  >
                    <option value="">Select Company...</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-mono text-[11px] mb-0.5">
                    Job Role: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={expForm.role}
                    onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
                    placeholder="e.g. Software Development Engineer"
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-[11px] mb-0.5">
                    CTC (in LPA):
                  </label>
                  <input
                    type="text"
                    value={expForm.ctc}
                    onChange={(e) => setExpForm({ ...expForm, ctc: e.target.value })}
                    placeholder="e.g. 14"
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-[11px] mb-0.5">
                    Batch:
                  </label>
                  <input
                    type="text"
                    value={expForm.batch}
                    onChange={(e) => setExpForm({ ...expForm, batch: e.target.value })}
                    placeholder="e.g. 2026"
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-[11px] mb-0.5">
                    Status:
                  </label>
                  <select
                    value={expForm.status}
                    onChange={(e) => setExpForm({ ...expForm, status: e.target.value })}
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
                  >
                    <option value="Published">Published</option>
                    <option value="Pending">Pending</option>
                    <option value="Archived">Archived</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-mono text-[11px] mb-0.5">
                  Overall Experience / Advice:
                </label>
                <textarea
                  rows={3}
                  value={expForm.overallExperience}
                  onChange={(e) => setExpForm({ ...expForm, overallExperience: e.target.value })}
                  placeholder="General interview preparation tips, process timeline, or feedback..."
                  className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
                />
              </div>

              {/* Dynamic Interview Rounds & Questions */}
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 font-mono text-xs uppercase tracking-wider">
                    Interview Rounds & Questions ({expForm.rounds.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addRoundToExp}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Round</span>
                  </button>
                </div>

                {expForm.rounds.map((round, rIdx) => (
                  <div
                    key={rIdx}
                    className="border border-gray-300 dark:border-zinc-700 p-3 bg-gray-50/50 dark:bg-zinc-900/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs font-mono text-gray-900 dark:text-gray-100">
                          Round {rIdx + 1}
                        </span>
                        <select
                          value={round.type}
                          onChange={(e) => handleRoundFieldChange(rIdx, 'type', e.target.value)}
                          className="rounded-none border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-mono"
                        >
                          {ROUND_TYPES.map((rt) => (
                            <option key={rt} value={rt}>
                              {rt}
                            </option>
                          ))}
                        </select>
                      </div>
                      {expForm.rounds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRoundFromExp(rIdx)}
                          className="text-rose-600 hover:text-rose-800 dark:text-rose-400 text-xs font-mono inline-flex items-center gap-0.5"
                          title="Delete this round"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Round</span>
                        </button>
                      )}
                    </div>

                    {/* Round Notes */}
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 font-mono text-[10px] mb-0.5">
                        Round Notes / Overview:
                      </label>
                      <textarea
                        rows={2}
                        value={round.notes}
                        onChange={(e) => handleRoundFieldChange(rIdx, 'notes', e.target.value)}
                        placeholder="e.g. 60 min technical round with 2 coding problems and resume walkthrough..."
                        className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
                      />
                    </div>

                    {/* Questions in this round */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-gray-700 dark:text-gray-300 font-semibold">
                          Interview Questions & DSA Problems:
                        </span>
                        <button
                          type="button"
                          onClick={() => addQuestionToRound(rIdx)}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-mono inline-flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Question</span>
                        </button>
                      </div>

                      {(round.questions || []).map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="p-2 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-gray-500 font-semibold">
                              Question {qIdx + 1}
                            </span>
                            {(round.questions || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeQuestionFromRound(rIdx, qIdx)}
                                className="text-rose-600 hover:text-rose-800 dark:text-rose-400 p-0.5"
                                title="Remove Question"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div>
                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => handleQuestionFieldChange(rIdx, qIdx, 'text', e.target.value)}
                              placeholder="Interview question or DSA problem title (e.g. Reverse Linked List, Invert Binary Tree)"
                              className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                              LeetCode / Solve Link:
                            </span>
                            <input
                              type="url"
                              value={q.solveLink}
                              onChange={(e) => handleQuestionFieldChange(rIdx, qIdx, 'solveLink', e.target.value)}
                              placeholder="https://leetcode.com/problems/..."
                              className="flex-1 rounded-none border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExperienceModal(null)}
                  className="px-3 py-1 border border-gray-300 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expFormSubmitting}
                  className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 text-xs font-sans font-medium disabled:opacity-50"
                >
                  {experienceModal.mode === 'create'
                    ? (expFormSubmitting ? 'Creating...' : 'Create Experience')
                    : (expFormSubmitting ? 'Saving...' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: REJECT EXPERIENCE */}
      {/* ============================================================= */}
      {rejectingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setRejectingItem(null)}
        >
          <div
            className="w-full max-w-md border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-md dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
              <h2 className="font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">
                Reject Experience Submission
              </h2>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {rejectError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 font-mono text-xs mt-3">
                {rejectError}
              </div>
            )}

            <form onSubmit={handleRejectSubmit} className="mt-3 space-y-3 font-sans">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to reject the submission for{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {rejectingItem.role} @ {rejectingItem.company?.name || 'Company'}
                </span>
                ? You can provide a reason below for student visibility.
              </p>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-mono text-[11px] mb-0.5">
                  Reason for rejection:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Incomplete details, lacks round breakdown, or inappropriate content..."
                  className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-rose-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                {['Incomplete round details', 'Inappropriate or spam content', 'Duplicate submission'].map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className="px-1.5 py-0.5 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 text-gray-600 dark:text-gray-300"
                    >
                      + {preset}
                    </button>
                  )
                )}
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-3 py-1 border border-gray-300 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectSubmitting}
                  className="px-3 py-1 bg-rose-600 text-white hover:bg-rose-700 text-xs font-sans font-medium disabled:opacity-50"
                >
                  {rejectSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: ARCHIVE EXPERIENCE */}
      {/* ============================================================= */}
      {archivingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setArchivingItem(null)}
        >
          <div
            className="w-full max-w-md border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-md dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
              <h2 className="font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 font-mono">
                Archive Experience
              </h2>
              <button
                type="button"
                onClick={() => setArchivingItem(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {archiveError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 font-mono text-xs mt-3">
                {archiveError}
              </div>
            )}

            <div className="mt-3 space-y-3 font-sans">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to archive this interview experience for{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {archivingItem.role} @ {archivingItem.company?.name || 'Company'}
                </span>
                ? It will be marked as Archived and hidden from public student view.
              </p>

              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setArchivingItem(null)}
                  className="px-3 py-1 border border-gray-300 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-sans"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleArchiveSubmit}
                  disabled={archiveSubmitting}
                  className="px-3 py-1 bg-zinc-800 text-white hover:bg-zinc-900 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white text-xs font-sans font-medium disabled:opacity-50"
                >
                  {archiveSubmitting ? 'Archiving...' : 'Confirm Archive'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 5: ADD / EDIT COMPANY */}
      {/* ============================================================= */}
      {companyModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setCompanyModal(null)}
        >
          <div
            className="w-full max-w-lg border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-md dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
              <h2 className="font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 font-mono">
                {companyModal.mode === 'create' ? '+ Add New Company' : 'Edit Company'}
              </h2>
              <button
                type="button"
                onClick={() => setCompanyModal(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {companyFormError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 font-mono text-xs mt-3">
                {companyFormError}
              </div>
            )}

            <form onSubmit={handleCompanySubmit} className="mt-3 space-y-3 font-sans">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-mono text-[11px] mb-0.5">
                  Company Name: *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  placeholder="e.g. Google, Cisco, Infosys..."
                  className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-mono text-[11px] mb-0.5">
                  Logo Image URL:
                </label>
                <input
                  type="url"
                  value={companyForm.logo}
                  onChange={(e) => setCompanyForm({ ...companyForm, logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-[11px] mb-0.5">
                    Type:
                  </label>
                  <select
                    value={companyForm.type}
                    onChange={(e) => setCompanyForm({ ...companyForm, type: e.target.value })}
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
                  >
                    {COMPANY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-[11px] mb-0.5">
                    Cutoff:
                  </label>
                  <input
                    type="text"
                    value={companyForm.cutoff}
                    onChange={(e) => setCompanyForm({ ...companyForm, cutoff: e.target.value })}
                    placeholder="e.g. 7.5 CGPA"
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-[11px] mb-0.5">
                    Industry:
                  </label>
                  <input
                    type="text"
                    value={companyForm.industry}
                    onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                    placeholder="e.g. FinTech / Software"
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-[11px] mb-0.5">
                    Status:
                  </label>
                  <select
                    value={companyForm.status}
                    onChange={(e) => setCompanyForm({ ...companyForm, status: e.target.value })}
                    className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100 font-sans"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-mono text-[11px] mb-0.5">
                  Website URL:
                </label>
                <input
                  type="url"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                    Eligible Branches:
                  </label>
                  <div className="flex gap-2 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setCompanyForm({ ...companyForm, eligibleBranches: [...ALL_BRANCHES] })}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={() => setCompanyForm({ ...companyForm, eligibleBranches: [] })}
                      className="text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_BRANCHES.map((branch) => {
                    const selected = companyForm.eligibleBranches.includes(branch);
                    return (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => {
                          const updated = selected
                            ? companyForm.eligibleBranches.filter((b) => b !== branch)
                            : [...companyForm.eligibleBranches, branch];
                          setCompanyForm({ ...companyForm, eligibleBranches: updated });
                        }}
                        className={`px-2 py-0.5 text-[11px] font-mono border transition-colors ${
                          selected
                            ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-500 dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-400 hover:border-blue-400'
                        }`}
                      >
                        {branch}
                      </button>
                    );
                  })}
                </div>
                {companyForm.eligibleBranches.length === 0 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-1">
                    ⚠ No branch selected — no students will be eligible.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-mono text-[11px] mb-0.5">
                  Description:
                </label>
                <textarea
                  rows={3}
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  placeholder="Company summary, hiring details, or criteria..."
                  className="w-full rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100"
                />
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompanyModal(null)}
                  className="px-3 py-1 border border-gray-300 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={companySubmitting}
                  className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 text-xs font-sans font-medium disabled:opacity-50"
                >
                  {companySubmitting ? 'Saving...' : companyModal.mode === 'create' ? 'Create Company' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 6: DEACTIVATE / DELETE COMPANY */}
      {/* ============================================================= */}
      {deactivatingCompany && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDeactivatingCompany(null)}
        >
          <div
            className="w-full max-w-md border border-gray-300 bg-white p-5 text-xs text-gray-900 shadow-md dark:border-zinc-700 dark:bg-[#18181b] dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
              <h2 className="font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">
                {deactivatingCompany.experienceCount > 0 ? 'Deactivate Company' : 'Delete Company'}
              </h2>
              <button
                type="button"
                onClick={() => setDeactivatingCompany(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {deactivateError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 font-mono text-xs mt-3">
                {deactivateError}
              </div>
            )}

            <div className="mt-3 space-y-3 font-sans">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to remove{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {deactivatingCompany.name}
                </span>
                ?
              </p>

              {deactivatingCompany.experienceCount > 0 ? (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 font-mono text-[11px] leading-relaxed">
                  <strong>Notice:</strong> This company has{' '}
                  <span className="font-bold">{deactivatingCompany.experienceCount}</span> associated interview experience(s).
                  To preserve student interview submissions, the backend will safely mark this company as <strong>Inactive</strong> rather than deleting it.
                </div>
              ) : (
                <p className="text-gray-500 text-xs">
                  This company has 0 linked interview experiences and will be permanently deleted.
                </p>
              )}

              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeactivatingCompany(null)}
                  className="px-3 py-1 border border-gray-300 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-sans"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeactivateSubmit}
                  disabled={deactivateSubmitting}
                  className="px-3 py-1 bg-rose-600 text-white hover:bg-rose-700 text-xs font-sans font-medium disabled:opacity-50"
                >
                  {deactivateSubmitting
                    ? 'Processing...'
                    : deactivatingCompany.experienceCount > 0
                    ? 'Confirm Deactivate'
                    : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewsPage;
