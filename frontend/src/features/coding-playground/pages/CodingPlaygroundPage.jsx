import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PlaygroundHeader from '../components/PlaygroundHeader';
import LabSidebar from '../components/Sidebar/LabSidebar';
import ProblemPanel from '../components/ProblemWorkspace/ProblemPanel';
import CodeEditorPanel from '../components/CodeEditor/CodeEditorPanel';
import ShortcutsModal from '../components/Modals/ShortcutsModal';
import { 
    fetchPlaygroundTree, 
    fetchProblemDetails, 
    fetchProblemTestCases, 
    fetchProblemEditorial, 
    fetchProblemDiscussions, 
    postProblemDiscussion, 
    toggleUpvoteDiscussion, 
    fetchProblemSubmissions, 
    submitProblemCode,
    executeCode,
    evaluateProblemCode 
} from '../services/playgroundApi';

const getExecutableLanguage = (slug) => {
    if (!slug) return 'c';
    const s = slug.toLowerCase();
    if (s === 'python' || s === 'plc6' || s.includes('python')) return 'python';
    if (s === 'cpp' || s === 'c++') return 'cpp';
    if (s === 'java') return 'java';
    return 'c';
};

const CodingPlaygroundPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Query params or default state
    const urlLang = searchParams.get('lang') || '';
    const urlProg = searchParams.get('prog') || '';

    // Main database states
    const [languages, setLanguages] = useState([]);
    const [stats, setStats] = useState({ totalProblems: 0, completedProblems: 0, percent: 0 });
    const [activeLanguageSlug, setActiveLanguageSlug] = useState(urlLang || 'c');
    const [activeProblemId, setActiveProblemId] = useState(urlProg || '');
    const [activeLabId, setActiveLabId] = useState('');
    const [activeProblemTab, setActiveProblemTab] = useState('description');

    // Problem details & language configuration
    const [currentProblem, setCurrentProblem] = useState(null);
    const [testCases, setTestCases] = useState([]);
    const [code, setCode] = useState('');
    const [codeCache, setCodeCache] = useState({}); // { [problemSlug_languageSlug]: code }

    // Editorial, Submissions, Discussions from DB
    const [editorialData, setEditorialData] = useState(null);
    const [editorialLoading, setEditorialLoading] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [discussions, setDiscussions] = useState([]);
    const [discussionsLoading, setDiscussionsLoading] = useState(false);

    // Execution states
    const [isTreeLoading, setIsTreeLoading] = useState(true);
    const [isProblemLoading, setIsProblemLoading] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [executionResult, setExecutionResult] = useState(null);
    const [theme, setTheme] = useState('dark');

    // Timer states
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isTimerRunning) {
            interval = setInterval(() => setSecondsElapsed(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const handleToggleTimer = () => {
        setIsTimerRunning(prev => !prev);
    };

    // Layout states & Custom Drag-to-Resize states
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
    const [mobileActiveView, setMobileActiveView] = useState('problem');
    const [workspaceMode, setWorkspaceMode] = useState('split'); // 'split' | 'expanded-problem' | 'expanded-editor'
    const [splitPercent, setSplitPercent] = useState(46); // Custom user-expandable percentage
    const [isDraggingSplit, setIsDraggingSplit] = useState(false);
    const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
    const workspaceRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Custom Draggable Horizontal Splitter Handlers
    const handleSplitMouseDown = (e) => {
        e.preventDefault();
        setIsDraggingSplit(true);
    };

    const handleResetSplit = () => {
        setSplitPercent(50);
        toast('Reset split layout to 50:50');
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDraggingSplit || !workspaceRef.current) return;
            const rect = workspaceRef.current.getBoundingClientRect();
            const rawPercent = ((e.clientX - rect.left) / rect.width) * 100;
            // Clamp between 15% and 85%
            const clamped = Math.max(15, Math.min(85, rawPercent));
            setSplitPercent(clamped);
        };

        const handleMouseUp = () => {
            if (isDraggingSplit) {
                setIsDraggingSplit(false);
            }
        };

        if (isDraggingSplit) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingSplit]);

    // 1. Initial load of Curriculum Tree from API
    const loadCurriculumTree = useCallback(async (initialProgSlug = '') => {
        try {
            setIsTreeLoading(true);
            const data = await fetchPlaygroundTree();
            if (data?.success) {
                const langs = data.languages || [];
                setLanguages(langs);
                if (data.stats) setStats(data.stats);

                // Determine active language
                let selectedLangSlug = activeLanguageSlug;
                const langExists = langs.some(l => l.slug === selectedLangSlug);
                if (!selectedLangSlug || !langExists) {
                    selectedLangSlug = langs[0]?.slug || 'c';
                    setActiveLanguageSlug(selectedLangSlug);
                }

                // Determine active problem
                const currentLangObj = langs.find(l => l.slug === selectedLangSlug) || langs[0];
                const firstLab = currentLangObj?.labs?.[0];
                const firstProg = firstLab?.programs?.[0];

                let targetProgId = initialProgSlug || activeProblemId;
                let targetLabId = null;

                if (!targetProgId && firstProg) {
                    targetProgId = firstProg.slug || firstProg.id;
                    targetLabId = firstLab?.id;
                } else if (targetProgId) {
                    for (const l of (currentLangObj?.labs || [])) {
                        if ((l.programs || []).some(p => p.id === targetProgId || p.slug === targetProgId)) {
                            targetLabId = l.id;
                            break;
                        }
                    }
                }

                if (targetProgId) {
                    setActiveProblemId(targetProgId);
                    if (targetLabId) setActiveLabId(targetLabId);
                }
            }
        } catch (err) {
            console.error('Failed to load curriculum tree:', err);
            toast.error('Could not connect to curriculum database');
        } finally {
            setIsTreeLoading(false);
        }
    }, [activeLanguageSlug, activeProblemId]);

    useEffect(() => {
        loadCurriculumTree(urlProg);
    }, []);

    // 2. Load Problem Details and Starter Code from DB
    const loadProblemData = useCallback(async (problemSlugOrId, languageSlug) => {
        if (!problemSlugOrId) return;
        try {
            setIsProblemLoading(true);
            const [problem, publicTestCases] = await Promise.all([
                fetchProblemDetails(problemSlugOrId, languageSlug),
                fetchProblemTestCases(problemSlugOrId)
            ]);

            setCurrentProblem(problem);
            setTestCases(publicTestCases);
            if (problem?.labId?._id || problem?.labId) {
                setActiveLabId((problem.labId?._id || problem.labId).toString());
            }

            // The code editor must be COMPLETELY EMPTY ("") when a student opens a new problem
            const cacheKey = problemSlugOrId + '_' + languageSlug;
            if (codeCache[cacheKey] !== undefined) {
                setCode(codeCache[cacheKey]);
            } else {
                setCode(''); // COMPLETELY EMPTY
            }

            loadProblemSubmissions(problemSlugOrId);
            loadProblemDiscussions(problemSlugOrId);
        } catch (err) {
            console.error('Failed to load problem data:', err);
            toast.error('Failed to load problem details');
        } finally {
            setIsProblemLoading(false);
        }
    }, [codeCache]);

    // 3. Load Submissions
    const loadProblemSubmissions = async (problemSlugOrId) => {
        if (!problemSlugOrId) return;
        try {
            setSubmissionsLoading(true);
            const subs = await fetchProblemSubmissions(problemSlugOrId);
            setSubmissions(subs);
        } catch (err) {
            console.error('Failed to load submissions:', err);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    // 4. Load Discussions
    const loadProblemDiscussions = async (problemSlugOrId) => {
        if (!problemSlugOrId) return;
        try {
            setDiscussionsLoading(true);
            const disc = await fetchProblemDiscussions(problemSlugOrId);
            setDiscussions(disc);
        } catch (err) {
            console.error('Failed to load discussions:', err);
        } finally {
            setDiscussionsLoading(false);
        }
    };

    // 5. Load Editorial if tab active
    const loadProblemEditorial = async (problemSlugOrId) => {
        if (!problemSlugOrId) return;
        try {
            setEditorialLoading(true);
            const data = await fetchProblemEditorial(problemSlugOrId);
            setEditorialData(data);
        } catch (err) {
            console.error('Failed to load editorial:', err);
        } finally {
            setEditorialLoading(false);
        }
    };

    // Trigger problem data load on problem or language change
    useEffect(() => {
        if (activeProblemId && activeLanguageSlug) {
            loadProblemData(activeProblemId, activeLanguageSlug);
        }
    }, [activeProblemId, activeLanguageSlug]);

    // Trigger editorial load when editorial tab opened
    useEffect(() => {
        if (activeProblemTab === 'editorial' && activeProblemId) {
            loadProblemEditorial(activeProblemId);
        }
    }, [activeProblemTab, activeProblemId]);

    // Handle Code Change
    const handleCodeChange = (newCode) => {
        setCode(newCode);
        const cacheKey = activeProblemId + '_' + activeLanguageSlug;
        setCodeCache(prev => ({
            ...prev,
            [cacheKey]: newCode
        }));
    };

    // Handle Reset Code
    const handleResetCode = () => {
        setCode('');
        const cacheKey = activeProblemId + '_' + activeLanguageSlug;
        setCodeCache(prev => ({
            ...prev,
            [cacheKey]: ''
        }));
        setExecutionResult(null);
        toast('Editor cleared');
    };

    // Handle Problem Selection (Enforces exact single language for that subject track)
    const handleSelectProgram = (langSlug, labId, progSlugOrId, trackSlug) => {
        const effectiveLang = langSlug || (trackSlug?.includes('python') ? 'python' : 'c');
        setActiveLanguageSlug(effectiveLang);
        setActiveLabId(labId);
        setActiveProblemId(progSlugOrId);
        setExecutionResult(null);
        setSearchParams({ lang: effectiveLang, prog: progSlugOrId });
        if (!isDesktop) setMobileActiveView('problem');
    };

    // Handle Language Change
    const handleChangeLanguage = (newLangSlug) => {
        setActiveLanguageSlug(newLangSlug);
        setExecutionResult(null);
        setSearchParams({ lang: newLangSlug, prog: activeProblemId });
        toast('Switched editor to ' + newLangSlug.toUpperCase());
    };

    // Execute Code against Database-Driven Test Cases (Milestone 5 - Run creates ZERO submissions)
    const handleRunCode = async () => {
        if (!code || !code.trim()) {
            toast.error('Please enter some code before running');
            return;
        }

        if (!activeProblemId) {
            toast.error('No problem selected');
            return;
        }

        setIsRunning(true);
        setExecutionResult(null);
        toast.loading('Evaluating...', { id: 'run-toast' });

        try {
            const res = await evaluateProblemCode(activeProblemId, getExecutableLanguage(activeLanguageSlug), code);
            toast.dismiss('run-toast');

            if (res?.success) {
                const total = res.summary?.total || 0;
                const passed = res.summary?.passed || 0;
                const failed = res.summary?.failed || 0;
                const isAllPassed = total > 0 && passed === total;

                // Compute total runtime across executed test cases
                const totalRuntimeMs = (res.testCases || []).reduce((sum, tc) => sum + (tc.runtimeMs || 0), 0);

                setExecutionResult({
                    ...res,
                    passed: isAllPassed,
                    runtime: totalRuntimeMs + 'ms',
                    runtimeMs: totalRuntimeMs,
                    memory: '13.9 MB'
                });

                if (res.status === 'compilation_error') {
                    toast.error('Compilation Error (GCC)');
                } else if (res.status === 'no_test_cases') {
                    toast('No test cases are available for this problem yet.');
                } else if (isAllPassed) {
                    toast.success('All Test Cases Passed ✓ (' + passed + '/' + total + ')');
                } else {
                    toast.error(passed + ' Passed · ' + failed + ' Failed');
                }
            }
        } catch (err) {
            console.error('Evaluation error:', err);
            toast.dismiss('run-toast');
            const errorMsg = err.response?.data?.error || err.message || 'Evaluation failed';
            setExecutionResult({
                status: 'execution_error',
                passed: false,
                stderr: errorMsg,
                summary: { total: testCases.length, passed: 0, failed: testCases.length },
                testCases: []
            });
            toast.error(errorMsg);
        } finally {
            setIsRunning(false);
        }
    };

    // Submit Code to Database (Codeforces flow: evaluate, persist, auto-navigate to Submissions tab)
    const handleSubmitCode = async () => {
        if (!code || !code.trim()) {
            toast.error('Please write some code before submitting');
            return;
        }

        if (!activeProblemId) {
            toast.error('No problem selected');
            return;
        }

        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            setExecutionResult(null);
            toast.loading('Submitting and evaluating against database test cases...', { id: 'submit-toast' });

            const res = await submitProblemCode(activeProblemId, getExecutableLanguage(activeLanguageSlug), code);
            toast.dismiss('submit-toast');

            if (res?.success) {
                const newSub = res.submission;
                const newSubId = newSub?.id || newSub?._id;

                // 1. Insert newly created submission at top of history
                if (newSub) {
                    setSubmissions(prev => [newSub, ...prev.filter(s => (s.id || s._id) !== newSubId)]);
                }

                // 2. Automatically switch workspace to the Submissions tab
                setActiveProblemTab('submissions');
                if (!isDesktop) setMobileActiveView('problem');

                // 3. Toast summary
                if (newSub?.status === 'Accepted') {
                    toast.success(`Accepted ✓ (${newSub.passedTestCases}/${newSub.totalTestCases} Passed)`);
                } else if (newSub?.status === 'Compilation Error') {
                    toast.error('Compilation Error');
                } else {
                    toast.error(`${newSub?.status || 'Submission failed'} (${newSub?.passedTestCases ?? 0}/${newSub?.totalTestCases ?? 10} Passed)`);
                }

                // 4. Update test console execution result as well
                if (res.evaluation) {
                    const isAllPassed = newSub?.status === 'Accepted';
                    const totalRuntimeMs = (res.evaluation.testCases || []).reduce((sum, tc) => sum + (tc.runtimeMs || 0), 0);

                    setExecutionResult({
                        ...res.evaluation,
                        passed: isAllPassed,
                        runtime: totalRuntimeMs + 'ms',
                        runtimeMs: totalRuntimeMs,
                        memory: '13.9 MB'
                    });
                }
            }
        } catch (err) {
            console.error('Submission error:', err);
            toast.dismiss('submit-toast');
            const errorMsg = err.response?.data?.error || err.message || 'Failed to submit code';
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Posting Discussion to Database
    const handlePostDiscussion = async (content) => {
        if (!activeProblemId) return;
        try {
            const newDisc = await postProblemDiscussion(activeProblemId, content);
            if (newDisc) {
                setDiscussions(prev => [newDisc, ...prev]);
                toast.success('Discussion posted successfully!');
            }
        } catch (err) {
            console.error('Discussion error:', err);
            toast.error(err.response?.data?.error || 'Failed to post discussion');
            throw err;
        }
    };

    // Handle Toggle Upvote
    const handleToggleUpvoteDiscussion = async (discussionId) => {
        try {
            const res = await toggleUpvoteDiscussion(discussionId);
            if (res?.success) {
                setDiscussions(prev => prev.map(d => {
                    if (d.id === discussionId) {
                        return { ...d, hasUpvoted: res.hasUpvoted, upvotes: res.upvotes };
                    }
                    return d;
                }));
            }
        } catch (err) {
            toast.error('Failed to update upvote');
        }
    };

    const handleToggleExpandProblem = () => {
        setWorkspaceMode(prev => prev === 'expanded-problem' ? 'split' : 'expanded-problem');
    };

    const handleToggleExpandEditor = () => {
        setWorkspaceMode(prev => prev === 'expanded-editor' ? 'split' : 'expanded-editor');
    };

    const activeLanguageObj = languages.find(l => l.slug === activeLanguageSlug) || languages[0];


    // Global Keyboard shortcuts: Ctrl+Enter -> Submit, Ctrl+' -> Run
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmitCode();
                } else if (e.key === "'" || e.key === '"' || e.code === 'Quote') {
                    e.preventDefault();
                    handleRunCode();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [code, activeProblemId, activeLanguageSlug, isRunning, isSubmitting]);

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            backgroundColor: theme === 'dark' ? '#070707' : '#F6F7F9',
            transition: 'background-color 0.2s ease',
            overflow: 'hidden'
        }}>
            {/* 1. LEFT SIDEBAR: FULL TOP-TO-BOTTOM HEIGHT (100vh) */}
            {(isDesktop || mobileActiveView === 'sidebar') && (
                <LabSidebar
                    languages={languages}
                    activeLanguageSlug={activeLanguageSlug}
                    activeLabId={activeLabId}
                    activeProblemId={activeProblemId}
                    onSelectProgram={handleSelectProgram}
                    isCollapsed={isDesktop ? isSidebarCollapsed : false}
                    onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
                    isLoading={isTreeLoading}
                    theme={theme}
                    onToggleTheme={() => {
                        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
                    }}
                />
            )}

            {/* 2. RIGHT WORKSPACE AREA: TOP HEADER (STARTS AFTER SIDEBAR) + MAIN PANELS */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                height: '100vh',
                overflow: 'hidden',
                minWidth: 0
            }}>
                {/* TOP HEADER */}
                <PlaygroundHeader
                    theme={theme}
                    secondsElapsed={secondsElapsed}
                    isTimerRunning={isTimerRunning}
                    onToggleTimer={handleToggleTimer}
                    onResetTimer={() => { setIsTimerRunning(false); setSecondsElapsed(0); }}
                    onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
                    onRunCode={handleRunCode}
                    onSubmitCode={handleSubmitCode}
                    isRunning={isRunning}
                    isSubmitting={isSubmitting}
                />

                {/* Mobile View Toggle Bar */}
                {!isDesktop && (
                    <div style={{
                        display: 'flex',
                        backgroundColor: theme === 'dark' ? '#0D0822' : '#FFFFFF',
                        borderBottom: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
                        padding: '4px',
                        flexShrink: 0
                    }}>
                        {[
                            { key: 'sidebar', label: 'Curriculum Tree' },
                            { key: 'problem', label: 'Problem Statement' },
                            { key: 'editor', label: 'Code Editor' }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setMobileActiveView(tab.key)}
                                style={{
                                    flex: 1,
                                    padding: '8px 0',
                                    fontSize: 12,
                                    fontWeight: mobileActiveView === tab.key ? 700 : 500,
                                    borderRadius: 6,
                                    border: 'none',
                                    backgroundColor: mobileActiveView === tab.key ? (theme === 'dark' ? 'rgba(168, 85, 247, 0.25)' : '#F3E8FF') : 'transparent',
                                    color: mobileActiveView === tab.key ? (theme === 'dark' ? '#FFFFFF' : '#7E22CE') : (theme === 'dark' ? '#94A3B8' : '#6B7280'),
                                    cursor: 'pointer'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* 3. MAIN WORKSPACE (PROBLEM PANEL + CUSTOM RESIZABLE SPLIT GUTTER + CODE EDITOR) */}
                <div 
                    ref={workspaceRef}
                    style={{
                        display: 'flex',
                        flex: 1,
                        overflow: 'hidden',
                        minHeight: 0,
                        position: 'relative',
                        userSelect: isDraggingSplit ? 'none' : 'auto',
                        cursor: isDraggingSplit ? 'col-resize' : 'default'
                    }}
                >
                    {/* COLUMN 2: PROBLEM PANEL */}
                    {(isDesktop ? (workspaceMode !== 'expanded-editor') : (mobileActiveView === 'problem')) && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: isDesktop ? (workspaceMode === 'expanded-problem' ? '100%' : (splitPercent + '%')) : '100%',
                            minWidth: isDesktop && workspaceMode === 'split' ? 260 : 0,
                            maxWidth: isDesktop && workspaceMode === 'split' ? '85%' : '100%',
                            overflow: 'hidden',
                            height: '100%'
                        }}>
                            <ProblemPanel
                                theme={theme}
                                program={currentProblem}
                                language={activeLanguageObj}
                                activeTab={activeProblemTab}
                                onTabChange={setActiveProblemTab}
                                editorialData={editorialData}
                                editorialLoading={editorialLoading}
                                submissions={submissions}
                                submissionsLoading={submissionsLoading}
                                discussions={discussions}
                                discussionsLoading={discussionsLoading}
                                onPostDiscussion={handlePostDiscussion}
                                onToggleUpvoteDiscussion={handleToggleUpvoteDiscussion}
                                onLoadSubmissionCode={(loadedCode) => {
                                    handleCodeChange(loadedCode);
                                    toast.success('Loaded code from submission!');
                                }}
                                workspaceMode={workspaceMode}
                                onToggleExpandProblem={handleToggleExpandProblem}
                            />
                        </div>
                    )}

                    {/* DRAGGABLE HORIZONTAL SPLITTER BAR (Allows custom drag-to-resize between Problem and Editor) */}
                    {isDesktop && workspaceMode === 'split' && (
                        <div
                            onMouseDown={handleSplitMouseDown}
                            onDoubleClick={handleResetSplit}
                            title="Drag to resize custom workspace width (Double-click to reset 50%)"
                            style={{
                                width: 8,
                                marginLeft: -4,
                                marginRight: -4,
                                zIndex: 40,
                                cursor: 'col-resize',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isDraggingSplit 
                                    ? (theme === 'dark' ? '#7C3AED' : '#9333EA') 
                                    : 'transparent',
                                transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!isDraggingSplit) {
                                    e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(147, 51, 234, 0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isDraggingSplit) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            {/* Grip line */}
                            <div style={{
                                width: 2,
                                height: 24,
                                borderRadius: 1,
                                backgroundColor: isDraggingSplit 
                                    ? '#FFFFFF' 
                                    : (theme === 'dark' ? '#333333' : '#D1D5DB')
                            }} />
                        </div>
                    )}

                    {/* COLUMN 3: CODE EDITOR + TESTCASE CONSOLE */}
                    {(isDesktop ? (workspaceMode !== 'expanded-problem') : (mobileActiveView === 'editor')) && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: isDesktop ? (workspaceMode === 'expanded-editor' ? '100%' : ((100 - splitPercent) + '%')) : '100%',
                            minWidth: isDesktop && workspaceMode === 'split' ? 320 : 0,
                            flex: 1,
                            overflow: 'hidden',
                            height: '100%'
                        }}>
                            <CodeEditorPanel
                                theme={theme}
                                submissions={submissions}
                                lastSubmittedCode={submissions?.[0]?.code || ''}
                                onFetchLastSubmittedCode={async () => {
                                    const subs = await fetchProblemSubmissions(activeProblemId);
                                    setSubmissions(subs);
                                    return subs?.[0]?.code || null;
                                }}
                                availableLanguages={languages}
                                activeLanguageSlug={activeLanguageSlug}
                                onChangeLanguage={handleChangeLanguage}
                                code={code}
                                onCodeChange={handleCodeChange}
                                onResetCode={handleResetCode}
                                program={currentProblem}
                                testCases={testCases}
                                onRunCode={handleRunCode}
                                onSubmitCode={handleSubmitCode}
                                isRunning={isRunning}
                                isSubmitting={isSubmitting}
                                executionResult={executionResult}
                                workspaceMode={workspaceMode}
                                onToggleExpandEditor={handleToggleExpandEditor}
                            />
                        </div>
                    )}
                </div>
            </div>


            <ShortcutsModal
                isOpen={isShortcutsModalOpen}
                onClose={() => setIsShortcutsModalOpen(false)}
            />
        </div>
    );
};

export default CodingPlaygroundPage;
