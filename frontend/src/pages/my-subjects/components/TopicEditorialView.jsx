import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import EditorialActionBar from './EditorialActionBar';
import EditorialRenderer from './EditorialRenderer';
import { getPLC5TopicEditorial } from '../../../data/editorial/plc5';
import { getAcademicTopicEditorial } from '../../../services/academicContentApi';

// Dedicated in-memory cache and in-flight promise tracker to prevent duplicate requests
const EDITORIAL_CACHE = new Map();
const IN_FLIGHT_PROMISES = new Map();

// Pre-warm editorial cache with verified local PLC5 structured data for instant 0ms rendering
const PREWARMED_TOPICS = [
    { mod: 'basics', slug: 'before-you-start' },
    { mod: 'basics', slug: 'why-programming' },
    { mod: 'basics', slug: 'common-myths' },
    { mod: 'basics', slug: 'no-coding-background' },
    { mod: 'basics', slug: 'how-to-learn' },
    { mod: 'basics', slug: 'how-to-practice' },
    { mod: 'basics', slug: 'using-askursenior' },
    { mod: 'module1', slug: 'introduction-to-computers' },
    { mod: 'module-1', slug: 'introduction-to-computers' },
    { mod: 'module1', slug: 'input-and-output-devices' },
    { mod: 'module-1', slug: 'input-and-output-devices' },
    { mod: 'module1', slug: 'software-basics' },
    { mod: 'module-1', slug: 'software-basics' },
    { mod: 'module1', slug: 'structure-of-a-c-program' },
    { mod: 'module-1', slug: 'structure-of-a-c-program' }
];

const warmEditorialCache = () => {
    const subjects = ['plc5', '22plc55b', 'introduction-to-c-programming'];
    PREWARMED_TOPICS.forEach(({ mod, slug }) => {
        const doc = getPLC5TopicEditorial(mod, slug);
        if (doc) {
            subjects.forEach(s => {
                const k1 = `${s}/${mod}/${slug}`;
                const k2 = `${s}/${mod.replace('-', '')}/${slug}`;
                if (!EDITORIAL_CACHE.has(k1)) EDITORIAL_CACHE.set(k1, doc);
                if (!EDITORIAL_CACHE.has(k2)) EDITORIAL_CACHE.set(k2, doc);
            });
        }
    });
};
warmEditorialCache();

/**
 * Helper to clear cache for testing isolation
 */
export const clearEditorialCache = () => {
    EDITORIAL_CACHE.clear();
    IN_FLIGHT_PROMISES.clear();
};

/**
 * TopicEditorialView
 * 
 * Thin orchestration component for My Subjects editorial study sheets.
 * - Prioritizes fetching structured editorial documents from MongoDB Academic Content API
 * - Gracefully falls back to local structured editorial registry (getPLC5TopicEditorial)
 * - Prepares existing action bar, navigation, and progress props
 * - Delegates all article rendering to generic EditorialRenderer
 * - Preserves existing application topicId for progress compatibility
 */
