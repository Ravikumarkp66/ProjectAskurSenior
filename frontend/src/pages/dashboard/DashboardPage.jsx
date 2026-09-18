import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';
import { apiV2 } from '../../services/authService';
import RightPanel, {
    StudentDetailsWidget,
    MaterialsOverviewWidget,
    AcademicStreakWidget,
    DailyPlannerWidget
} from '../../components/dashboard/RightPanel';
import { subjectAPI } from '../../services/api';
import { 
    X, Check, Award, Calendar, Clock, BookOpen, 
    ExternalLink, ShieldCheck, 
    AlertTriangle, TrendingUp, CheckCircle2
} from 'lucide-react';
import IllustrationCard from '../../components/common/IllustrationCard';
import CIEEligibilityTool from '../../components/academic-tools/cie-eligibility/CIEEligibilityTool';
import BranchChangeTool from '../../components/academic-tools/branch-change/BranchChangeTool';

import { useTheme } from '../../context/ThemeContext';

/* ═══════════════════════════════════════════════════════════════════
   SECTION HEADER — THEME AWARE
═══════════════════════════════════════════════════════════════════ */
const SectionHeader = ({ title }) => {
    const { isDark } = useTheme();
    return (
        <div style={{ marginBottom: 14 }}>
            <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                color: isDark ? '#F8FAFC' : '#0F172A',
                margin: 0,
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '-0.02em'
            }}>
                {title}
            </h2>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   CONTROLLED CARD ROW (SINGLE ROW, SCROLLABLE, NO VISIBLE SCROLLBAR)
   Cards remain in one row only with a consistent ~270px width.
   Scrollable horizontally without visible scrollbar lines.
