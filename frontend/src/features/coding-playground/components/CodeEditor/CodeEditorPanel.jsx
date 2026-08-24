import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { 
    Play, RotateCcw, Copy, Check, Plus, X,
    ChevronDown, ChevronUp, CheckCircle, XCircle, 
    Clock, Terminal, Loader2, Sparkles, FileCode,
    History, Wand2, DownloadCloud
} from 'lucide-react';
import toast from 'react-hot-toast';

const CodeEditorPanel = ({
    theme = 'dark',
    availableLanguages = [],
    activeLanguageSlug = 'c',
    onChangeLanguage,
    code = '',
    onCodeChange,
    onResetCode,
    program,
    testCases = [],
    submissions = [],
    lastSubmittedCode = '',
    onFetchLastSubmittedCode,
    onRunCode,
    onSubmitCode,
    isRunning = false,
    isSubmitting = false,
    executionResult = null,
    workspaceMode = 'split'
}) => {
    const isDark = theme === 'dark';
    const monaco = useMonaco();
    const editorRef = useRef(null);

    const isPython = activeLanguageSlug === 'python';
    const monacoLanguage = isPython ? 'python' : 'c';
    const defaultFileName = isPython ? 'main.py' : 'main.c';

    // ─────────────────────────────────────────────────────────────
    // 1. MULTIPLE TABS IN CODE EDITOR + RELIABLE LOCALSTORAGE RESTORE
    // ─────────────────────────────────────────────────────────────
    const progKey = program?.slug || program?.id || 'prog';
    const storageKey = `askursenior_tabs_${progKey}_${activeLanguageSlug}`;

    const [tabs, setTabs] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return [{ id: '1', name: defaultFileName, code: code || '' }];
    });

    const [activeTabId, setActiveTabId] = useState('1');
    const [isSaved, setIsSaved] = useState(true);

    // Whenever problem or language changes, restore the exact typed/edited code from localStorage
    useEffect(() => {
        if (!progKey || progKey === 'prog') return;
        const currentStorageKey = `askursenior_tabs_${progKey}_${activeLanguageSlug}`;
        try {
            const saved = localStorage.getItem(currentStorageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setTabs(parsed);
                    const currentActive = parsed.find(t => t.id === activeTabId) || parsed[0];
                    if (currentActive) {
                        onCodeChange(currentActive.code || '');
                    }
                    return;
                }
            }
        } catch (e) {}

        // Fallback if no saved typed code
        const defaultTabs = [{ id: '1', name: defaultFileName, code: code || '' }];
        setTabs(defaultTabs);
        setActiveTabId('1');
        onCodeChange(code || '');
    }, [progKey, activeLanguageSlug]);

    // Active tab's code
    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
    const currentCode = activeTab?.code ?? '';

    // Auto-save debounce effect (saves to localStorage automatically as user types)
    const saveTimerRef = useRef(null);
    const handleCodeChangeWithAutoSave = (newVal) => {
        const val = newVal || '';
        setIsSaved(false);

        // Update active tab in state
        const updatedTabs = tabs.map(t => t.id === activeTabId ? { ...t, code: val } : t);
        setTabs(updatedTabs);
        onCodeChange(val);

        // Clear Monaco diagnostics squigglies
        if (monaco && editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) monaco.editor.setModelMarkers(model, 'compiler', []);
        }

        // Debounce local storage save
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            try {
                localStorage.setItem(storageKey, JSON.stringify(updatedTabs));
                setIsSaved(true);
            } catch (e) {}
        }, 500);
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__setEditorCode = (newVal) => {
                handleCodeChangeWithAutoSave(newVal);
                if (editorRef.current) {
                    editorRef.current.setValue(newVal);
                }
            };
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete window.__setEditorCode;
            }
        };
    }, [tabs, activeTabId, storageKey]);

    // Add Tab (Max 3)
    const handleAddTab = () => {
        if (tabs.length >= 3) {
            toast('Maximum 3 tabs allowed');
            return;
        }
        const newId = Date.now().toString();
        const tabNumber = tabs.length + 1;
        const newTabName = `Solution ${tabNumber}`;
        const newTabs = [...tabs, { id: newId, name: newTabName, code: '' }];
        setTabs(newTabs);
        setActiveTabId(newId);
        onCodeChange('');
        try {
            localStorage.setItem(storageKey, JSON.stringify(newTabs));
        } catch (e) {}
        toast.success(`Created ${newTabName}`);
    };

    // Close Tab
    const handleCloseTab = (e, tabIdToClose) => {
        e.stopPropagation();
        if (tabs.length <= 1) return;
        const remainingTabs = tabs.filter(t => t.id !== tabIdToClose);
        setTabs(remainingTabs);
        if (activeTabId === tabIdToClose) {
            setActiveTabId(remainingTabs[0].id);
            onCodeChange(remainingTabs[0].code || '');
        }
        try {
            localStorage.setItem(storageKey, JSON.stringify(remainingTabs));
        } catch (e) {}
    };

    // Switch Tab
    const handleSwitchTab = (tabId) => {
        setActiveTabId(tabId);
        const targetTab = tabs.find(t => t.id === tabId);
        if (targetTab) {
            onCodeChange(targetTab.code || '');
        }
    };

    // Reset Code
    const handleResetActiveTab = () => {
        handleCodeChangeWithAutoSave('');
        if (onResetCode) onResetCode();
        toast('Editor reset to blank');
    };

    // Format Code Action
    const handleFormatCode = () => {
        if (!editorRef.current) return;
        try {
            const formatAction = editorRef.current.getAction('editor.action.formatDocument');
            if (formatAction) {
                formatAction.run();
                toast.success('Formatted code');
            } else {
                toast('Formatting applied');
            }
        } catch (e) {
            console.error('Format error:', e);
        }
    };

    // Fetch / Load Last Submitted Code Action
    const handleFetchLastSubmittedCode = async () => {
        try {
            let targetCode = lastSubmittedCode;
            if (!targetCode && onFetchLastSubmittedCode) {
                toast.loading('Fetching latest submission...', { id: 'fetch-sub' });
                targetCode = await onFetchLastSubmittedCode();
                toast.dismiss('fetch-sub');
            }

            if (targetCode && targetCode.trim()) {
                handleCodeChangeWithAutoSave(targetCode);
                toast.success('Loaded last submitted code into editor!');
            } else {
                toast('No previous submission found for this problem');
            }
        } catch (e) {
            toast.dismiss('fetch-sub');
            toast.error('Failed to fetch last submission');
        }
    };

    // ─────────────────────────────────────────────────────────────
    // 2. MONACO SHORTCUTS: Ctrl+' for Run, Ctrl+Enter for Submit
    // ─────────────────────────────────────────────────────────────
    const onRunRef = useRef(onRunCode);
    const onSubmitRef = useRef(onSubmitCode);
    useEffect(() => {
        onRunRef.current = onRunCode;
        onSubmitRef.current = onSubmitCode;
    }, [onRunCode, onSubmitCode]);

    const handleEditorDidMount = (editor, monacoInstance) => {
        editorRef.current = editor;
        if (typeof window !== 'undefined') {
            window.__monacoEditor = editor;
        }

        // Run Code Shortcut: Ctrl + ' (or Cmd + ')
        editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Quote, () => {
            if (onRunRef.current) onRunRef.current();
        });

        // Submit Code Shortcut: Ctrl + Enter (or Cmd + Enter)
        editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => {
            if (onSubmitRef.current) onSubmitRef.current();
        });
    };

    // ─────────────────────────────────────────────────────────────
    // 3. TEST CASES CONSOLE: FIRST 2 CASES + CUSTOM INPUT
    // ─────────────────────────────────────────────────────────────
    const [copiedCode, setCopiedCode] = useState(false);
    const [activeTestCaseTab, setActiveTestCaseTab] = useState(0); // 0: Case 1, 1: Case 2, 2: Custom Input
    const [customInput, setCustomInput] = useState('');
    const [isTestPanelCollapsed, setIsTestPanelCollapsed] = useState(false);
    const [testConsoleHeight, setTestConsoleHeight] = useState(240);
    const [isDraggingConsole, setIsDraggingConsole] = useState(false);

    // Filter only first 2 test cases in the editor test console
    const firstTwoCases = (executionResult?.testCases?.length > 0 ? executionResult.testCases : testCases)
        .slice(0, 2)
        .map((tc, idx) => ({
            caseNumber: tc.caseNumber || idx + 1,
            name: tc.name || `Case ${idx + 1}`,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: tc.actualOutput,
            status: tc.status || 'pending',
            runtimeMs: tc.runtimeMs,
            stderr: tc.stderr
        }));

    const handleConsoleMouseDown = (e) => {
        e.preventDefault();
        setIsDraggingConsole(true);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDraggingConsole) return;
            const newHeight = window.innerHeight - e.clientY - 50;
            const clampedHeight = Math.max(110, Math.min(window.innerHeight * 0.7, newHeight));
            setTestConsoleHeight(clampedHeight);
            if (isTestPanelCollapsed) setIsTestPanelCollapsed(false);
        };

        const handleMouseUp = () => {
            if (isDraggingConsole) setIsDraggingConsole(false);
        };

        if (isDraggingConsole) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingConsole, isTestPanelCollapsed]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(currentCode);
        setCopiedCode(true);
        toast.success('Code copied to clipboard');
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const currentCase = firstTwoCases[activeTestCaseTab];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 50px)',
            backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
            flex: 1,
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* 1. TOP TABS BAR (Multiple Tabs + Status + Actions) */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: isDark ? '1px solid #1A1A1A' : '1px solid #E5E7EB',
                backgroundColor: isDark ? '#080808' : '#F9FAFB',
                padding: '0 8px',
                height: 42,
                flexShrink: 0,
                gap: 8
            }}>
                {/* Tabs on Left */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto' }}>
                    {tabs.map((tab, idx) => {
                        const isActive = tab.id === activeTabId;
                        return (
                            <div
                                key={tab.id}
                                onClick={() => handleSwitchTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '5px 10px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    backgroundColor: isActive 
                                        ? (isDark ? '#181424' : '#F3E8FF') 
                                        : 'transparent',
                                    border: isActive
                                        ? (isDark ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(124, 58, 237, 0.3)')
                                        : (isDark ? '1px solid transparent' : '1px solid transparent'),
                                    color: isActive
                                        ? (isDark ? '#FFFFFF' : '#111827')
                                        : (isDark ? '#888888' : '#6B7280'),
                                    fontSize: 12,
                                    fontWeight: isActive ? 700 : 500,
                                    transition: 'all 0.15s ease',
                                    userSelect: 'none'
                                }}
                            >
                                <FileCode size={13} color={isActive ? (isDark ? '#C084FC' : '#7C3AED') : (isDark ? '#666666' : '#9CA3AF')} />
                                <span>{tab.name}</span>
                                {tabs.length > 1 && (
                                    <button
                                        onClick={(e) => handleCloseTab(e, tab.id)}
                                        title="Close Tab"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            padding: 0,
                                            marginLeft: 2,
                                            cursor: 'pointer',
                                            color: isDark ? '#707070' : '#9CA3AF',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <X size={11} />
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    {/* Add Tab Button (Max 3) */}
                    {tabs.length < 3 && (
                        <button
                            onClick={handleAddTab}
                            title="New Tab (up to 3)"
                            style={{
                                background: 'transparent',
                                border: isDark ? '1px dashed #333333' : '1px dashed #D1D5DB',
                                color: isDark ? '#888888' : '#6B7280',
                                padding: '4px 7px',
                                borderRadius: 4,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                fontSize: 11
                            }}
                        >
                            <Plus size={12} />
                        </button>
                    )}
                </div>

                {/* Right Actions: Auto-Save Status, Language Badge, Format, Fetch Last Submission, Reset, Copy */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Auto-save indicator */}
                    <span style={{
                        fontSize: 11,
                        color: isSaved ? (isDark ? '#34D399' : '#059669') : (isDark ? '#F59E0B' : '#D97706'),
                        fontFamily: 'monospace',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginRight: 2
                    }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: isSaved ? '#22C55E' : '#F59E0B' }} />
                        {isSaved ? 'Saved' : 'Saving...'}
                    </span>

                    {/* Format Code Button */}
                    <button
                        onClick={handleFormatCode}
                        title="Format Code"
                        style={{
                            background: 'transparent',
                            border: isDark ? '1px solid #222222' : '1px solid #D1D5DB',
                            color: isDark ? '#D1D5DB' : '#374151',
                            padding: '3px 8px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600
                        }}
                    >
                        <Wand2 size={11} color={isDark ? "#C084FC" : "#7C3AED"} />
                        <span>Format</span>
                    </button>

                    {/* Fetch Last Submitted Code Button */}
                    <button
                        onClick={handleFetchLastSubmittedCode}
                        title="Fetch & load last submitted code into active editor tab"
                        style={{
                            background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.08)',
                            border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(37, 99, 235, 0.25)',
                            color: isDark ? '#60A5FA' : '#2563EB',
                            padding: '3px 8px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600
                        }}
                    >
                        <DownloadCloud size={11} />
                        <span>Last Submission</span>
                    </button>

                    {/* Reset Button */}
                    <button
                        onClick={handleResetActiveTab}
                        title="Reset Active Editor"
                        style={{
                            background: 'transparent',
                            border: isDark ? '1px solid #222222' : '1px solid #D1D5DB',
                            color: isDark ? '#888888' : '#6B7280',
                            padding: '3px 8px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600
                        }}
                    >
                        <RotateCcw size={11} />
                        <span>Reset</span>
                    </button>

                    {/* Copy Code Button */}
                    <button
                        onClick={handleCopyCode}
                        title="Copy Code"
                        style={{
                            background: 'transparent',
                            border: isDark ? '1px solid #222222' : '1px solid #D1D5DB',
                            color: isDark ? '#888888' : '#6B7280',
                            padding: '3px 8px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11
                        }}
                    >
                        {copiedCode ? <Check size={11} color="#22C55E" /> : <Copy size={11} />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
            </div>

            {/* 2. MONACO CODE EDITOR */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <Editor
                    height="100%"
                    language={monacoLanguage}
                    theme={isDark ? 'vs-dark' : 'light'}
                    value={currentCode}
                    onChange={handleCodeChangeWithAutoSave}
                    onMount={handleEditorDidMount}
                    options={{
                        fontSize: 13.5,
                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                        fontLigatures: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        renderLineHighlight: 'all',
                        lineNumbers: 'on',
                        bracketPairColorization: { enabled: true },
                        padding: { top: 12, bottom: 12 }
                    }}
                />
            </div>

            {/* DRAGGABLE VERTICAL SPLITTER FOR TEST CONSOLE */}
            <div
                onMouseDown={handleConsoleMouseDown}
                onDoubleClick={() => setTestConsoleHeight(240)}
                title="Drag vertically to resize test console"
                style={{
                    height: 6,
                    marginTop: -3,
                    marginBottom: -3,
                    zIndex: 20,
                    cursor: 'row-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDraggingConsole 
                        ? (isDark ? '#7C3AED' : '#9333EA') 
                        : 'transparent',
                    transition: 'background-color 0.15s ease'
                }}
            >
                <div style={{
                    width: 32,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: isDraggingConsole ? '#FFFFFF' : (isDark ? '#2A2A2A' : '#CBD5E1')
                }} />
            </div>

            {/* 3. TEST CASES CONSOLE (First 2 Cases + Custom Input) */}
            <div style={{
                backgroundColor: isDark ? '#0C0C0C' : '#F3F4F6',
                borderTop: isDark ? '1px solid #202020' : '1px solid #D1D5DB',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                height: isTestPanelCollapsed ? 38 : testConsoleHeight,
                zIndex: 10,
                transition: isDraggingConsole ? 'none' : 'height 0.15s ease'
            }}>
                {/* Console Header Tabs */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 8px',
                    height: 38,
                    borderBottom: isDark ? '1px solid #1A1A1A' : '1px solid #E5E7EB',
                    backgroundColor: isDark ? '#080808' : '#FFFFFF',
                    flexShrink: 0,
                    overflowX: 'auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#707070' : '#9CA3AF', textTransform: 'uppercase', marginRight: 4 }}>
                            Test Cases
                        </span>

                        {/* First 2 Test Cases Tabs */}
                        {firstTwoCases.map((tc, idx) => {
                            const isSelected = activeTestCaseTab === idx;
                            const isPassed = tc.status === 'passed';
                            const isFailed = tc.status === 'failed' || tc.status === 'runtime_error' || tc.status === 'time_limit_exceeded';

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setActiveTestCaseTab(idx);
                                        if (isTestPanelCollapsed) setIsTestPanelCollapsed(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '4px 9px',
                                        fontSize: 11,
                                        fontWeight: isSelected ? 700 : 500,
                                        borderRadius: 4,
                                        border: isSelected 
                                            ? (isDark ? '1px solid #333333' : '1px solid #D1D5DB')
                                            : '1px solid transparent',
                                        backgroundColor: isSelected 
                                            ? (isDark ? '#1C1C1C' : '#F3F4F6')
                                            : 'transparent',
                                        color: isSelected 
                                            ? (isDark ? '#FFFFFF' : '#111827')
                                            : (isDark ? '#888888' : '#6B7280'),
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isPassed && <CheckCircle size={11} color="#22C55E" />}
                                    {isFailed && <XCircle size={11} color="#EF4444" />}
                                    <span>{tc.name || `Case ${idx + 1}`}</span>
                                </button>
                            );
                        })}

                        {/* Custom Input Tab */}
                        <button
                            onClick={() => {
                                setActiveTestCaseTab(2);
                                if (isTestPanelCollapsed) setIsTestPanelCollapsed(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 9px',
                                fontSize: 11,
                                fontWeight: activeTestCaseTab === 2 ? 700 : 500,
                                borderRadius: 4,
                                border: activeTestCaseTab === 2 
                                    ? (isDark ? '1px solid #333333' : '1px solid #D1D5DB')
                                    : '1px solid transparent',
                                backgroundColor: activeTestCaseTab === 2 
                                    ? (isDark ? '#1C1C1C' : '#F3F4F6')
                                    : 'transparent',
                                color: activeTestCaseTab === 2 
                                    ? (isDark ? '#FFFFFF' : '#111827')
                                    : (isDark ? '#888888' : '#6B7280'),
                                cursor: 'pointer'
                            }}
                        >
                            <Terminal size={11} />
                            <span>Custom Input</span>
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isRunning && (
                            <span style={{ fontSize: 11, color: isDark ? '#A855F7' : '#7C3AED', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Loader2 size={12} className="animate-spin" />
                                <span>Evaluating...</span>
                            </span>
                        )}

                        <button
                            onClick={() => setIsTestPanelCollapsed(!isTestPanelCollapsed)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: isDark ? '#707070' : '#6B7280',
                                cursor: 'pointer',
                                padding: '4px 6px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {isTestPanelCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                    </div>
                </div>

                {/* Console Body */}
                {!isTestPanelCollapsed && (
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '10px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                    }}>
                        {/* Loading State during Run */}
                        {isRunning ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '30px 0',
                                gap: 10,
                                color: isDark ? '#A855F7' : '#7C3AED',
                                fontSize: 13,
                                fontWeight: 600
                            }}>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Evaluating...</span>
                            </div>
                        ) : activeTestCaseTab === 2 ? (
                            /* Custom Input Tab Content */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? '#707070' : '#6B7280', textTransform: 'uppercase' }}>
                                    Standard Input (stdin)
                                </span>
                                <textarea
                                    value={customInput}
                                    onChange={(e) => setCustomInput(e.target.value)}
                                    placeholder="Enter custom input arguments for your program..."
                                    rows={4}
                                    style={{
                                        padding: '8px 10px',
                                        backgroundColor: isDark ? '#050505' : '#FFFFFF',
                                        border: isDark ? '1px solid #1E1E1E' : '1px solid #D1D5DB',
                                        borderRadius: 4,
                                        fontFamily: '"JetBrains Mono", monospace',
                                        fontSize: 12,
                                        color: isDark ? '#E5E7EB' : '#111827',
                                        outline: 'none',
                                        resize: 'vertical'
                                    }}
                                />
                                <span style={{ fontSize: 11, color: isDark ? '#666666' : '#9CA3AF' }}>
                                    Press <strong>Run (Ctrl + ')</strong> to test against test cases.
                                </span>
                            </div>
                        ) : currentCase ? (
                            /* Test Case 1 or 2 Content */
                            <>
                                {executionResult?.status === 'compilation_error' && (
                                    <div style={{
                                        backgroundColor: isDark ? '#1C1010' : '#FEF2F2',
                                        border: isDark ? '1px solid #7F1D1D' : '1px solid #FCA5A5',
                                        borderRadius: 4,
                                        padding: '8px 10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4
                                    }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>Compilation Error</span>
                                        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 11.5, color: '#EF4444', whiteSpace: 'pre-wrap' }}>
                                            {executionResult.stderr}
                                        </pre>
                                    </div>
                                )}

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: 10
                                }}>
                                    <div>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? '#707070' : '#6B7280', textTransform: 'uppercase' }}>INPUT</span>
                                        <pre style={{
                                            margin: '3px 0 0 0',
                                            padding: '8px 10px',
                                            backgroundColor: isDark ? '#050505' : '#FFFFFF',
                                            border: isDark ? '1px solid #1E1E1E' : '1px solid #E5E7EB',
                                            borderRadius: 4,
                                            fontFamily: '"JetBrains Mono", monospace',
                                            fontSize: 12,
                                            color: isDark ? '#E5E7EB' : '#111827',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {currentCase.input || '(No input)'}
                                        </pre>
                                    </div>

                                    <div>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? '#707070' : '#6B7280', textTransform: 'uppercase' }}>EXPECTED OUTPUT</span>
                                        <pre style={{
                                            margin: '3px 0 0 0',
                                            padding: '8px 10px',
                                            backgroundColor: isDark ? '#050505' : '#FFFFFF',
                                            border: isDark ? '1px solid #1E1E1E' : '1px solid #E5E7EB',
                                            borderRadius: 4,
                                            fontFamily: '"JetBrains Mono", monospace',
                                            fontSize: 12,
                                            color: isDark ? '#34D399' : '#059669',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {currentCase.expectedOutput || '(Empty)'}
                                        </pre>
                                    </div>

                                    {currentCase.status !== 'pending' && (
                                        <div>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: currentCase.status === 'passed' ? '#22C55E' : '#EF4444', textTransform: 'uppercase' }}>
                                                YOUR OUTPUT {currentCase.status === 'passed' ? '✓' : '✗'}
                                            </span>
                                            <pre style={{
                                                margin: '3px 0 0 0',
                                                padding: '8px 10px',
                                                backgroundColor: isDark ? '#050505' : '#FFFFFF',
                                                border: currentCase.status === 'passed'
                                                    ? (isDark ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #BBF7D0')
                                                    : (isDark ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #FECACA'),
                                                borderRadius: 4,
                                                fontFamily: '"JetBrains Mono", monospace',
                                                fontSize: 12,
                                                color: currentCase.status === 'passed' ? '#22C55E' : '#EF4444',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {currentCase.actualOutput || (currentCase.status === 'runtime_error' ? `Runtime Error: ${currentCase.stderr || ''}` : '(No output)')}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeEditorPanel;
