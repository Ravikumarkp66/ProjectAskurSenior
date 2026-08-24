import React, { useState, useEffect } from 'react';
import { 
    BookOpen, FileText, CheckCircle2, MessageSquare, 
    Copy, Check, ChevronDown, ChevronRight, 
    Send, Lightbulb, AlertCircle,
    Code2, X, Terminal, Clock, CheckCircle, XCircle,
    HelpCircle, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

// Helper for relative timestamps
function formatRelativeTime(dateString) {
    if (!dateString) return 'just now';
    const now = new Date();
    const past = new Date(dateString);
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 45) return 'just now';
    if (diffSec < 90) return '1 minute ago';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minutes ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Normalize whitespace helper for quiz checking
function normalizeOutput(str) {
    if (!str) return '';
    return str
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .trim();
}

const ProblemPanel = ({
    theme = 'dark',
    program,
    language,
    activeTab,
    onTabChange,
    editorialData,
    editorialLoading,
    submissions = [],
    submissionsLoading,
    discussions = [],
    discussionsLoading,
    onPostDiscussion,
    onToggleUpvoteDiscussion,
    onLoadSubmissionCode,
    workspaceMode = 'split'
}) => {
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [expandedHints, setExpandedHints] = useState({});
    const [expandedSubmissions, setExpandedSubmissions] = useState({});
    const [selectedCodeModal, setSelectedCodeModal] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);

    // Interactive Quiz State for Interactive Question
    const [quizUserAnswer, setQuizUserAnswer] = useState('');
    const [quizStatus, setQuizStatus] = useState(null); // null | 'correct' | 'incorrect'

    // Reset quiz when problem changes
    useEffect(() => {
        setQuizUserAnswer('');
        setQuizStatus(null);
        setExpandedHints({});
    }, [program?._id || program?.id || program?.slug]);

    const isDark = theme === 'dark';

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const toggleHint = (idx) => {
        setExpandedHints(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const toggleSubmissionExpand = (subId) => {
        setExpandedSubmissions(prev => ({
            ...prev,
            [subId]: !prev[subId]
        }));
    };

    // Determine quiz object (from program.quiz or 2nd/3rd example)
    const quizData = program?.quiz || (program?.examples && program.examples.length > 2 ? {
        question: 'What will be the output for the following input?',
        input: program.examples[2].input,
        expectedOutput: program.examples[2].output
    } : null);

    const handleCheckQuizAnswer = (e) => {
        e.preventDefault();
        const expected = quizData?.expectedOutput;
        if (!expected) return;

        const normalizedExpected = normalizeOutput(expected);
        const normalizedUser = normalizeOutput(quizUserAnswer);

        if (normalizedUser === normalizedExpected) {
            setQuizStatus('correct');
            toast.success('✓ Correct!');
        } else {
            setQuizStatus('incorrect');
            toast.error('✗ Try again.');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isPostingComment) return;
        try {
            setIsPostingComment(true);
            await onPostDiscussion(newComment.trim());
            setNewComment('');
        } catch (err) {
            // error handled in parent
        } finally {
            setIsPostingComment(false);
        }
    };

    // Semantic Tab Headers
    const TABS = [
        { id: 'description', label: 'Description', count: null, icon: FileText, color: isDark ? '#FBBF24' : '#D97706' },
        { id: 'editorial', label: 'Editorial', count: null, icon: BookOpen, color: isDark ? '#34D399' : '#059669' },
        { id: 'submissions', label: 'Submissions', count: submissions.length, icon: CheckCircle2, color: isDark ? '#60A5FA' : '#2563EB' },
        { id: 'discussion', label: 'Discussion', count: discussions.length, icon: MessageSquare, color: isDark ? '#C084FC' : '#9333EA' }
    ];

    if (!program) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? '#0D0D0D' : '#F8F9FB',
                borderRight: isDark ? '1px solid #1E1E1E' : '1px solid #E5E7EB',
                color: isDark ? '#707070' : '#9CA3AF',
                fontSize: 13,
                fontFamily: 'Outfit, sans-serif'
            }}>
                No programs have been added yet.
            </div>
        );
    }

    const examplesList = program.examples || [];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 50px)',
            backgroundColor: isDark ? '#0D0D0D' : '#F8F9FB',
            borderRight: isDark ? '1px solid #1E1E1E' : '1px solid #E5E7EB',
            overflow: 'hidden',
            flex: 1,
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
            position: 'relative'
        }}>
            {/* 1. TOP TABS BAR */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: isDark ? '1px solid #1A1A1A' : '1px solid #E5E7EB',
                backgroundColor: isDark ? '#080808' : '#FFFFFF',
                padding: '0 8px',
                flexShrink: 0,
                height: 46
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '7px 11px',
                                    fontSize: 12,
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? tab.color : (isDark ? '#888888' : '#6B7280'),
                                    backgroundColor: isActive 
                                        ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)') 
                                        : 'transparent',
                                    border: 'none',
                                    borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                                    cursor: 'pointer',
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <Icon size={14} color={isActive ? tab.color : (isDark ? '#888888' : '#6B7280')} />
                                <span>{tab.label}</span>
                                {tab.count !== null && tab.count > 0 && (
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: '1px 5px',
                                        borderRadius: 8,
                                        backgroundColor: isActive 
                                            ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)')
                                            : (isDark ? '#1C1C1C' : '#E5E7EB'),
                                        color: isActive ? tab.color : (isDark ? '#888888' : '#6B7280')
                                    }}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. TAB CONTENT SCROLLABLE AREA */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
                lineHeight: 1.6
            }}>
                {/* ─────────────────────────────────────────────────────────────
                   TAB 1: PROBLEM DESCRIPTION (2 Examples + Interactive Question)
                   ───────────────────────────────────────────────────────────── */}
                {activeTab === 'description' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 920 }}>
                        {/* Title & Program Header */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    color: '#38BDF8',
                                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.08)',
                                    padding: '3px 8px',
                                    borderRadius: 4,
                                    border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)'
                                }}>
                                    Program {program.programNumber || '1'}
                                </span>

                                <span style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    color: program.difficulty === 'Hard' ? '#EF4444' : program.difficulty === 'Medium' ? '#F59E0B' : '#22C55E',
                                    backgroundColor: program.difficulty === 'Hard' ? 'rgba(239, 68, 68, 0.1)' : program.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                    padding: '3px 8px',
                                    borderRadius: 4
                                }}>
                                    {program.difficulty || 'Easy'}
                                </span>

                                {program.lab && (
                                    <span style={{ fontSize: 12, color: isDark ? '#707070' : '#6B7280' }}>
                                        • {program.lab.title}
                                    </span>
                                )}
                            </div>

                            <h1 style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: isDark ? '#FFFFFF' : '#111827',
                                margin: 0,
                                letterSpacing: '-0.02em',
                                lineHeight: 1.3
                            }}>
                                {program.title}
                            </h1>
                        </div>

                        {/* 1. Problem Statement */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#A0A0A0' : '#4B5563', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Problem Statement
                            </h3>
                            <div style={{
                                fontSize: 14,
                                color: isDark ? '#E0E0E0' : '#1F2937',
                                lineHeight: 1.7,
                                whiteSpace: 'pre-line'
                            }}>
                                {program.description}
                            </div>
                        </div>

                        {/* 2. Input Format */}
                        {program.inputFormat && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#A0A0A0' : '#4B5563', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Input Format
                                </h3>
                                <div style={{ fontSize: 13.5, color: isDark ? '#D0D0D0' : '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                                    {program.inputFormat}
                                </div>
                            </div>
                        )}

                        {/* 3. Output Format */}
                        {program.outputFormat && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#A0A0A0' : '#4B5563', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Output Format
                                </h3>
                                <div style={{ fontSize: 13.5, color: isDark ? '#D0D0D0' : '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                                    {program.outputFormat}
                                </div>
                            </div>
                        )}

                        {/* 4. Examples (2 Standard Examples) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {examplesList.slice(0, 2).map((ex, index) => (
                                <div key={index} style={{
                                    backgroundColor: isDark ? '#111111' : '#FFFFFF',
                                    border: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)'
                                }}>
                                    <div style={{
                                        padding: '8px 12px',
                                        backgroundColor: isDark ? '#161616' : '#F9FAFB',
                                        borderBottom: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: isDark ? '#A0A0A0' : '#4B5563',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span>Example {index + 1}</span>
                                        {ex.input && (
                                            <button
                                                onClick={() => handleCopy(ex.input, index + 1)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: isDark ? '#888888' : '#6B7280',
                                                    fontSize: 11,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4
                                                }}
                                            >
                                                {copiedIndex === index + 1 ? <Check size={12} color="#22C55E" /> : <Copy size={12} />}
                                                <span>{copiedIndex === index + 1 ? 'Copied' : 'Copy Input'}</span>
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#707070' : '#6B7280', textTransform: 'uppercase' }}>Input</span>
                                            <pre style={{
                                                margin: '3px 0 0 0',
                                                fontFamily: '"JetBrains Mono", monospace',
                                                fontSize: 12.5,
                                                color: isDark ? '#E5E5E5' : '#111827',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {ex.input || '(No input)'}
                                            </pre>
                                        </div>

                                        <div>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#707070' : '#6B7280', textTransform: 'uppercase' }}>Output</span>
                                            <pre style={{
                                                margin: '3px 0 0 0',
                                                fontFamily: '"JetBrains Mono", monospace',
                                                fontSize: 12.5,
                                                color: isDark ? '#34D399' : '#059669',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {ex.output || '(No output)'}
                                            </pre>
                                        </div>

                                        {ex.explanation && (
                                            <div>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#707070' : '#6B7280', textTransform: 'uppercase' }}>Explanation</span>
                                                <p style={{ margin: '3px 0 0 0', fontSize: 13, color: isDark ? '#A0A0A0' : '#4B5563' }}>
                                                    {ex.explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* 5. Interactive Question (Quiz) */}
                            {quizData && (
                                <div style={{
                                    backgroundColor: isDark ? '#111111' : '#FFFFFF',
                                    border: quizStatus === 'correct' 
                                        ? (isDark ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid #86EFAC')
                                        : quizStatus === 'incorrect'
                                            ? (isDark ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #FCA5A5')
                                            : (isDark ? '1px solid #202020' : '1px solid #E5E7EB'),
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                                    transition: 'border-color 0.2s ease'
                                }}>
                                    <div style={{
                                        padding: '8px 12px',
                                        backgroundColor: isDark ? '#161616' : '#F9FAFB',
                                        borderBottom: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: isDark ? '#A0A0A0' : '#4B5563',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <HelpCircle size={13} color={isDark ? "#C084FC" : "#9333EA"} />
                                            <span>Interactive Question</span>
                                        </div>
                                    </div>

                                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <p style={{ margin: 0, fontSize: 13, color: isDark ? '#E5E7EB' : '#374151', fontWeight: 600 }}>
                                            {quizData.question || 'What will be the output for the following input?'}
                                        </p>

                                        <div>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#707070' : '#6B7280', textTransform: 'uppercase' }}>Input</span>
                                            <pre style={{
                                                margin: '3px 0 0 0',
                                                padding: '8px 10px',
                                                backgroundColor: isDark ? '#080808' : '#F3F4F6',
                                                borderRadius: 4,
                                                fontFamily: '"JetBrains Mono", monospace',
                                                fontSize: 12.5,
                                                color: isDark ? '#E5E5E5' : '#111827',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {quizData.input}
                                            </pre>
                                        </div>

                                        <form onSubmit={handleCheckQuizAnswer} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {quizData.options && quizData.options.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#707070' : '#6B7280', textTransform: 'uppercase' }}>Select Output Option</span>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                                                        {quizData.options.map((opt, optIdx) => {
                                                            const optLetter = String.fromCharCode(65 + optIdx);
                                                            const isSelected = quizUserAnswer === opt || quizUserAnswer === optLetter || quizUserAnswer === `${optLetter}. ${opt}`;
                                                            return (
                                                                <button
                                                                    key={optIdx}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setQuizUserAnswer(opt);
                                                                        if (quizStatus) setQuizStatus(null);
                                                                    }}
                                                                    style={{
                                                                        padding: '8px 12px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 8,
                                                                        borderRadius: 6,
                                                                        border: isSelected 
                                                                            ? (isDark ? '1px solid #C084FC' : '1px solid #9333EA')
                                                                            : (isDark ? '1px solid #252525' : '1px solid #E5E7EB'),
                                                                        backgroundColor: isSelected 
                                                                            ? (isDark ? 'rgba(192, 132, 252, 0.12)' : 'rgba(147, 51, 234, 0.08)')
                                                                            : (isDark ? '#0A0A0A' : '#FFFFFF'),
                                                                        color: isSelected 
                                                                            ? (isDark ? '#FFFFFF' : '#111827')
                                                                            : (isDark ? '#D1D5DB' : '#374151'),
                                                                        cursor: 'pointer',
                                                                        textAlign: 'left',
                                                                        fontSize: 12.5,
                                                                        fontFamily: '"JetBrains Mono", monospace',
                                                                        fontWeight: isSelected ? 700 : 500,
                                                                        transition: 'all 0.15s ease'
                                                                    }}
                                                                >
                                                                    <span style={{
                                                                        width: 20,
                                                                        height: 20,
                                                                        borderRadius: '50%',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontSize: 11,
                                                                        fontWeight: 700,
                                                                        backgroundColor: isSelected ? (isDark ? '#C084FC' : '#9333EA') : (isDark ? '#202020' : '#F3F4F6'),
                                                                        color: isSelected ? '#FFFFFF' : (isDark ? '#888888' : '#6B7280')
                                                                    }}>
                                                                        {optLetter}
                                                                    </span>
                                                                    <span>{opt}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#707070' : '#6B7280', textTransform: 'uppercase' }}>Predicted Output</span>
                                                    <textarea
                                                        value={quizUserAnswer}
                                                        onChange={(e) => {
                                                            setQuizUserAnswer(e.target.value);
                                                            if (quizStatus) setQuizStatus(null);
                                                        }}
                                                        placeholder="Enter your predicted output..."
                                                        rows={2}
                                                        style={{
                                                            padding: '8px 10px',
                                                            fontFamily: '"JetBrains Mono", monospace',
                                                            fontSize: 12.5,
                                                            backgroundColor: isDark ? '#080808' : '#F9FAFB',
                                                            border: isDark ? '1px solid #282828' : '1px solid #D1D5DB',
                                                            borderRadius: 4,
                                                            color: isDark ? '#FFFFFF' : '#111827',
                                                            outline: 'none',
                                                            resize: 'vertical'
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                                {quizStatus === 'correct' && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22C55E', fontSize: 12, fontWeight: 700 }}>
                                                        <CheckCircle size={14} color="#22C55E" />
                                                        <span>✓ Correct!</span>
                                                    </div>
                                                )}

                                                {quizStatus === 'incorrect' && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontSize: 12, fontWeight: 700 }}>
                                                        <XCircle size={14} color="#EF4444" />
                                                        <span>✗ Try again.</span>
                                                    </div>
                                                )}

                                                {!quizStatus && <div />}

                                                <button
                                                    type="submit"
                                                    disabled={!quizUserAnswer.trim()}
                                                    style={{
                                                        padding: '6px 14px',
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        borderRadius: 4,
                                                        border: 'none',
                                                        backgroundColor: isDark ? '#7C3AED' : '#6D28D9',
                                                        color: '#FFFFFF',
                                                        cursor: !quizUserAnswer.trim() ? 'not-allowed' : 'pointer',
                                                        opacity: !quizUserAnswer.trim() ? 0.5 : 1
                                                    }}
                                                >
                                                    Check Answer
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 6. Constraints */}
                        {program.constraints?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <h3 style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: isDark ? '#A0A0A0' : '#4B5563',
                                    margin: 0,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                }}>
                                    Constraints
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {program.constraints.map((c, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontSize: 13,
                                            color: isDark ? '#D0D0D0' : '#374151',
                                            fontFamily: '"JetBrains Mono", monospace'
                                        }}>
                                            <span style={{ color: isDark ? '#FBBF24' : '#D97706' }}>•</span>
                                            <span>{c}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 7. Hints */}
                        {program.hints?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <h3 style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: isDark ? '#A0A0A0' : '#4B5563',
                                    margin: 0,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                }}>
                                    Hints
                                </h3>
                                {program.hints.map((hint, i) => {
                                    const isOpen = !!expandedHints[i];
                                    return (
                                        <div key={i} style={{
                                            backgroundColor: isDark ? '#111111' : '#FFFFFF',
                                            border: isOpen 
                                                ? (isDark ? '1px solid rgba(192, 132, 252, 0.4)' : '1px solid rgba(147, 51, 234, 0.4)')
                                                : (isDark ? '1px solid #252525' : '1px solid #E5E7EB'),
                                            borderRadius: 6,
                                            overflow: 'hidden',
                                            transition: 'border 0.15s ease'
                                        }}>
                                            <div
                                                onClick={() => toggleHint(i)}
                                                style={{
                                                    padding: '9px 12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    color: isDark ? '#FFFFFF' : '#111827',
                                                    fontSize: 13,
                                                    fontWeight: 600
                                                }}
                                            >
                                                <span style={{ color: isOpen ? (isDark ? '#C084FC' : '#9333EA') : (isDark ? '#FFFFFF' : '#111827') }}>
                                                    Hint {i + 1}
                                                </span>
                                                {isOpen 
                                                    ? <ChevronDown size={13} color={isDark ? "#C084FC" : "#9333EA"} /> 
                                                    : <ChevronRight size={13} color={isDark ? "#858585" : "#6B7280"} />}
                                            </div>
                                            {isOpen && (
                                                <div style={{
                                                    padding: '9px 12px',
                                                    fontSize: 13,
                                                    color: isDark ? '#D0D0D0' : '#4B5563',
                                                    borderTop: isDark ? '1px solid #1E1E1E' : '1px solid #E5E7EB',
                                                    lineHeight: 1.5,
                                                    backgroundColor: isDark ? '#0D0D0D' : '#F9FAFB'
                                                }}>
                                                    {hint}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                   TAB 2: EDITORIAL (Clean Coming Soon)
                   ───────────────────────────────────────────────────────────── */}
                {activeTab === 'editorial' && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px 20px',
                        textAlign: 'center',
                        gap: 12
                    }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            backgroundColor: isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                            border: isDark ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(5, 150, 105, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <BookOpen size={26} color={isDark ? "#34D399" : "#059669"} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{
                                fontSize: 11,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                color: isDark ? '#34D399' : '#059669'
                            }}>
                                Editorial
                            </span>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#FFFFFF' : '#111827', margin: 0 }}>
                                Coming Soon
                            </h2>
                            <p style={{ fontSize: 13.5, color: isDark ? '#888888' : '#6B7280', margin: '4px 0 0 0', maxWidth: 380, lineHeight: 1.5 }}>
                                Editorial is coming soon.
                            </p>
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                   TAB 3: SUBMISSIONS (Codeforces-Style Submission History)
                   ───────────────────────────────────────────────────────────── */}
                {activeTab === 'submissions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 920 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h2 style={{ fontSize: 16.5, fontWeight: 700, color: isDark ? '#FFFFFF' : '#111827', margin: 0 }}>
                                    Submission History
                                </h2>
                                {submissions.length > 0 && (
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                                        color: isDark ? '#A0A0A0' : '#4B5563',
                                        padding: '2px 7px',
                                        borderRadius: 10
                                    }}>
                                        {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {submissionsLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: isDark ? '#707070' : '#9CA3AF', fontSize: 13 }}>
                                Fetching submissions...
                            </div>
                        ) : submissions.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 10,
                                color: isDark ? '#707070' : '#9CA3AF'
                            }}>
                                <CheckCircle2 size={32} color={isDark ? "#60A5FA" : "#2563EB"} />
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#FFFFFF' : '#111827', margin: 0 }}>
                                    You haven't submitted this problem yet.
                                </h3>
                                <p style={{ fontSize: 13, color: isDark ? '#707070' : '#6B7280', maxWidth: 380, margin: 0, lineHeight: 1.5 }}>
                                    Write your complete C program and click <strong>Submit</strong> (or press <kbd style={{ padding: '1px 5px', borderRadius: 3, border: '1px solid #444', backgroundColor: '#222', fontSize: 11 }}>Ctrl+Shift+Enter</kbd>) to evaluate against all database test cases.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {submissions.map((sub, i) => {
                                    const subId = sub._id || sub.id || `sub_${i}`;
                                    // Default the very first (newest) submission to expanded
                                    const isExpanded = expandedSubmissions[subId] !== undefined 
                                        ? !!expandedSubmissions[subId] 
                                        : (i === 0);

                                    const isAccepted = sub.status === 'Accepted';
                                    const isCompileErr = sub.status === 'Compilation Error';
                                    const isWrongAns = sub.status === 'Wrong Answer';
                                    const isTimeLimit = sub.status === 'Time Limit Exceeded';
                                    const isMemoryLimit = sub.status === 'Memory Limit Exceeded';
                                    const isOutputLimit = sub.status === 'Output Limit Exceeded';
                                    const isRuntimeErr = sub.status === 'Runtime Error';

                                    const statusColor = isAccepted 
                                        ? (isDark ? '#22C55E' : '#16A34A')
                                        : (isCompileErr || isTimeLimit || isMemoryLimit || isOutputLimit)
                                            ? (isDark ? '#F59E0B' : '#D97706')
                                            : (isDark ? '#EF4444' : '#DC2626');

                                    const statusBg = isAccepted
                                        ? (isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.08)')
                                        : (isCompileErr || isTimeLimit || isMemoryLimit || isOutputLimit)
                                            ? (isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.08)')
                                            : (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.08)');

                                    const passedCount = isCompileErr ? 0 : (sub.passedTestCases ?? 0);
                                    const totalCount = sub.totalTestCases ?? 10;

                                    return (
                                        <div key={subId} style={{
                                            backgroundColor: isDark ? '#111111' : '#FFFFFF',
                                            border: isExpanded
                                                ? (isDark ? '1px solid #333333' : '1px solid #CBD5E1')
                                                : (isDark ? '1px solid #202020' : '1px solid #E5E7EB'),
                                            borderRadius: 6,
                                            overflow: 'hidden',
                                            transition: 'all 0.15s ease'
                                        }}>
                                            {/* Compact Codeforces-Style Header Row */}
                                            <div 
                                                onClick={() => toggleSubmissionExpand(subId)}
                                                style={{
                                                    padding: '10px 14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    backgroundColor: isDark ? '#111111' : '#FFFFFF',
                                                    flexWrap: 'wrap',
                                                    gap: 8,
                                                    userSelect: 'none'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                    {/* Status Badge */}
                                                    <span style={{
                                                        fontSize: 12,
                                                        fontWeight: 800,
                                                        color: statusColor,
                                                        backgroundColor: statusBg,
                                                        padding: '3px 9px',
                                                        borderRadius: 4,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4
                                                    }}>
                                                        {isAccepted ? '✓ Accepted' : isCompileErr ? '⚠ Compilation Error' : isTimeLimit ? '⏱ Time Limit Exceeded' : isMemoryLimit ? '🧠 Memory Limit Exceeded' : isOutputLimit ? '📄 Output Limit Exceeded' : isRuntimeErr ? '✗ Runtime Error' : `✗ ${sub.status || 'Wrong Answer'}`}
                                                    </span>

                                                    {/* Passed / Total Cases */}
                                                    <span style={{
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        color: isAccepted ? (isDark ? '#34D399' : '#059669') : (isDark ? '#D1D5DB' : '#374151'),
                                                        fontFamily: '"JetBrains Mono", monospace'
                                                    }}>
                                                        {passedCount} / {totalCount} Passed
                                                    </span>

                                                    {/* Language Tag */}
                                                    <span style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        color: isDark ? '#60A5FA' : '#2563EB',
                                                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                                                        padding: '2px 7px',
                                                        borderRadius: 4
                                                    }}>
                                                        {(sub.languageSlug || sub.language || 'C').toUpperCase()}
                                                    </span>

                                                    {/* Runtime */}
                                                    {sub.runtime && (
                                                        <span style={{ fontSize: 11.5, color: isDark ? '#888888' : '#6B7280', fontFamily: 'monospace' }}>
                                                            {sub.runtime}
                                                        </span>
                                                    )}

                                                    {/* Relative Timestamp */}
                                                    <span style={{ fontSize: 11, color: isDark ? '#707070' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Clock size={11} />
                                                        {formatRelativeTime(sub.createdAt)}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {sub.code && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onLoadSubmissionCode) {
                                                                    onLoadSubmissionCode(sub.code);
                                                                    toast.success('Loaded submitted code into editor!');
                                                                }
                                                            }}
                                                            style={{
                                                                background: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                                                                border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(37, 99, 235, 0.2)',
                                                                color: isDark ? '#60A5FA' : '#2563EB',
                                                                borderRadius: 4,
                                                                padding: '3px 8px',
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Load in Editor
                                                        </button>
                                                    )}

                                                    <div style={{ color: isDark ? '#A0A0A0' : '#6B7280', display: 'flex', alignItems: 'center' }}>
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Detailed Breakdown */}
                                            {isExpanded && (
                                                <div style={{
                                                    padding: '14px 16px',
                                                    borderTop: isDark ? '1px solid #1C1C1C' : '1px solid #E5E7EB',
                                                    backgroundColor: isDark ? '#0A0A0A' : '#F9FAFB',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 14
                                                }}>
                                                    {/* 1. Compilation Error Output */}
                                                    {isCompileErr && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontSize: 12, fontWeight: 700 }}>
                                                                <XCircle size={14} color="#EF4444" />
                                                                <span>Compiler Diagnostic Output (0 / {totalCount} test cases executed):</span>
                                                            </div>
                                                            <pre style={{
                                                                margin: 0,
                                                                padding: '10px 12px',
                                                                backgroundColor: isDark ? '#180B0B' : '#FEF2F2',
                                                                border: isDark ? '1px solid #7F1D1D' : '1px solid #FCA5A5',
                                                                borderRadius: 4,
                                                                fontFamily: '"JetBrains Mono", monospace',
                                                                fontSize: 12,
                                                                color: '#EF4444',
                                                                whiteSpace: 'pre-wrap',
                                                                lineHeight: 1.45
                                                            }}>
                                                                {sub.stderr || 'Compilation failed with non-zero exit code.'}
                                                            </pre>
                                                        </div>
                                                    )}

                                                    {/* 2. All Evaluated Test Cases (Both Passed and Failed) */}
                                                    {!isCompileErr && sub.testCaseResults && sub.testCaseResults.length > 0 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                            <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#A0A0A0' : '#4B5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                                Evaluated Test Cases ({sub.testCaseResults.filter(t => t.status === 'passed').length}/{sub.testCaseResults.length} Passed)
                                                            </span>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                {sub.testCaseResults.map((tc, idx) => {
                                                                    const tcPassed = tc.status === 'passed';
                                                                    const tcStatusColor = tcPassed ? '#22C55E' : '#EF4444';

                                                                    return (
                                                                        <div key={idx} style={{
                                                                            backgroundColor: isDark ? '#111111' : '#FFFFFF',
                                                                            border: tcPassed 
                                                                                ? (isDark ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid #BBF7D0')
                                                                                : (isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA'),
                                                                            borderRadius: 6,
                                                                            overflow: 'hidden'
                                                                        }}>
                                                                            {/* Test Case Header */}
                                                                            <div style={{
                                                                                padding: '7px 10px',
                                                                                backgroundColor: isDark ? '#141414' : '#F3F4F6',
                                                                                borderBottom: isDark ? '1px solid #1E1E1E' : '1px solid #E5E7EB',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'space-between',
                                                                                fontSize: 12
                                                                            }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                                    {tcPassed ? <CheckCircle size={13} color="#22C55E" /> : <XCircle size={13} color="#EF4444" />}
                                                                                    <span style={{ fontWeight: 700, color: tcStatusColor }}>
                                                                                        {tc.name || `Case ${idx + 1}`}
                                                                                    </span>
                                                                                    <span style={{
                                                                                        fontSize: 10.5,
                                                                                        fontWeight: 700,
                                                                                        color: tcStatusColor,
                                                                                        backgroundColor: tcPassed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                                                        padding: '1px 5px',
                                                                                        borderRadius: 3,
                                                                                        textTransform: 'uppercase'
                                                                                    }}>
                                                                                        {tc.status}
                                                                                    </span>
                                                                                </div>

                                                                                {tc.runtimeMs !== undefined && (
                                                                                    <span style={{ fontSize: 10.5, color: isDark ? '#707070' : '#9CA3AF', fontFamily: 'monospace' }}>
                                                                                        {tc.runtimeMs}ms
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* Test Case Inputs & Outputs Breakdown */}
                                                                            <div style={{
                                                                                padding: '10px 12px',
                                                                                display: 'grid',
                                                                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                                                                gap: 10
                                                                            }}>
                                                                                <div>
                                                                                    <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? '#707070' : '#6B7280', textTransform: 'uppercase' }}>INPUT</span>
                                                                                    <pre style={{
                                                                                        margin: '3px 0 0 0',
                                                                                        padding: '6px 8px',
                                                                                        backgroundColor: isDark ? '#050505' : '#F9FAFB',
                                                                                        border: isDark ? '1px solid #1C1C1C' : '1px solid #E5E7EB',
                                                                                        borderRadius: 4,
                                                                                        fontFamily: '"JetBrains Mono", monospace',
                                                                                        fontSize: 11.5,
                                                                                        color: isDark ? '#E5E7EB' : '#111827',
                                                                                        whiteSpace: 'pre-wrap'
                                                                                    }}>
                                                                                        {tc.input || '(No input)'}
                                                                                    </pre>
                                                                                </div>

                                                                                <div>
                                                                                    <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? '#707070' : '#6B7280', textTransform: 'uppercase' }}>EXPECTED OUTPUT</span>
                                                                                    <pre style={{
                                                                                        margin: '3px 0 0 0',
                                                                                        padding: '6px 8px',
                                                                                        backgroundColor: isDark ? '#050505' : '#F9FAFB',
                                                                                        border: isDark ? '1px solid #1C1C1C' : '1px solid #E5E7EB',
                                                                                        borderRadius: 4,
                                                                                        fontFamily: '"JetBrains Mono", monospace',
                                                                                        fontSize: 11.5,
                                                                                        color: isDark ? '#34D399' : '#059669',
                                                                                        whiteSpace: 'pre-wrap'
                                                                                    }}>
                                                                                        {tc.expectedOutput || '(Empty)'}
                                                                                    </pre>
                                                                                </div>

                                                                                <div>
                                                                                    <span style={{ fontSize: 10, fontWeight: 700, color: tcPassed ? '#22C55E' : '#EF4444', textTransform: 'uppercase' }}>YOUR OUTPUT</span>
                                                                                    <pre style={{
                                                                                        margin: '3px 0 0 0',
                                                                                        padding: '6px 8px',
                                                                                        backgroundColor: isDark ? '#050505' : '#F9FAFB',
                                                                                        border: tcPassed 
                                                                                            ? (isDark ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #BBF7D0')
                                                                                            : (isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA'),
                                                                                        borderRadius: 4,
                                                                                        fontFamily: '"JetBrains Mono", monospace',
                                                                                        fontSize: 11.5,
                                                                                        color: tcPassed ? '#22C55E' : '#EF4444',
                                                                                        whiteSpace: 'pre-wrap'
                                                                                    }}>
                                                                                        {tc.actualOutput || (tc.stderr ? `Error: ${tc.stderr}` : '(No output)')}
                                                                                    </pre>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 3. Submitted Source Code View */}
                                                    {sub.code && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#A0A0A0' : '#4B5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                                    Submitted Source Code
                                                                </span>
                                                                <button
                                                                    onClick={() => handleCopy(sub.code, `code_${subId}`)}
                                                                    style={{
                                                                        background: 'transparent',
                                                                        border: 'none',
                                                                        color: isDark ? '#888888' : '#6B7280',
                                                                        fontSize: 11,
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 4
                                                                    }}
                                                                >
                                                                    {copiedIndex === `code_${subId}` ? <Check size={12} color="#22C55E" /> : <Copy size={12} />}
                                                                    <span>{copiedIndex === `code_${subId}` ? 'Copied' : 'Copy'}</span>
                                                                </button>
                                                            </div>

                                                            <pre style={{
                                                                margin: 0,
                                                                padding: '10px 12px',
                                                                backgroundColor: isDark ? '#050505' : '#FFFFFF',
                                                                border: isDark ? '1px solid #1E1E1E' : '1px solid #E5E7EB',
                                                                borderRadius: 4,
                                                                fontFamily: '"JetBrains Mono", monospace',
                                                                fontSize: 12.5,
                                                                color: isDark ? '#E5E7EB' : '#111827',
                                                                lineHeight: 1.5,
                                                                whiteSpace: 'pre-wrap',
                                                                maxHeight: 280,
                                                                overflowY: 'auto'
                                                            }}>
                                                                {sub.code}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                   TAB 4: DISCUSSIONS (Honest Empty State)
                   ───────────────────────────────────────────────────────────── */}
                {activeTab === 'discussion' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 920 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ fontSize: 16.5, fontWeight: 700, color: isDark ? '#FFFFFF' : '#111827', margin: 0 }}>
                                Discussions
                            </h2>
                            {discussions.length > 0 && (
                                <span style={{ fontSize: 12, color: isDark ? '#707070' : '#6B7280' }}>
                                    {discussions.length} {discussions.length === 1 ? 'thread' : 'threads'}
                                </span>
                            )}
                        </div>

                        {/* New Comment Box */}
                        <form onSubmit={handleAddComment} style={{
                            backgroundColor: isDark ? '#111111' : '#FFFFFF',
                            border: isDark ? '1px solid #222222' : '1px solid #E5E7EB',
                            borderRadius: 6,
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10
                        }}>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Ask a question or share insights with college peers..."
                                rows={3}
                                style={{
                                    width: '100%',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: isDark ? '#FFFFFF' : '#111827',
                                    fontSize: 13,
                                    resize: 'none',
                                    lineHeight: 1.5,
                                    fontFamily: 'inherit'
                                }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isPostingComment}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '6px 14px',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        borderRadius: 4,
                                        border: 'none',
                                        backgroundColor: isDark ? '#7C3AED' : '#6D28D9',
                                        color: '#FFFFFF',
                                        cursor: !newComment.trim() || isPostingComment ? 'not-allowed' : 'pointer',
                                        opacity: !newComment.trim() || isPostingComment ? 0.5 : 1
                                    }}
                                >
                                    <Send size={12} />
                                    <span>{isPostingComment ? 'Posting...' : 'Post Comment'}</span>
                                </button>
                            </div>
                        </form>

                        {/* Discussions List */}
                        {discussionsLoading ? (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: isDark ? '#707070' : '#9CA3AF', fontSize: 13 }}>
                                Loading discussions...
                            </div>
                        ) : discussions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '50px 20px', color: isDark ? '#707070' : '#9CA3AF', fontSize: 13 }}>
                                No discussions yet. Start the first discussion.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {discussions.map(disc => (
                                    <div key={disc.id} style={{
                                        backgroundColor: isDark ? '#111111' : '#FFFFFF',
                                        border: isDark ? '1px solid #202020' : '1px solid #E5E7EB',
                                        borderRadius: 6,
                                        padding: '12px 14px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#FFFFFF' : '#111827' }}>
                                                {disc.authorName || 'Student'}
                                            </span>
                                            <span style={{ fontSize: 11, color: isDark ? '#707070' : '#9CA3AF' }}>
                                                {formatRelativeTime(disc.createdAt)}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 13, color: isDark ? '#D0D0D0' : '#374151', lineHeight: 1.55 }}>
                                            {disc.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 3. VIEW SUBMITTED CODE MODAL */}
            {selectedCodeModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: 20
                }}>
                    <div style={{
                        backgroundColor: isDark ? '#111111' : '#FFFFFF',
                        border: isDark ? '1px solid #2A2A2A' : '1px solid #D1D5DB',
                        borderRadius: 8,
                        width: '100%',
                        maxWidth: 720,
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '14px 18px',
                            borderBottom: isDark ? '1px solid #222222' : '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isDark ? '#161616' : '#F9FAFB'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Code2 size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                                <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#FFFFFF' : '#111827' }}>
                                    Submitted Source Code
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedCodeModal(null)}
                                style={{ background: 'transparent', border: 'none', color: isDark ? '#888888' : '#6B7280', cursor: 'pointer' }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ padding: '16px 18px', overflowY: 'auto', backgroundColor: isDark ? '#080808' : '#F3F4F6', flex: 1 }}>
                            <pre style={{
                                margin: 0,
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: 13,
                                color: isDark ? '#E5E7EB' : '#111827',
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap'
                            }}>
                                {selectedCodeModal.code}
                            </pre>
                        </div>

                        <div style={{
                            padding: '12px 18px',
                            borderTop: isDark ? '1px solid #222222' : '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isDark ? '#141414' : '#FFFFFF'
                        }}>
                            <span style={{ fontSize: 11.5, color: isDark ? '#707070' : '#6B7280' }}>
                                Submitted {formatRelativeTime(selectedCodeModal.createdAt)}
                            </span>
                            <button
                                onClick={() => {
                                    if (onLoadSubmissionCode) {
                                        onLoadSubmissionCode(selectedCodeModal.code);
                                        toast.success('Loaded code into editor!');
                                        setSelectedCodeModal(null);
                                    }
                                }}
                                style={{
                                    padding: '5px 12px',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    borderRadius: 4,
                                    border: 'none',
                                    backgroundColor: isDark ? '#7C3AED' : '#6D28D9',
                                    color: '#FFFFFF',
                                    cursor: 'pointer'
                                }}
                            >
                                Load in Editor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProblemPanel;