═══════════════════════════════════════════════════════════════════ */
const CardGrid = ({ children }) => (
    <div 
        className="flex items-stretch gap-4 overflow-x-auto pt-2 pb-2 px-1 -mx-1 scroll-smooth no-scrollbar snap-x snap-mandatory"
        style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
        }}
    >
        {React.Children.map(children, (child) => (
            <div className="shrink-0 w-[270px] snap-start">
                {child}
            </div>
        ))}
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
═══════════════════════════════════════════════════════════════════ */
const DashboardPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const context = useOutletContext() || {};
    const { activeMobileTab = 'home' } = context;
    const { user } = useContext(AuthContext);
    const [rightSlot, setRightSlot] = useState(null);

    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    // ── Feature visit state (localStorage-based, no backend needed) ──
    // Keys: asus_fv_{featureKey} → ISO timestamp of first visit
    // Re-computed when the component mounts and when user navigates back via focus
    const [featureVisitMap, setFeatureVisitMap] = useState({});

    useEffect(() => {
        const FEATURE_KEYS = [
            'materials', 'attendance', 'sgpaGpa', 'academicSummary',
            'cieAnalyzer', 'branchChange', 'eligibilityChecker',
            'library', 'labPrograms', 'roadmaps', 'interviews',
            'campusMap', 'faculty',
        ];
        const readVisits = () => {
            const map = {};
            FEATURE_KEYS.forEach(key => {
                try {
                    map[key] = !!localStorage.getItem(`asus_fv_${key}`);
                } catch (_) {
                    map[key] = false;
                }
            });
            setFeatureVisitMap(map);
        };
        readVisits();
        // Re-read when user tabs back (they may have visited and returned)
        const handleFocus = () => readVisits();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // Registered Subjects state for Academic Journey dependency derivation
    const [registeredSubjects, setRegisteredSubjects] = useState([]);
    const [isRegisteredLoading, setIsRegisteredLoading] = useState(true);

    useEffect(() => {
        const fetchRegistered = async () => {
            try {
                const res = await apiV2.getRegisteredSubjects();
                if (res?.data?.data) {
                    setRegisteredSubjects(res.data.data);
                }
            } catch (err) {
                console.warn('[DashboardPage] Failed to fetch registered subjects:', err);
            } finally {
                setIsRegisteredLoading(false);
            }
        };
        fetchRegistered();

        // Background fetch from Attendance Section and keep in storage for instant availability
        apiV2.getAttendanceDashboard()
            .then(attRes => {
                if (attRes?.data?.success && attRes.data.data?.subjects) {
                    const subs = attRes.data.data.subjects;
                    try {
                        sessionStorage.setItem('aus_attendance_overview', JSON.stringify(subs));
                        const map = {};
                        subs.forEach(s => {
                            const id = s.subjectId || s.registeredSubjectId || s._id;
                            const code = s.code || s.subjectCode;
                            const name = s.name || s.subjectName;
                            const pct = s.attendancePercentage ?? s.analytics?.percentage;
                            if (pct !== undefined && pct !== null && !isNaN(Number(pct))) {
                                if (id) map[id.toString()] = Number(pct);
                                if (code) map[code.toString().toLowerCase()] = Number(pct);
                                if (name) map[name.toString().toLowerCase()] = Number(pct);
                            }
                        });
                        localStorage.setItem('aus_attendance_cache', JSON.stringify(map));
                    } catch (e) {}
                }
            })
            .catch(() => {});
    }, []);

    const isSubjectRegistrationComplete = registeredSubjects.length > 0;
    const totalRegisteredCredits = registeredSubjects.reduce(
        (sum, item) => sum + (item.registeredCredits || item.subject?.credits || 0),
        0
    );

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isDesktop = windowWidth >= 1024;

    // Modal state for analytical tools
    const [activeModal, setActiveModal] = useState(null);

    // Deep link modal triggers
    useEffect(() => {
        if (location.pathname.includes('/branch-change-predictor')) {
            setActiveModal('branch');
        } else if (
            location.pathname.includes('/cie-eligibility') ||
            location.pathname.includes('/cie-analyzer') ||
            location.pathname.includes('/eligibility-checker')
        ) {
            setActiveModal('cie-eligibility');
        }
    }, [location.pathname]);

    // ── Feature state helper ─────────────────────────────────────────
    // fs(key, isActive?) → 'active' | 'visited' | 'new'
    // 'active' only for live-data features when their data is available.
    const fs = (key, isActive = false) => {
        if (isActive) return 'active';
        return featureVisitMap[key] ? 'visited' : 'new';
    };

    return (
        <div id="dashboard-main-sections" className="flex-1 min-w-0 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-8 md:gap-12">

            {/* OVERVIEW TAB CONTENT (MOBILE ONLY) */}
            {!isDesktop && activeMobileTab === 'overview' && (
                <div id="dashboard-overview-section" className="flex flex-col gap-4">
                    <SectionHeader
                        tag="PROFILE"
                        title="Student Overview"
                        subtitle="Your profile info & study material statistics"
                        badge={{ text: 'Student Profile', color: '#3b82f6', borderColor: 'rgba(59,130,246,.3)', bgColor: 'rgba(59,130,246,.06)' }}
                    />
                    <StudentDetailsWidget user={user} />
                    <MaterialsOverviewWidget user={user} />
                </div>
            )}

            {/* PLANNER TAB CONTENT (MOBILE ONLY) */}
            {!isDesktop && activeMobileTab === 'planner' && (
                <div id="dashboard-planner-section" className="flex flex-col gap-4">
                    <SectionHeader
                        tag="HABITS"
                        title="Daily Planner & Streaks"
                        subtitle="Track your study habits, tasks and academic streak"
                        badge={{ text: 'Habits & Planner', color: '#f59e0b', borderColor: 'rgba(245,158,11,.3)', bgColor: 'rgba(245,158,11,.06)' }}
                    />
                    <AcademicStreakWidget user={user} />
                    <DailyPlannerWidget />
                </div>
            )}

            {/* MAIN DASHBOARD CONTENT (DESKTOP OR MOBILE HOME TAB) */}
            {(isDesktop || activeMobileTab === 'home') && (
                <div className="flex flex-col w-full max-w-[1160px]">


                    <div className="flex flex-col gap-8">
                        {/* ═══════════════════════════════════════════════════════
                            A. ACADEMICS (STRONGEST VISUAL WEIGHT - 4 CARDS)
                        ═══════════════════════════════════════════════════════ */}
                        <section id="section-academics" className="flex flex-col">
                            <SectionHeader title="Academics" />
                            <CardGrid>
                                {/* Card 1: My Subjects */}
                                <IllustrationCard
                                    presetKey="materials"
                                    featureKey="materials"
                                    featureState={fs('materials')}
                                    title="My Subjects"
                                    subtitle="Access editorials, PYQs, and module discussions for registered subjects."
                                    onClick={() => navigate('/plus/my-subjects')}
                                    isSubdued={false}
                                    ctaText="View subjects →"
                                />

                                {/* Card 2: Attendance */}
                                <IllustrationCard
                                    presetKey="attendance"
                                    featureKey="attendance"
                                    featureState={fs('attendance')}
                                    title="Attendance"
                                    subtitle="Track your classes, daily sessions, and safe bunk margins."
                                    onClick={() => navigate('/home/attendance')}
                                    isSubdued={false}
                                    ctaText="View attendance →"
                                />

                                {/* Card 3: SGPA Calculator */}
                                <IllustrationCard
                                    presetKey="sgpaGpa"
                                    featureKey="sgpaGpa"
                                    featureState={fs('sgpaGpa')}
                                    title="SGPA Calculator"
                                    subtitle="Calculate semester results, SEE target marks & grade points."
                                    onClick={() => navigate('/plus/sgpa')}
                                    isSubdued={false}
                                    ctaText="Calculate SGPA →"
                                />

                                {/* Card 4: Academic Overview */}
                                <IllustrationCard
                                    presetKey="academicSummary"
                                    featureKey="academicSummary"
                                    featureState={fs('academicSummary')}
                                    title="Academic Overview"
                                    subtitle="Review your complete degree journey, CGPA & academic trajectory."
                                    onClick={() => navigate('/home/academic-summary')}
                                    isSubdued={false}
                                    ctaText="View overview →"
                                />
                            </CardGrid>
                        </section>

                        {/* ═══════════════════════════════════════════════════════
                            B. ACADEMIC TOOLS (ANALYTICAL ENGINE - 2 CARDS)
                        ═══════════════════════════════════════════════════════ */}
                        <section id="section-academic-tools" className="flex flex-col">
                            <SectionHeader title="Academic Tools" />
                            <CardGrid>
                                {/* Tool 1: CIE & Eligibility */}
                                <IllustrationCard
                                    presetKey="cieAnalyzer"
                                    featureKey="cieAnalyzer"
                                    featureState={fs('cieAnalyzer')}
                                    title="CIE & Eligibility"
                                    subtitle="Enter your marks, calculate CIE and check your academic eligibility."
                                    onClick={() => setActiveModal('cie-eligibility')}
                                    isSubdued={false}
                                    ctaText="Check academics →"
                                />

                                {/* Tool 2: Branch Change Predictor */}
                                <IllustrationCard
                                    presetKey="branchChange"
                                    featureKey="branchChange"
                                    featureState={fs('branchChange')}
                                    title="Branch Change Predictor"
                                    subtitle="Data-driven historical analysis based on confirmed SIT 2025–26 merit and allocation records."
                                    onClick={() => setActiveModal('branch')}
                                    isSubdued={false}
                                    ctaText="Analyze chances →"
                                />
                            </CardGrid>
                        </section>

                        {/* ═══════════════════════════════════════════════════════
                            C. PRACTICE (COMPACT SKILL MODULES - 2 CARDS)
                        ═══════════════════════════════════════════════════════ */}
                        <section id="section-practice" className="flex flex-col">
                            <SectionHeader title="Practice" />
                            <CardGrid>
                                {/* Practice 1: Library */}
                                <IllustrationCard
                                    presetKey="library"
                                    featureKey="library"
                                    featureState={fs('library')}
                                    title="Library"
                                    subtitle="Curated department curriculum, module notes, and reference syllabi."
                                    onClick={() => navigate('/plus/subjects')}
                                    isSubdued={false}
                                    ctaText="Browse library →"
                                />

                                {/* Practice 2: Lab Programs */}
                                <IllustrationCard
                                    presetKey="labPrograms"
                                    featureKey="labPrograms"
                                    featureState={fs('labPrograms')}
                                    title="Lab Programs"
                                    subtitle="Practice college lab assignments with in-browser compilation across 4 languages."
                                    metadataText="4 Languages • Lab-wise Practice"
                                    onClick={() => navigate('/plus/lab-programs')}
                                    isSubdued={false}
                                    ctaText="Open lab IDE →"
                                />
                            </CardGrid>
                        </section>

                        {/* ═══════════════════════════════════════════════════════
                            D. CAREER (COMPACT GROWTH TRACKS - 2 CARDS)
                        ═══════════════════════════════════════════════════════ */}
                        <section id="section-career" className="flex flex-col">
                            <SectionHeader title="Career" />
                            <CardGrid>
                                {/* Career 1: Roadmaps */}
                                <IllustrationCard
                                    presetKey="roadmaps"
                                    featureKey="roadmaps"
                                    featureState={fs('roadmaps')}
                                    title="Roadmaps"
                                    subtitle="Semester timeline, key milestones, exam schedules & senior guides."
                                    onClick={() => navigate('/plus/roadmaps')}
                                    isSubdued={false}
                                    ctaText="View roadmap →"
                                />

                                {/* Career 2: Interview Experiences */}
                                <IllustrationCard
                                    presetKey="interviews"
                                    featureKey="interviews"
                                    featureState={fs('interviews')}
                                    title="Interview Experiences"
                                    subtitle="Verified interview questions, rounds, and preparation tips from placed seniors."
                                    onClick={() => navigate('/home/interview')}
                                    isSubdued={false}
                                    ctaText="Read debriefs →"
                                />
                            </CardGrid>
                        </section>

                        {/* ═══════════════════════════════════════════════════════
                            E. CAMPUS (COMPACT CAMPUS INTEL - 2 CARDS)
                        ═══════════════════════════════════════════════════════ */}
                        <section id="section-campus" className="flex flex-col">
                            <SectionHeader title="Campus" />
                            <CardGrid>
                                {/* Campus 1: Campus Explorer */}
                                <IllustrationCard
                                    presetKey="campusMap"
                                    featureKey="campusMap"
                                    featureState={fs('campusMap')}
                                    title="Campus Explorer"
                                    subtitle="Interactive 3D campus navigation for blocks, canteens, libraries, and labs."
                                    onClick={() => navigate('/campus-map')}
                                    isSubdued={false}
                                    ctaText="Explore campus →"
                                />

                                {/* Campus 2: Faculty Ratings */}
                                <IllustrationCard
                                    presetKey="faculty"
                                    featureKey="faculty"
                                    featureState={fs('faculty')}
                                    title="Faculty Ratings"
                                    subtitle="Anonymous insights on teaching styles, internal grading, and exam prep tips."
                                    onClick={() => navigate('/home/faculty-ratings')}
                                    isSubdued={false}
                                    ctaText="View ratings →"
                                />
                            </CardGrid>
                        </section>
                    </div>
                </div>
            )}


            {/* ═══════════════════════════════════════════════════════
                UNIFIED ACADEMIC TOOL 2: BRANCH CHANGE PREDICTOR
            ═══════════════════════════════════════════════════════ */}
            <BranchChangeTool
                isOpen={activeModal === 'branch'}
                onClose={() => setActiveModal(null)}
                initialCgpa={user?.cgpa}
                initialBranch={user?.branch || user?.department}
            />

            {/* ═══════════════════════════════════════════════════════
                UNIFIED ACADEMIC TOOL: CIE & ELIGIBILITY
            ═══════════════════════════════════════════════════════ */}
            <CIEEligibilityTool
                isOpen={activeModal === 'cie-eligibility'}
                onClose={() => setActiveModal(null)}
                initialSubjects={registeredSubjects}
            />

        </div>
    );
};

export default DashboardPage;