const TopicEditorialView = ({ 
    activeSubject, 
    activeModule, 
    activeTopic, 
    onSelectPrevTopic,
    onSelectNextTopic,
    prevTopic,
    nextTopic,
    isCompleted = false,
    onToggleCompletion,
    isDark = true 
}) => {
    const slug = activeTopic?.slug || '';
    const rawModuleSlug = activeModule?.slug || (activeModule?.moduleNumber === 0 ? 'basics' : `module-${activeModule?.moduleNumber || 1}`);
    const resolvedModuleSlug = (activeModule?.moduleNumber === 0 || rawModuleSlug === 'module-0') 
        ? 'basics' 
        : rawModuleSlug.replace('-', ''); // 'module-1' -> 'module1'
    const moduleSlug = rawModuleSlug;
    const subjectKey = (activeSubject?.slug || activeSubject?.code || '').toLowerCase();

    const moduleDisplayTitle = activeModule?.displayLabel || activeModule?.title || (activeModule?.moduleNumber === 0 ? '0. Basics' : `M0${activeModule?.moduleNumber || 1}`);

    const allModuleTopics = activeModule?.topics || [];
    const currentTopicIndex = slug ? allModuleTopics.findIndex(t => t.slug === slug) : -1;
    const topicNumber = currentTopicIndex >= 0 ? currentTopicIndex + 1 : 1;
    const totalTopics = allModuleTopics.length || (activeModule?.moduleNumber === 1 ? 12 : 7);

    const isPLC5Subject = Boolean(
        subjectKey === 'plc5' ||
        (activeSubject?.code && /plc5/i.test(activeSubject.code)) ||
        (activeSubject?.slug && /plc5/i.test(activeSubject.slug)) ||
        (activeSubject?.name && /c\s*programming/i.test(activeSubject.name))
    );

    // Synchronous initial state: check memory cache, else local fallback (for PLC5 only)
    const requestKey = (slug && subjectKey) ? `${subjectKey}/${resolvedModuleSlug}/${slug}` : '';
    const cachedApiDoc = requestKey ? EDITORIAL_CACHE.get(requestKey) : null;
    const fallbackDoc = (isPLC5Subject && slug) 
        ? (getPLC5TopicEditorial(resolvedModuleSlug, slug) || getPLC5TopicEditorial(moduleSlug, slug))
        : null;

    // Synchronously adjust state during render on topic switch (React pattern to eliminate stale-content lag)
    const [prevRequestKey, setPrevRequestKey] = useState(requestKey);
    const [editorialDoc, setEditorialDoc] = useState(() => (requestKey ? (cachedApiDoc || fallbackDoc || null) : null));

    if (prevRequestKey !== requestKey) {
        setPrevRequestKey(requestKey);
        const nextDoc = requestKey ? (cachedApiDoc || fallbackDoc || null) : null;
        setEditorialDoc(nextDoc);
    }

    // Fetch from MongoDB Academic Content API with deduplication and safe fallback
    useEffect(() => {
        if (!requestKey) {
            setEditorialDoc(null);
            return;
        }

        let isCancelled = false;

        // If already in memory cache, ensure state matches
        const cached = EDITORIAL_CACHE.get(requestKey);
        if (cached) {
            setEditorialDoc(cached);
            return;
        }

        // Deduplicate in-flight requests (handles StrictMode double-mounting)
        let fetchPromise = IN_FLIGHT_PROMISES.get(requestKey);
        if (!fetchPromise) {
            fetchPromise = getAcademicTopicEditorial(subjectKey, resolvedModuleSlug, slug);
            IN_FLIGHT_PROMISES.set(requestKey, fetchPromise);
        }

        fetchPromise
            .then((res) => {
                IN_FLIGHT_PROMISES.delete(requestKey);
                if (isCancelled) return;

                if (res?.success && res?.data?.editorial && Array.isArray(res.data.editorial.blocks) && res.data.editorial.blocks.length > 0) {
                    const apiDoc = {
                        title: res.data.editorial.title || activeTopic?.title,
                        version: res.data.editorial.version || 1,
                        status: res.data.editorial.status || 'Published',
                        sections: res.data.editorial.sections || [],
                        blocks: res.data.editorial.blocks || [],
                        breadcrumbs: [moduleDisplayTitle, activeTopic?.title || res.data.editorial.title],
                        topicId: res.data.topic?.topicId || activeTopic?.id, // Preserved application topicId
                        source: 'api'
                    };
                    EDITORIAL_CACHE.set(requestKey, apiDoc);
                    setEditorialDoc(apiDoc);
                } else {
                    // Malformed or empty response: use local structured fallback (PLC5 only)
                    const fallback = isPLC5Subject 
                        ? (getPLC5TopicEditorial(resolvedModuleSlug, slug) || getPLC5TopicEditorial(moduleSlug, slug))
                        : null;
                    setEditorialDoc(fallback || null);
                }
            })
            .catch(() => {
                IN_FLIGHT_PROMISES.delete(requestKey);
                if (isCancelled) return;

                // Network error, 404, or unauthenticated: intentional local fallback (PLC5 only)
                const fallback = isPLC5Subject 
                    ? (getPLC5TopicEditorial(resolvedModuleSlug, slug) || getPLC5TopicEditorial(moduleSlug, slug))
                    : null;
                setEditorialDoc(fallback || null);
            });

        return () => {
            isCancelled = true;
        };
    }, [requestKey, subjectKey, resolvedModuleSlug, slug, moduleSlug, moduleDisplayTitle, activeTopic, isPLC5Subject, fallbackDoc]);

    // Theme palette for right column progress indicator
    const progressColors = isDark ? {
        track: '#2D2D2D',
        fill: '#7A7A7A',
        label: '#7A7A7A',
        sublabel: '#999999',
        divider: '#2D2D2D'
    } : {
        track: '#E5E7EB',
        fill: '#4B5563',
        label: '#6B7280',
        sublabel: '#374151',
        divider: '#E5E7EB'
    };

    // Minimal Progress Indicator attached below TOC in right sticky column
    const rightColumnProgressNode = (
        <div style={{ borderColor: progressColors.divider }} className="mt-8 pt-5 border-t">
            <div style={{ color: progressColors.label }} className="flex items-center justify-between text-[11px] font-mono mb-2">
                <span style={{ color: progressColors.sublabel }} className="font-medium truncate max-w-[110px]" title={moduleDisplayTitle}>
                    {moduleDisplayTitle}
                </span>
                <span>{topicNumber} / {totalTopics} topics</span>
            </div>
            <div style={{ background: progressColors.track }} className="w-full h-1 rounded-full overflow-hidden">
                <div 
                    style={{ 
                        background: progressColors.fill,
                        width: `${(topicNumber / totalTopics) * 100}%` 
                    }}
                    className="h-full rounded-full transition-all duration-300"
                />
            </div>
        </div>
    );

    // Action Bar connected with existing navigation, completion, and progress callbacks
    const actionBarNode = (
        <EditorialActionBar 
            subjectSlug={subjectKey}
            moduleSlug={moduleSlug}
            topicSlug={slug}
            topicTitle={activeTopic?.title || activeTopic?.name || editorialDoc?.title || 'Topic'}
            prevTopic={prevTopic}
            nextTopic={nextTopic}
            onSelectPrevTopic={prevTopic && onSelectPrevTopic ? onSelectPrevTopic : undefined}
            onSelectNextTopic={nextTopic && onSelectNextTopic ? onSelectNextTopic : undefined}
            isCompleted={isCompleted}
            onToggleCompletion={onToggleCompletion}
            isDark={isDark}
        />
    );

    // Primary: Render structured editorial document through generic EditorialRenderer
    if (editorialDoc) {
        return (
            <EditorialRenderer 
                content={editorialDoc}
                isDark={isDark}
                actionBar={actionBarNode}
                rightColumnExtra={rightColumnProgressNode}
            />
        );
    }

    // Graceful Fallback if content document is not found
    const topicLabel = activeTopic?.title || activeTopic?.displayLabel || activeTopic?.name || slug || 'Topic';

    return (
        <div 
            className="w-full text-left pt-2 pb-10 flex items-start gap-10 xl:gap-14 flex-1"
            style={{ background: isDark ? '#1E1E1E' : '#F6F7F9' }}
        >
            <div className="w-full flex-1 max-w-[760px] min-w-0 flex flex-col justify-between min-h-[420px]">
                <div>
                    <div style={{ color: isDark ? '#777777' : '#9CA3AF' }} className="mb-6 text-[12px] font-mono select-none">
                        <span>{moduleDisplayTitle}</span>
                        <span style={{ color: isDark ? '#444444' : '#D1D5DB' }} className="mx-2">/</span>
                        <span style={{ color: isDark ? '#A0A0A0' : '#4B5563' }}>
                            {topicLabel}
                        </span>
                    </div>

                    <div 
                        className="rounded-2xl p-8 sm:p-12 border text-center flex flex-col items-center justify-center relative overflow-hidden my-4"
                        style={{
                            background: isDark ? '#161616' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.04)'
                        }}
                    >
                        <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border shadow-sm"
                            style={{
                                background: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                                borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.2)',
                                color: isDark ? '#60A5FA' : '#2563EB'
                            }}
                        >
                            <BookOpen className="w-7 h-7" />
                        </div>

                        <div 
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3"
                            style={{
                                background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                                color: isDark ? '#9CA3AF' : '#6B7280'
                            }}
                        >
                            Coming Soon
                        </div>

                        <h2 
                            className="text-xl sm:text-2xl font-bold tracking-tight mb-3"
                            style={{ color: isDark ? '#F3F4F6' : '#111827' }}
                        >
                            {topicLabel}
                        </h2>

                        <p 
                            className="max-w-md text-sm leading-relaxed mb-1"
                            style={{ color: isDark ? '#9CA3AF' : '#4B5563' }}
                        >
                            Editorial content for this topic is being prepared.
                        </p>
                        <p 
                            className="max-w-md text-xs leading-relaxed"
                            style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}
                        >
                            Comprehensive study sheets, verified exam notes, and key definitions will be published here soon.
                        </p>
                    </div>
                </div>

                {(prevTopic || nextTopic) && (
                    <div 
                        className="mt-8 pt-5 pb-2 border-t w-full flex items-center justify-between gap-4"
                        style={{ borderColor: progressColors.divider }}
                    >
                        {prevTopic && onSelectPrevTopic ? (
                            <button
                                onClick={onSelectPrevTopic}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border"
                                style={{
                                    background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                                    color: isDark ? '#D1D5DB' : '#374151'
                                }}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Previous Topic</span>
                            </button>
                        ) : <div />}

                        {nextTopic && onSelectNextTopic ? (
                            <button
                                onClick={onSelectNextTopic}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border"
                                style={{
                                    background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                                    color: isDark ? '#D1D5DB' : '#374151'
                                }}
                            >
                                <span>Next Topic</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : <div />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopicEditorialView;
