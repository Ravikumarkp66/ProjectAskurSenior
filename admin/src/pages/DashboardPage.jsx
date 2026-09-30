import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  FileText,
  Briefcase,
  Megaphone,
  Sparkles,
  Shield,
  ArrowUpRight,
  RefreshCw,
  Download,
  PlusCircle,
  Upload,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Bug
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { isSuperAdmin } from '../utils/permissions';
import analyticsService from '../services/analyticsService';
import userService from '../services/userService';
import { getStats as getAnnouncementStats } from '../services/announcementAdminService';
import { interviewAdminService } from '../services/interviewAdminService';
import featureService from '../services/featureService';
import securityService from '../services/securityService';
import bugService from '../services/bugService';

export const DashboardPage = () => {
  const { admin } = useAdminAuth();
  const isSuper = isSuperAdmin(admin);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Analytics & Stats Data States
  const [overview, setOverview] = useState({
    totalUsers: 0,
    liveUsers: 0,
    recentlyActiveCount: 0,
    totalFiles: 0,
    totalSubjects: 0,
    pendingUploads: 0,
    uploadsThisMonth: 0
  });

  const [userGrowth, setUserGrowth] = useState({ months: [], counts: [] });
  const [uploadByMonth, setUploadByMonth] = useState({ months: [], notes: [], pyqs: [], questionBanks: [] });
  const [subjectContent, setSubjectContent] = useState({ subjects: [], subjectNames: [], notes: [], pyqs: [], questionBanks: [] });
  const [announcementStats, setAnnouncementStats] = useState({ total: 0, published: 0, scheduled: 0, draft: 0 });
  const [interviewStats, setInterviewStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [featureSummary, setFeatureSummary] = useState({ total: 0, plusCount: 0, freeCount: 0 });
  const [securityOverview, setSecurityOverview] = useState({ activeSessions: 0, highRiskSessions: 0 });
  const [bugStats, setBugStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [trendTab, setTrendTab] = useState('students'); // 'students' | 'uploads'

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const loadAllDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [
        overviewRes,
        userGrowthRes,
        uploadMonthRes,
        subjectContentRes,
        usersRes,
        announcementStatsRes,
        interviewsRes,
        featuresRes,
        securityRes,
        bugsRes
      ] = await Promise.allSettled([
        analyticsService.getOverview(),
        analyticsService.getUserGrowth(),
        analyticsService.getUploadByMonth(),
        analyticsService.getContentBySubject(),
        userService.getUsers({ page: 1, limit: 6, sortBy: 'recent' }),
        getAnnouncementStats(),
        interviewAdminService.getExperiences({ page: 1, limit: 1 }),
        featureService.getFeatures(),
        securityService.getOverview(),
        bugService.getBugs({ limit: 1 })
      ]);

      // Process Overview & Users
      if (overviewRes.status === 'fulfilled' && overviewRes.value) {
        setOverview((prev) => ({
          ...prev,
          ...overviewRes.value
        }));
      }

      if (usersRes.status === 'fulfilled' && usersRes.value) {
        if (usersRes.value.summary) {
          setOverview((prev) => ({
            ...prev,
            totalUsers: usersRes.value.summary.totalUsers || prev.totalUsers,
            liveUsers: usersRes.value.summary.liveUsers ?? prev.liveUsers,
            recentlyActiveCount: usersRes.value.summary.recentlyActiveCount ?? prev.recentlyActiveCount
          }));
        }
        if (Array.isArray(usersRes.value.users)) {
          setRecentStudents(usersRes.value.users.slice(0, 5));
        }
      }

      // Process Charts
      if (userGrowthRes.status === 'fulfilled' && userGrowthRes.value) {
        setUserGrowth(userGrowthRes.value);
      }

      if (uploadMonthRes.status === 'fulfilled' && uploadMonthRes.value) {
        setUploadByMonth(uploadMonthRes.value);
      }

      if (subjectContentRes.status === 'fulfilled' && subjectContentRes.value) {
        setSubjectContent(subjectContentRes.value);
      }

      // Process Content Stats
      if (announcementStatsRes.status === 'fulfilled' && announcementStatsRes.value) {
        setAnnouncementStats(announcementStatsRes.value);
      }

      if (interviewsRes.status === 'fulfilled' && interviewsRes.value) {
        setInterviewStats({
          total: interviewsRes.value.total || 0,
          approved: interviewsRes.value.approvedCount || interviewsRes.value.total || 0,
          pending: interviewsRes.value.pendingCount || 0
        });
      }

      if (featuresRes.status === 'fulfilled' && featuresRes.value?.summary) {
        setFeatureSummary(featuresRes.value.summary);
      }

      if (securityRes.status === 'fulfilled' && securityRes.value?.data) {
        setSecurityOverview(securityRes.value.data);
      }

      if (bugsRes.status === 'fulfilled' && bugsRes.value?.stats) {
        setBugStats(bugsRes.value.stats);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching dashboard details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllDashboardData();
  }, [loadAllDashboardData]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await analyticsService.exportUsersCSV();
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to export student CSV report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // SVG User Growth Curve Calculation
  const growthChartSvg = useMemo(() => {
    const months = userGrowth.months || [];
    const counts = userGrowth.counts || [];
    if (months.length === 0 || counts.length === 0) return null;

    const width = 600;
    const height = 180;
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const maxCount = Math.max(...counts, 10);
    const minCount = Math.min(...counts, 0);

    const getX = (index) => padding.left + (index / Math.max(months.length - 1, 1)) * innerWidth;
    const getY = (val) => padding.top + innerHeight - ((val - minCount) / Math.max(maxCount - minCount, 1)) * innerHeight;

    const points = counts.map((count, i) => `${getX(i)},${getY(count)}`);
    const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';
    const areaD = points.length > 0
      ? `M ${getX(0)},${padding.top + innerHeight} L ${points.join(' L ')} L ${getX(counts.length - 1)},${padding.top + innerHeight} Z`
      : '';

    return { width, height, padding, months, counts, pathD, areaD, maxCount, getX, getY };
  }, [userGrowth]);

  // SVG Monthly Upload Breakdown Bar Chart Calculation
  const uploadBarChartSvg = useMemo(() => {
    const months = uploadByMonth.months || [];
    const notes = uploadByMonth.notes || [];
    const pyqs = uploadByMonth.pyqs || [];
    const qb = uploadByMonth.questionBanks || [];
    if (months.length === 0) return null;

    const width = 600;
    const height = 180;
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(
      ...months.map((_, i) => (notes[i] || 0) + (pyqs[i] || 0) + (qb[i] || 0)),
      10
    );

    const slotWidth = innerWidth / Math.max(months.length, 1);
    const barWidth = Math.min(Math.max(slotWidth * 0.45, 10), 28);

    return { width, height, padding, innerHeight, months, notes, pyqs, qb, maxVal, slotWidth, barWidth };
  }, [uploadByMonth]);

  // Top Ranked Subjects Calculation
  const topSubjectsList = useMemo(() => {
    const { subjects = [], subjectNames = [], notes = [], pyqs = [], questionBanks = [] } = subjectContent;
    if (subjects.length === 0) return [];

    const items = subjects.map((code, i) => {
      const total = (notes[i] || 0) + (pyqs[i] || 0) + (questionBanks[i] || 0);
      return {
        code,
        name: subjectNames[i] || code,
        notes: notes[i] || 0,
        pyqs: pyqs[i] || 0,
        qb: questionBanks[i] || 0,
        total
      };
    });

    return items.sort((a, b) => b.total - a.total).slice(0, 5);
  }, [subjectContent]);

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-16 bg-gray-200 dark:bg-zinc-800/60 rounded-xl w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-200 dark:bg-zinc-800/60" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl bg-gray-200 dark:bg-zinc-800/60" />
          <div className="h-64 rounded-xl bg-gray-200 dark:bg-zinc-800/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Executive Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              {greeting}, {admin?.name ? admin.name.split(' ')[0] : 'Administrator'}
            </h1>
            {isSuper ? (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 uppercase tracking-wide">
                Super Admin
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 uppercase tracking-wide">
                Admin
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>AskUrSenior Central Operations Console</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Realtime Synchronized
            </span>
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <button
            type="button"
            onClick={() => loadAllDashboardData(true)}
            disabled={refreshing}
            title="Refresh dashboard metrics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-800/90 border border-gray-200 dark:border-zinc-700/80 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting}
            title="Export student directory to CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* ── Key Performance Metrics Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Students */}
        <Link
          to="/users"
          className="group p-4 rounded-xl bg-white dark:bg-[#111113] border border-gray-200/90 dark:border-zinc-800/90 shadow-sm hover:border-blue-500/50 dark:hover:border-blue-500/40 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Students
              </span>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 font-mono">
                {overview.totalUsers.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">registered</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {overview.liveUsers || 0} live now
              </span>
              <span className="text-gray-300 dark:text-zinc-700">•</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {overview.recentlyActiveCount || 0} active (24h)
              </span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </Link>

        {/* Card 2: Academic Subjects */}
        <Link
          to="/subjects"
          className="group p-4 rounded-xl bg-white dark:bg-[#111113] border border-gray-200/90 dark:border-zinc-800/90 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Subjects Directory
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 font-mono">
                {overview.totalSubjects.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">curriculum courses</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Schemes, Branches & Semesters</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
          </div>
        </Link>

        {/* Card 3: Curated Study Materials */}
        <Link
          to="/materials"
          className="group p-4 rounded-xl bg-white dark:bg-[#111113] border border-gray-200/90 dark:border-zinc-800/90 shadow-sm hover:border-purple-500/50 dark:hover:border-purple-500/40 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Study Materials
              </span>
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 font-mono">
                {overview.totalFiles.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">documents indexed</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {overview.uploadsThisMonth || 0} uploaded this month
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500 transition-colors" />
          </div>
        </Link>

        {/* Card 4: Feature Flags & Plus */}
        <Link
          to="/features"
          className="group p-4 rounded-xl bg-white dark:bg-[#111113] border border-gray-200/90 dark:border-zinc-800/90 shadow-sm hover:border-amber-500/50 dark:hover:border-amber-500/40 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Feature Flags & Plus
              </span>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 font-mono">
                {featureSummary.total || 0}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">system flags</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="text-[11px]">
              {featureSummary.plusCount || 0} Plus • {featureSummary.freeCount || 0} Free
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500 transition-colors" />
          </div>
        </Link>
      </div>

      {/* ── Secondary Highlights Strip ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Interviews Highlight */}
        <Link
          to="/interviews"
          className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-[#111113]/80 border border-gray-200 dark:border-zinc-800 flex items-center justify-between hover:bg-gray-100/80 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                Interview Experiences
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {interviewStats.total} student placement debriefs
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        {/* Announcements Highlight */}
        <Link
          to="/announcements"
          className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-[#111113]/80 border border-gray-200 dark:border-zinc-800 flex items-center justify-between hover:bg-gray-100/80 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-100/80 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                Active Announcements
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {announcementStats.published || 0} published notices
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        {/* Student Bug Reports Highlight */}
        <Link
          to="/bugs"
          className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-[#111113]/80 border border-gray-200 dark:border-zinc-800 flex items-center justify-between hover:bg-gray-100/80 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100/80 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                Bug Reports
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {bugStats.open > 0
                  ? `${bugStats.open} open issues need triage`
                  : `${bugStats.total} total reports • All clear`}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        {/* System & Security Sessions Highlight */}
        <Link
          to={isSuper ? '/security' : '#'}
          className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-[#111113]/80 border border-gray-200 dark:border-zinc-800 flex items-center justify-between hover:bg-gray-100/80 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-100/80 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                Security & Audit
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {securityOverview.highRiskSessions > 0
                  ? `${securityOverview.highRiskSessions} high risk sessions detected`
                  : `${securityOverview.activeSessions || 0} active sessions • Normal`}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>

      {/* ── Analytics Visualizer & Charts Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analytics Visualizer Card: Student Growth & Upload Velocity */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#111113] border border-gray-200/90 dark:border-zinc-800/90 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {trendTab === 'students' ? 'Student Registration Growth' : 'Monthly Upload Velocity'}
                </h2>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {trendTab === 'students'
                  ? 'Cumulative platform student onboarding over time'
                  : 'Breakdown of uploaded notes, PYQs, and question banks'}
              </p>
            </div>

            {/* Mode Toggle & Legend */}
            <div className="flex items-center gap-2">
              {trendTab === 'uploads' && (
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-medium mr-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Notes</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />PYQs</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />QBs</span>
                </div>
              )}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-100 dark:bg-zinc-800/80 text-[11px] self-start sm:self-auto font-medium">
                <button
                  type="button"
                  onClick={() => setTrendTab('students')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    trendTab === 'students'
                      ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Students
                </button>
                <button
                  type="button"
                  onClick={() => setTrendTab('uploads')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    trendTab === 'uploads'
                      ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Uploads
                </button>
              </div>
            </div>
          </div>

          <div className="h-52 w-full flex items-center justify-center pt-2">
            {trendTab === 'students' ? (
              growthChartSvg ? (
                <svg
                  viewBox={`0 0 ${growthChartSvg.width} ${growthChartSvg.height}`}
                  className="w-full h-full overflow-visible"
                >
                  <defs>
                    <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = growthChartSvg.padding.top + (growthChartSvg.height - growthChartSvg.padding.top - growthChartSvg.padding.bottom) * ratio;
                    const value = Math.round(growthChartSvg.maxCount * (1 - ratio));
                    return (
                      <g key={ratio}>
                        <line
                          x1={growthChartSvg.padding.left}
                          y1={y}
                          x2={growthChartSvg.width - growthChartSvg.padding.right}
                          y2={y}
                          stroke="currentColor"
                          strokeDasharray="3 3"
                          className="text-gray-200 dark:text-zinc-800"
                        />
                        <text
                          x={growthChartSvg.padding.left - 8}
                          y={y + 3}
                          textAnchor="end"
                          fontSize="9"
                          fill="currentColor"
                          className="text-gray-400 dark:text-zinc-500 font-mono"
                        >
                          {value}
                        </text>
                      </g>
                    );
                  })}

                  {/* Filled Area */}
                  <path d={growthChartSvg.areaD} fill="url(#userGrowthGrad)" />

                  {/* Line Path */}
                  <path
                    d={growthChartSvg.pathD}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Month Labels & Points */}
                  {growthChartSvg.counts.map((val, i) => {
                    const cx = growthChartSvg.getX(i);
                    const cy = growthChartSvg.getY(val);
                    const monthLabel = growthChartSvg.months[i] || '';
                    return (
                      <g key={i}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r="3.5"
                          className="fill-white dark:fill-zinc-900 stroke-blue-600 stroke-[2]"
                        />
                        <text
                          x={cx}
                          y={growthChartSvg.height - 8}
                          textAnchor="middle"
                          fontSize="9"
                          fill="currentColor"
                          className="text-gray-400 dark:text-zinc-500"
                        >
                          {monthLabel.slice(5) || monthLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-pulse text-blue-500" />
                  Aggregating registration growth analytics...
                </div>
              )
            ) : uploadBarChartSvg ? (
              <svg
                viewBox={`0 0 ${uploadBarChartSvg.width} ${uploadBarChartSvg.height}`}
                className="w-full h-full overflow-visible"
              >
                {/* Horizontal Guide Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = uploadBarChartSvg.padding.top + uploadBarChartSvg.innerHeight * ratio;
                  const value = Math.round(uploadBarChartSvg.maxVal * (1 - ratio));
                  return (
                    <g key={ratio}>
                      <line
                        x1={uploadBarChartSvg.padding.left}
                        y1={y}
                        x2={uploadBarChartSvg.width - uploadBarChartSvg.padding.right}
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        className="text-gray-200 dark:text-zinc-800"
                      />
                      <text
                        x={uploadBarChartSvg.padding.left - 8}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="9"
                        fill="currentColor"
                        className="text-gray-400 dark:text-zinc-500 font-mono"
                      >
                        {value}
                      </text>
                    </g>
                  );
                })}

                {/* Stacked Bars per Month */}
                {uploadBarChartSvg.months.map((m, i) => {
                  const slotCenter = uploadBarChartSvg.padding.left + (i + 0.5) * uploadBarChartSvg.slotWidth;
                  const x = slotCenter - uploadBarChartSvg.barWidth / 2;
                  const notesH = ((uploadBarChartSvg.notes[i] || 0) / uploadBarChartSvg.maxVal) * uploadBarChartSvg.innerHeight;
                  const pyqsH = ((uploadBarChartSvg.pyqs[i] || 0) / uploadBarChartSvg.maxVal) * uploadBarChartSvg.innerHeight;
                  const qbH = ((uploadBarChartSvg.qb[i] || 0) / uploadBarChartSvg.maxVal) * uploadBarChartSvg.innerHeight;
                  const baseY = uploadBarChartSvg.padding.top + uploadBarChartSvg.innerHeight;

                  return (
                    <g key={m}>
                      {/* Notes Bar */}
                      {notesH > 0 && (
                        <rect
                          x={x}
                          y={baseY - notesH}
                          width={uploadBarChartSvg.barWidth}
                          height={notesH}
                          className="fill-blue-500"
                          rx="2"
                        />
                      )}
                      {/* PYQs Bar */}
                      {pyqsH > 0 && (
                        <rect
                          x={x}
                          y={baseY - notesH - pyqsH}
                          width={uploadBarChartSvg.barWidth}
                          height={pyqsH}
                          className="fill-purple-500"
                          rx="2"
                        />
                      )}
                      {/* QB Bar */}
                      {qbH > 0 && (
                        <rect
                          x={x}
                          y={baseY - notesH - pyqsH - qbH}
                          width={uploadBarChartSvg.barWidth}
                          height={qbH}
                          className="fill-emerald-500"
                          rx="2"
                        />
                      )}
                      <text
                        x={slotCenter}
                        y={uploadBarChartSvg.height - 8}
                        textAnchor="middle"
                        fontSize="9"
                        fill="currentColor"
                        className="text-gray-400 dark:text-zinc-500"
                      >
                        {m.slice(5) || m}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-2">
                <Activity className="w-4 h-4 animate-pulse text-purple-500" />
                Aggregating monthly uploads distribution...
              </div>
            )}
          </div>
        </div>

        {/* Top Subjects by Content Density */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#111113] border border-gray-200/90 dark:border-zinc-800/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                Top Subjects by Content Density
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Highest volume of indexed notes, PYQs, and question banks
              </p>
            </div>
            <Link
              to="/subjects"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              All Subjects <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 pt-1">
            {topSubjectsList.length > 0 ? (
              topSubjectsList.map((item, idx) => {
                const maxTotal = topSubjectsList[0]?.total || 1;
                const pct = Math.max(8, Math.round((item.total / maxTotal) * 100));

                return (
                  <div key={item.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">
                          {item.code}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-gray-900 dark:text-gray-100 shrink-0 ml-2">
                        {item.total} files
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-zinc-800/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0
                            ? 'bg-emerald-500'
                            : idx === 1
                            ? 'bg-blue-500'
                            : idx === 2
                            ? 'bg-purple-500'
                            : 'bg-teal-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">
                No subject content data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Operator Shortcuts & Management Grid ──────────────────── */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Quick Operator Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/subjects"
            className="p-3 rounded-xl bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800/80 hover:border-blue-500/50 dark:hover:border-blue-500/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all flex flex-col items-center text-center group"
          >
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
              Add Subject
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              Curriculum catalog
            </span>
          </Link>

          <Link
            to="/materials"
            className="p-3 rounded-xl bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800/80 hover:border-purple-500/50 dark:hover:border-purple-500/40 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all flex flex-col items-center text-center group"
          >
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
              Upload Files
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              Notes & PYQs
            </span>
          </Link>

          <Link
            to="/announcements"
            className="p-3 rounded-xl bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800/80 hover:border-pink-500/50 dark:hover:border-pink-500/40 hover:bg-pink-50/20 dark:hover:bg-pink-950/20 transition-all flex flex-col items-center text-center group"
          >
            <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
              Broadcast
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              Send announcement
            </span>
          </Link>

          <Link
            to="/structure"
            className="p-3 rounded-xl bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all flex flex-col items-center text-center group"
          >
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
              Structure
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              Batches & Semesters
            </span>
          </Link>

          <Link
            to="/features"
            className="p-3 rounded-xl bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800/80 hover:border-amber-500/50 dark:hover:border-amber-500/40 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all flex flex-col items-center text-center group"
          >
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
              Feature Flags
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              Tiers & Preview
            </span>
          </Link>

          {isSuper && (
            <Link
              to="/admins"
              className="p-3 rounded-xl bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800/80 hover:border-purple-500/50 dark:hover:border-purple-500/40 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <span className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                Manage Admins
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                Staff permissions
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Recent Registrations & System Status ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Students Onboarding Feed (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-[#111113] border border-gray-200/90 dark:border-zinc-800/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Recent Student Onboardings
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Latest students joining the platform
              </p>
            </div>
            <Link
              to="/users"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Manage Directory <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-zinc-800/70">
            {recentStudents.length > 0 ? (
              recentStudents.map((st) => (
                <div key={st._id || st.id || st.usn} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {st.name ? st.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {st.name || 'Student'}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">
                        {st.usn || st.email || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                      {st.branch?.name || st.branch?.code || (typeof st.branch === 'string' && st.branch ? st.branch : '—')}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono">
                      {st.createdAt ? new Date(st.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Recent'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">
                No recent student accounts recorded.
              </div>
            )}
          </div>
        </div>

        {/* System Health & Architecture Summary (1 col) */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#111113] border border-gray-200/90 dark:border-zinc-800/90 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Platform Architecture Health
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Live status across core infrastructure
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Core API & Database</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Healthy
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Authentication Gateway</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Google OAuth Active
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800">
                <span className="text-gray-600 dark:text-gray-300 font-medium">File Storage & CDN</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Synced
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Socket Realtime Bus</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between font-mono">
            <span>Mode: {import.meta.env.MODE || 'production'}</span>
            <span>Last Sync: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
