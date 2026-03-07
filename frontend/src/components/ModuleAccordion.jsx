import React, { useMemo, useState } from 'react';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import { calculateModuleProgress } from '../utils/constants';
import { subjectAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ModuleAccordion = ({
    module,
    subject,
    onQuestionToggle,
    view = 'all',
    revisionIds = [],
    onToggleRevision,
    theme = 'light',
    onNotesUploaded,
    isLockedModule = false
}) => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
    const [notesLoading, setNotesLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const isLightMode = theme === 'light';
    const progress = calculateModuleProgress(module.questions);
    const completed = module.questions.filter((q) => q.completed).length;
    const total = module.questions.length;

    const questionsToShow = useMemo(() => {
        if (view !== 'revision') return module.questions;
        const set = new Set(revisionIds);
        return module.questions.filter((q) => set.has(q._id));
    }, [module.questions, revisionIds, view]);

    const handleNotesClick = async (e) => {
        e.stopPropagation();
        if (!module.notesKey) {
            alert('No notes available for this module yet.');
            return;
        }
        setNotesLoading(true);
        try {
            const response = await subjectAPI.getModuleNotes(subject._id, module.moduleNumber);
            setPdfUrl(response.data.url);
            setShowPdfModal(true);
        } catch (error) {
            console.error('Error fetching notes:', error);
            alert(error.response?.data?.error || 'Failed to load notes');
        } finally {
            setNotesLoading(false);
        }
    };

    const closePdfModal = () => {
        setShowPdfModal(false);
        setPdfUrl(null);
    };

    return (
        <div
            className={`border rounded-lg mb-3 overflow-hidden shadow-sm transition ${isLightMode ? 'border-slate-200 bg-white' : 'border-white/10 bg-dark-100'}`}
        >
            {/* UPGRADE_SECTION_HIDDEN: isLockedModule outer div had: ${isLockedModule ? 'opacity-80 hover:border-purple-500/30 hover:shadow-md cursor-pointer' : ''} */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(!expanded)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpanded(!expanded);
                    }
                }}
                className={`w-full px-4 py-3 min-h-11 transition flex flex-col sm:flex-row sm:items-center items-start sm:justify-between gap-3 cursor-pointer outline-none focus:ring-1 focus:ring-purple-500/30 ${isLightMode ? 'bg-white hover:bg-slate-50' : 'bg-dark-100 hover:bg-dark-50'
                    }`}
            >
                <div className="w-full sm:flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {/* UPGRADE_SECTION_HIDDEN: Uncomment to show lock icon on locked modules
                            {isLockedModule && (
                                <svg className={`w-4 h-4 shrink-0 ${isLightMode ? 'text-purple-500' : 'text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            )}
                            */}
                            <span className={`font-semibold block text-left ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>{module.title}</span>
                        </div>
                    </div>

                    <div className="mt-2 sm:hidden">
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <ProgressBar progress={progress} height={10} theme={theme} />
                            </div>
                            <span
                                className={`text-xs font-semibold px-2 py-1 rounded-full border shrink-0 ${isLightMode
                                    ? 'text-purple-700 bg-purple-100 border-purple-300'
                                    : 'text-purple-200 bg-purple-600/20 border-purple-400/30'
                                    }`}
                            >
                                {completed}/{total}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isLightMode
                                ? 'border-slate-200 bg-white text-slate-500 hover:text-purple-700 hover:border-purple-300'
                                : 'border-white/10 bg-white/5 text-secondary-300 hover:text-purple-200 hover:border-purple-400/40'
                                }`}
                            title="Articles: coming soon"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                                <path d="M14 3v3h3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                                <path d="M8 11h8M8 15h8M8 19h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            onClick={handleNotesClick}
                            disabled={notesLoading}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${module.notesKey
                                ? isLightMode
                                    ? 'border-green-300 bg-green-50 text-green-600 hover:bg-green-100'
                                    : 'border-green-400/40 bg-green-600/20 text-green-300 hover:bg-green-600/30'
                                : isLightMode
                                    ? 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
                                    : 'border-white/10 bg-white/5 text-secondary-500 cursor-not-allowed'
                                }`}
                            title={module.notesKey ? 'View Notes' : 'Notes not available'}
                        >
                            {notesLoading ? (
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 3.5H14C14.5523 3.5 15 3.94772 15 4.5V16.5L12.5 15L10 16.5L7.5 15L5 16.5V4.5C5 3.94772 5.44772 3.5 6 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                    <path d="M7 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M7 10H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isLightMode
                                ? 'border-slate-200 bg-white text-slate-500 hover:text-purple-700 hover:border-purple-300'
                                : 'border-white/10 bg-white/5 text-secondary-300 hover:text-purple-200 hover:border-purple-400/40'
                                }`}
                            title="FAQs: coming soon"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 15a4 4 0 0 1-4 4H9l-5 2V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                                <path d="M9.5 9.25a2.5 2.5 0 1 1 3.5 2.3c-.9.35-1.25.75-1.25 1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M11.75 16h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className="hidden sm:block w-1/4 min-w-[120px]">
                        <ProgressBar progress={progress} height={10} theme={theme} />
                    </div>

                    <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full border ${isLightMode
                            ? 'text-purple-700 bg-purple-100 border-purple-300'
                            : 'text-purple-200 bg-purple-600/20 border-purple-400/30'
                            }`}
                    >
                        {completed}/{total}
                    </span>
                    {/* UPGRADE_SECTION_HIDDEN: Uncomment to show lock/chevron toggle based on isLockedModule
                    {isLockedModule ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/80 border border-purple-500/30 text-purple-400 shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    ) : (
                    */}
                    <svg
                        className={`w-5 h-5 text-primary-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                    </svg>
                    {/* )} */}
                </div>
            </div>

            {expanded && (
                <div className={`p-4 border-t ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-dark-50 border-white/10'}`}>
                    <div className="space-y-3">
                        {questionsToShow.map((question) => (
                            <QuestionCard
                                key={question._id}
                                question={question}
                                isRevision={revisionIds.includes(question._id)}
                                onToggleRevision={() => onToggleRevision?.(question._id)}
                                onToggle={() =>
                                    onQuestionToggle({
                                        subjectId: subject._id,
                                        moduleNumber: module.moduleNumber,
                                        questionId: question._id
                                    })
                                }
                                theme={theme}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* PDF Preview Modal */}
            {showPdfModal && pdfUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={closePdfModal}
                >
                    <div
                        className={`relative w-full max-w-5xl h-[90vh] rounded-lg overflow-hidden ${isLightMode ? 'bg-white' : 'bg-dark-100'
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`flex items-center justify-between px-4 py-3 border-b ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-dark-50 border-white/10'
                            }`}>
                            <h3 className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                                {module.title} - Notes
                            </h3>
                            <div className="flex items-center gap-2">
                                <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${isLightMode
                                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                        : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30'
                                        }`}
                                >
                                    Open in New Tab
                                </a>
                                <button
                                    onClick={closePdfModal}
                                    className={`p-2 rounded-lg transition ${isLightMode
                                        ? 'hover:bg-slate-200 text-slate-600'
                                        : 'hover:bg-white/10 text-white'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        {/* PDF Embed */}
                        <iframe
                            src={pdfUrl}
                            className="w-full h-[calc(90vh-60px)]"
                            title={`${module.title} Notes`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(ModuleAccordion);
