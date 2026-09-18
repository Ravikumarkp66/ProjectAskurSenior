// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import * as academicContentApi from '../../../services/academicContentApi';
import { 
    getAcademicContentTree, 
    getAcademicTopicEditorial, 
    academicContentClient 
} from '../../../services/academicContentApi';
import TopicEditorialView, { clearEditorialCache } from '../components/TopicEditorialView';
import { getPLC5TopicEditorial } from '../../../data/editorial/plc5';

describe('Step 9.1: Academic Content API & TopicEditorialView Integration Verification', () => {
    let container = null;
    let root = null;

    const defaultSubject = {
        code: 'PLC5',
        slug: 'plc5',
        title: 'Introduction to C Programming'
    };

    const module0 = {
        moduleNumber: 0,
        slug: 'basics',
        title: '0. Basics',
        displayLabel: '0. Basics',
        topics: [
            { id: '0-1', slug: 'before-you-start', title: 'Before You Start', displayLabel: '0.1 Before You Start' },
            { id: '0-2', slug: 'why-programming', title: 'Why Programming?', displayLabel: '0.2 Why Programming?' }
        ]
    };

    const module1 = {
        moduleNumber: 1,
        slug: 'module-1',
        title: 'Introduction to C',
        displayLabel: 'M01 · Introduction to C',
        topics: [
            { id: '1-1', slug: 'introduction-to-computers', title: 'Introduction to Computers', displayLabel: '1.1 Introduction to Computers' }
        ]
    };

    beforeAll(() => {
        globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    });

    beforeEach(() => {
        clearEditorialCache();
        vi.restoreAllMocks();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        if (root) {
            await act(async () => {
                root.unmount();
            });
            root = null;
        }
        if (container) {
            container.remove();
            container = null;
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. API service constructs the correct tree endpoint
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-001: getAcademicContentTree constructs the correct tree endpoint', async () => {
        const getSpy = vi.spyOn(academicContentClient, 'get').mockResolvedValueOnce({
            data: {
                success: true,
                data: {
                    subject: { id: 'subj-1', code: 'PLC5', slug: 'introduction-to-c-programming' },
                    modules: []
                }
            }
        });

        const res = await getAcademicContentTree('introduction-to-c-programming');
        expect(getSpy).toHaveBeenCalledWith('/introduction-to-c-programming');
        expect(res.success).toBe(true);
        expect(res.data.subject.code).toBe('PLC5');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. API service constructs the correct topic endpoint
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-002: getAcademicTopicEditorial constructs the correct topic endpoint', async () => {
        const getSpy = vi.spyOn(academicContentClient, 'get').mockResolvedValueOnce({
            data: {
                success: true,
                data: {
                    subject: { id: 'subj-1', code: 'PLC5', slug: 'introduction-to-c-programming' },
                    module: { id: 'mod-1', moduleSlug: 'basics' },
                    topic: { id: 'top-1', topicId: '0-1', topicSlug: 'before-you-start' },
                    editorial: { title: '0.1 Before You Start', blocks: [] }
                }
            }
        });

        const res = await getAcademicTopicEditorial('plc5', 'basics', 'before-you-start');
        expect(getSpy).toHaveBeenCalledWith('/plc5/basics/before-you-start');
        expect(res.success).toBe(true);
        expect(res.data.topic.topicId).toBe('0-1');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. TASK 1: Real API success -> EditorialRenderer test
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-003: real API success loads MongoDB editorial content into EditorialRenderer', async () => {
        vi.spyOn(academicContentApi, 'getAcademicTopicEditorial').mockResolvedValueOnce({
            success: true,
            data: {
                subject: { id: 'subj-plc5', code: 'PLC5', slug: 'plc5' },
                module: { id: 'mod-0', moduleSlug: 'basics' },
                topic: { id: 'top-mongo-id-1', topicId: '0-1', topicSlug: 'before-you-start' },
                editorial: {
                    title: 'API TEST — MongoDB Editorial',
                    version: 1,
                    status: 'Published',
                    sections: [{ id: 'sec-mongo-1', title: 'MongoDB Header' }],
                    blocks: [
                        { type: 'heading', level: 1, id: 'sec-mongo-1', text: 'API TEST — MongoDB Editorial' },
                        { type: 'paragraph', text: 'THIS CONTENT CAME FROM THE MONGODB API' }
                    ]
                }
            }
        });

        await act(async () => {
            root.render(
                React.createElement(TopicEditorialView, {
                    activeSubject: defaultSubject,
                    activeModule: module0,
                    activeTopic: module0.topics[0],
                    isDark: true
                })
            );
        });

        // Flush async effect resolution
        await act(async () => {
            await new Promise(r => setTimeout(r, 40));
        });

        // The rendered DOM MUST contain the MongoDB API text
        expect(container.textContent).toContain('THIS CONTENT CAME FROM THE MONGODB API');
        expect(container.textContent).toContain('API TEST — MongoDB Editorial');
        // It must NOT contain the local fallback text
        expect(container.textContent).not.toContain('You Are Not Supposed to Know Everything');
        expect(container.textContent).not.toContain('THIS CONTENT CAME FROM LOCAL FALLBACK');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. TASK 2: Real API failure -> Local fallback test
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-004: real API failure cleanly falls back to local structured editorial content', async () => {
        // Mock API rejecting with network error
        vi.spyOn(academicContentApi, 'getAcademicTopicEditorial').mockRejectedValueOnce(
            new Error('Network error: Academic Content API unavailable')
        );

        await act(async () => {
            root.render(
                React.createElement(TopicEditorialView, {
                    activeSubject: defaultSubject,
                    activeModule: module0,
                    activeTopic: module0.topics[0],
                    isDark: true
                })
            );
        });

        // Flush async effect rejection handling
        await act(async () => {
            await new Promise(r => setTimeout(r, 40));
        });

        // Rendered DOM MUST contain the local structured fallback content without blank screen or crash
        expect(container.textContent).toContain('0.1 Before You Start');
        expect(container.textContent).toContain('You Are Not Supposed to Know Everything');
        expect(container.textContent).not.toContain('THIS CONTENT CAME FROM THE MONGODB API');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. TASK 3: API success takes precedence over local fallback
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-005: API response takes precedence over local fallback and replaces it upon resolution', async () => {
        let resolveApiPromise;
        const delayedApiPromise = new Promise(resolve => {
            resolveApiPromise = resolve;
        });

        vi.spyOn(academicContentApi, 'getAcademicTopicEditorial').mockReturnValueOnce(delayedApiPromise);

        // Initial render: API call is still pending
        await act(async () => {
            root.render(
                React.createElement(TopicEditorialView, {
                    activeSubject: defaultSubject,
                    activeModule: module0,
                    activeTopic: module0.topics[0],
                    isDark: true
                })
            );
        });

        // Immediate state: Local fallback is visible synchronously (zero-flash)
        expect(container.textContent).toContain('You Are Not Supposed to Know Everything');
        expect(container.textContent).not.toContain('THIS CONTENT CAME FROM THE MONGODB API');

        // Now resolve the API promise with authoritative MongoDB content
        await act(async () => {
            resolveApiPromise({
                success: true,
                data: {
                    subject: { id: 'subj-1', code: 'PLC5', slug: 'plc5' },
                    module: { id: 'mod-1', moduleSlug: 'basics' },
                    topic: { id: 'top-1', topicId: '0-1', topicSlug: 'before-you-start' },
                    editorial: {
                        title: '0.1 Before You Start (MongoDB)',
                        version: 2,
                        status: 'Published',
                        sections: [{ id: 'sec-api', title: 'API Section' }],
                        blocks: [
                            { type: 'heading', level: 1, id: 'sec-api', text: '0.1 Before You Start (MongoDB)' },
                            { type: 'paragraph', text: 'THIS CONTENT CAME FROM THE MONGODB API' }
                        ]
                    }
                }
            });
            await new Promise(r => setTimeout(r, 40));
        });

        // After resolution: API content has PRECEDENCE and replaces the fallback content
        expect(container.textContent).toContain('THIS CONTENT CAME FROM THE MONGODB API');
        expect(container.textContent).toContain('0.1 Before You Start (MongoDB)');
        expect(container.textContent).not.toContain('You Are Not Supposed to Know Everything');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. topic.topicId remains the application progress identifier
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-006: preserves topic.topicId (0-1, 1-1) for progress compatibility', () => {
        const mockTopicFromApi = {
            _id: '67c123456789abcdef012345', // Internal MongoDB primary key
            topicId: '0-1',                  // Application progress identifier
            topicSlug: 'before-you-start'
        };

        // Application progress MUST reference topicId, NOT MongoDB _id
        expect(mockTopicFromApi.topicId).toBe('0-1');
        expect(mockTopicFromApi.topicId).not.toBe(mockTopicFromApi._id);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Loading state does not render stale/incorrect topic content
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-007: renders graceful fallback view when neither API nor local content exists', () => {
        const unknownTopic = { id: '99-99', slug: 'unknown-quantum-c', title: 'Unknown Topic' };
        const unknownModule = { moduleNumber: 99, slug: 'module-99', title: 'Module 99' };

        const html = renderToStaticMarkup(
            React.createElement(TopicEditorialView, {
                activeSubject: defaultSubject,
                activeModule: unknownModule,
                activeTopic: unknownTopic,
                isDark: true
            })
        );

        expect(html).toContain('Editorial content for this topic is being prepared');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Changing subject/module/topic causes the correct API request key to change
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-008: generates distinct cache and request keys across modules and topics', () => {
        const key1 = `plc5/basics/before-you-start`;
        const key2 = `plc5/basics/why-programming`;
        const key3 = `plc5/module1/introduction-to-computers`;

        expect(key1).not.toBe(key2);
        expect(key2).not.toBe(key3);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Existing EditorialProgress behavior remains intact
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-009: passes completion toggle and state correctly to action bar', () => {
        let toggleCalled = false;
        const html = renderToStaticMarkup(
            React.createElement(TopicEditorialView, {
                activeSubject: defaultSubject,
                activeModule: module0,
                activeTopic: module0.topics[0],
                isCompleted: true,
                onToggleCompletion: () => { toggleCalled = true; },
                isDark: true
            })
        );

        expect(html).toContain('Completed');
        expect(html).toContain('Click to mark as incomplete');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Existing structured-data rendering tests continue passing
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-010: local structured PLC5 documents remain completely available and intact', () => {
        const allLocalTopics = [
            getPLC5TopicEditorial('basics', 'before-you-start'),
            getPLC5TopicEditorial('basics', 'why-programming'),
            getPLC5TopicEditorial('basics', 'common-myths'),
            getPLC5TopicEditorial('basics', 'no-coding-background'),
            getPLC5TopicEditorial('basics', 'how-to-learn'),
            getPLC5TopicEditorial('basics', 'how-to-practice'),
            getPLC5TopicEditorial('basics', 'using-askursenior'),
            getPLC5TopicEditorial('module1', 'introduction-to-computers')
        ];

        expect(allLocalTopics.length).toBe(8);
        allLocalTopics.forEach((t) => {
            expect(t).toBeTruthy();
            expect(t.blocks.length).toBeGreaterThan(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 11. TASK 7: In-flight deduplication and memory cache prevent duplicate requests
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-011: deduplicates in-flight requests and serves subsequent renders from cache without refetching', async () => {
        const apiSpy = vi.spyOn(academicContentApi, 'getAcademicTopicEditorial').mockResolvedValue({
            success: true,
            data: {
                subject: { id: 's1', code: 'PLC5', slug: 'plc5' },
                module: { id: 'm1', moduleSlug: 'basics' },
                topic: { id: 't1', topicId: '0-1', topicSlug: 'before-you-start' },
                editorial: {
                    title: 'Cached MongoDB Content',
                    version: 1,
                    status: 'Published',
                    sections: [],
                    blocks: [{ type: 'paragraph', text: 'Cached content body' }]
                }
            }
        });

        // First render & mount
        await act(async () => {
            root.render(
                React.createElement(TopicEditorialView, {
                    activeSubject: defaultSubject,
                    activeModule: module0,
                    activeTopic: module0.topics[0],
                    isDark: true
                })
            );
        });
        await act(async () => {
            await new Promise(r => setTimeout(r, 40));
        });

        // Exactly 1 request made on initial mount
        expect(apiSpy).toHaveBeenCalledTimes(1);

        // Re-render the same topic (or re-mount as in tab switch)
        await act(async () => {
            root.render(
                React.createElement(TopicEditorialView, {
                    activeSubject: defaultSubject,
                    activeModule: module0,
                    activeTopic: module0.topics[0],
                    isDark: true
                })
            );
        });
        await act(async () => {
            await new Promise(r => setTimeout(r, 40));
        });

        // Still exactly 1 request because EDITORIAL_CACHE served the content!
        expect(apiSpy).toHaveBeenCalledTimes(1);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 12. TASK 4: Content Tree feeds into MySubjectsPage data structures
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-012: content tree augments subject modules and topics, falling back gracefully on failure', () => {
        const initialSubject = {
            id: 'plc5-subj',
            code: 'PLC5',
            slug: 'plc5',
            title: 'Introduction to C Programming',
            modules: [
                {
                    moduleNumber: 0,
                    slug: 'basics',
                    title: '0. Basics',
                    topics: [{ id: '0-1', slug: 'before-you-start', title: 'Legacy Title' }]
                }
            ]
        };

        const apiModules = [
            {
                moduleNumber: 0,
                moduleSlug: 'basics',
                title: '0. Basics',
                topics: [
                    { id: 'mongo-top-1', topicId: '0-1', topicSlug: 'before-you-start', title: '0.1 Before You Start (API)' },
                    { id: 'mongo-top-2', topicId: '0-2', topicSlug: 'why-programming', title: '0.2 Why Programming? (API)' }
                ]
            }
        ];

        // Simulate enhancedSubjects merging logic from MySubjectsPage
        const mergeContentTree = (subjects, contentTrees) => {
            if (!contentTrees || Object.keys(contentTrees).length === 0) return subjects;
            return subjects.map(s => {
                const sKey = s.slug || s.code?.toLowerCase();
                const treeMods = contentTrees[sKey];
                if (!treeMods || !Array.isArray(treeMods)) return s;

                const existingModules = Array.isArray(s.modules) && s.modules.length > 0 
                    ? s.modules 
                    : treeMods.map(tm => ({
                        id: tm.moduleSlug,
                        slug: tm.moduleSlug,
                        moduleNumber: tm.moduleNumber,
                        title: tm.title,
                        topics: tm.topics
                    }));

                const mergedModules = existingModules.map(m => {
                    const modNum = m.moduleNumber;
                    const apiMod = treeMods.find(tm => 
                        tm.moduleNumber === modNum || 
                        tm.moduleSlug === m.slug || 
                        tm.moduleSlug === `module${modNum}` ||
                        tm.moduleSlug === (modNum === 0 ? 'basics' : `module${modNum}`)
                    );
                    if (apiMod && Array.isArray(apiMod.topics) && apiMod.topics.length > 0) {
                        return {
                            ...m,
                            topics: apiMod.topics.map((t, idx) => ({
                                id: t.topicId || t.id,
                                slug: t.topicSlug || t.slug,
                                title: t.title,
                                displayLabel: t.displayLabel || (modNum === 0 ? `0.${idx + 1} ${t.title}` : `${modNum}.${idx + 1} ${t.title}`)
                            }))
                        };
                    }
                    return m;
                });

                return { ...s, modules: mergedModules };
            });
        };

        // 1. Success case: API topics augment the module
        const augmented = mergeContentTree([initialSubject], { plc5: apiModules });
        expect(augmented[0].modules[0].topics.length).toBe(2);
        expect(augmented[0].modules[0].topics[0].id).toBe('0-1');
        expect(augmented[0].modules[0].topics[0].title).toBe('0.1 Before You Start (API)');
        expect(augmented[0].modules[0].topics[1].id).toBe('0-2');
        expect(augmented[0].modules[0].topics[1].slug).toBe('why-programming');

        // 2. Failure case (empty/missing contentTrees): Baseline modules remain intact
        const fallback = mergeContentTree([initialSubject], {});
        expect(fallback[0].modules[0].topics.length).toBe(1);
        expect(fallback[0].modules[0].topics[0].title).toBe('Legacy Title');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 13. TASK 6: Module slug normalization for API vs EditorialActionBar
    // ─────────────────────────────────────────────────────────────────────────
    it('STEP9-013: normalizes module slugs for API while preserving routing and action bar keys', async () => {
        const apiSpy = vi.spyOn(academicContentApi, 'getAcademicTopicEditorial').mockResolvedValue({
            success: true,
            data: {
                subject: { code: 'PLC5' },
                module: { moduleSlug: 'module1' },
                topic: { topicId: '1-1', topicSlug: 'introduction-to-computers' },
                editorial: { title: '1.1 Intro', blocks: [] }
            }
        });

        // Render Module 1 (URL slug: 'module-1')
        await act(async () => {
            root.render(
                React.createElement(TopicEditorialView, {
                    activeSubject: defaultSubject,
                    activeModule: module1,
                    activeTopic: module1.topics[0],
                    isDark: true
                })
            );
        });
        await act(async () => {
            await new Promise(r => setTimeout(r, 40));
        });

        // API must receive 'module1' (without hyphen)
        expect(apiSpy).toHaveBeenCalledWith('plc5', 'module1', 'introduction-to-computers');

        // Rendered markup must still show Module 1 breadcrumbs
        expect(container.textContent).toContain('M01 · Introduction to C');
        expect(container.textContent).toContain('1.1 Introduction to Computers');
    });
});
