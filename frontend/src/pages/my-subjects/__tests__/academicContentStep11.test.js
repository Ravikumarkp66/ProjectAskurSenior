// @vitest-environment happy-dom
/**
 * STEP 11 — Remove Duplicated PLC5 Navigation Definitions
 *
 * Tests verify:
 * - BASICS_DEFAULT_TOPICS and PLC5_MODULE1_TOPICS are no longer exported from MySubjectsPage
 * - academicContentMapper still produces correct navigation from API data
 * - Non-PLC5 subjects do not inherit PLC5 topic ids
 * - PLC5 editorial fallback files are still accessible (data/editorial/plc5/)
 * - CONTENT_TREE_CACHE remains intact
 * - Step 11 Fix Regressions:
 *   - TEST 11-FIX-001: Legacy subject/module/topic tree remains completely usable when API is unavailable
 *   - TEST 11-FIX-002: API-backed subjects use API tree and do not receive duplicate PLC5 topics
 *   - TEST 11-FIX-003: Non-PLC5 legacy subject does not receive PLC5 topics
 *   - TEST 11-FIX-004: Editorial fallback works for PLC5 when API fails, but never resolves PLC5 content for non-PLC5 subjects
 */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mapApiTreeToNavigation, mergeSubjectWithContentTree } from '../../../services/academicContentMapper';
import TopicEditorialView, { clearEditorialCache } from '../components/TopicEditorialView';
import * as academicContentApi from '../../../services/academicContentApi';

// ── TEST 11-001: BASICS_DEFAULT_TOPICS removed ────────────────────────────────
describe('TEST 11-001: BASICS_DEFAULT_TOPICS removed from primary navigation', () => {
    it('BASICS_DEFAULT_TOPICS is not exported from MySubjectsPage', async () => {
        const mod = await import('../MySubjectsPage');
        expect(mod.BASICS_DEFAULT_TOPICS).toBeUndefined();
    });
});

// ── TEST 11-002: PLC5_MODULE1_TOPICS removed ──────────────────────────────────
describe('TEST 11-002: PLC5_MODULE1_TOPICS removed from primary navigation', () => {
    it('PLC5_MODULE1_TOPICS is not exported from MySubjectsPage', async () => {
        const mod = await import('../MySubjectsPage');
        expect(mod.PLC5_MODULE1_TOPICS).toBeUndefined();
    });
});

// ── TEST 11-003: CONTENT_TREE_CACHE still exported ────────────────────────────
describe('TEST 11-003: CONTENT_TREE_CACHE remains exported from MySubjectsPage', () => {
    it('CONTENT_TREE_CACHE is a Map', async () => {
        const mod = await import('../MySubjectsPage');
        expect(mod.CONTENT_TREE_CACHE).toBeInstanceOf(Map);
    });
});

// ── TEST 11-004: mapApiTreeToNavigation produces canonical navigation ──────────
describe('TEST 11-004: mapApiTreeToNavigation produces complete navigation tree', () => {
    const apiResponse = {
        modules: [
            {
                _id: 'mod-0', slug: 'basics', title: '0. Basics', moduleNumber: 0, order: 0,
                topics: [
                    { _id: 't-0-1', topicId: '0-1', slug: 'before-you-start', title: 'Before You Start', order: 1 },
                    { _id: 't-0-2', topicId: '0-2', slug: 'why-programming', title: 'Why Programming?', order: 2 },
                ]
            },
            {
                _id: 'mod-1', slug: 'module1', title: 'Introduction to C', moduleNumber: 1, order: 1,
                topics: [
                    { _id: 't-1-1', topicId: '1-1', slug: 'introduction-to-computers', title: 'Introduction to Computers', order: 1 },
                ]
            }
        ]
    };

    it('maps 2 modules with correct topic counts', () => {
        const nav = mapApiTreeToNavigation(apiResponse);
        expect(nav).toHaveLength(2);
        expect(nav[0].topics).toHaveLength(2);
        expect(nav[1].topics).toHaveLength(1);
    });

    it('preserves topicId (progress key) — never uses MongoDB _id as topicId', () => {
        const nav = mapApiTreeToNavigation(apiResponse);
        const firstTopic = nav[0].topics[0];
        expect(firstTopic.id).toBe('0-1');
        expect(firstTopic.topicId).toBe('0-1');
        expect(firstTopic.mongoTopicId).toBe('t-0-1');
        expect(firstTopic.id).not.toBe('t-0-1');
    });

    it('normalizes module slugs: module1 -> module-1, basics stays basics', () => {
        const nav = mapApiTreeToNavigation(apiResponse);
        expect(nav[0].slug).toBe('basics');
        expect(nav[1].slug).toBe('module-1');
    });
});

// ── TEST 11-005: mergeSubjectWithContentTree sets contentSource ───────────────
describe('TEST 11-005: mergeSubjectWithContentTree correctly flags api vs legacy subjects', () => {
    it('sets contentSource api when apiModules are provided', () => {
        const subject = { _id: 's1', code: 'PLC5', name: 'Intro to C', slug: 'plc5' };
        const apiModules = [{
            id: 'basics', slug: 'basics', moduleNumber: 0, title: '0. Basics',
            topics: [{ id: '0-1', topicId: '0-1', slug: 'before-you-start', title: 'Before You Start' }]
        }];
        const result = mergeSubjectWithContentTree(subject, apiModules);
        expect(result.contentSource).toBe('api');
        expect(result.modules).toEqual(apiModules);
    });

    it('sets contentSource legacy when no apiModules are provided', () => {
        const subject = { _id: 's1', code: 'PLC5', name: 'Intro to C', slug: 'plc5' };
        const result = mergeSubjectWithContentTree(subject, []);
        expect(result.contentSource).toBe('legacy');
    });
});

// ── TEST 11-006: Non-PLC5 subject does not get PLC5 topic ids ────────────────
describe('TEST 11-006: Non-PLC5 subjects do not inherit PLC5 navigation', () => {
    it('A math subject with API tree gets its own topics, not PLC5 defaults', () => {
        const subject = { _id: 's2', code: 'MATH101', name: 'Mathematics', slug: 'math-101' };
        const apiModules = [{
            id: 'module-1', slug: 'module-1', moduleNumber: 1, title: 'Algebra',
            topics: [{ id: 'a-1', topicId: 'a-1', slug: 'sets', title: 'Sets' }]
        }];
        const result = mergeSubjectWithContentTree(subject, apiModules);
        expect(result.contentSource).toBe('api');
        const topicIds = result.modules[0].topics.map(t => t.topicId);
        expect(topicIds).not.toContain('0-1');
        expect(topicIds).not.toContain('1-1');
        expect(topicIds).toContain('a-1');
    });
});

// ── TEST 11-007: PLC5 editorial content fallback files preserved ───────────────
describe('TEST 11-007: PLC5 structured editorial content files are preserved', () => {
    it('getPLC5TopicEditorial resolves basics/before-you-start and has content blocks', async () => {
        const { getPLC5TopicEditorial } = await import('../../../data/editorial/plc5');
        const doc = getPLC5TopicEditorial('basics', 'before-you-start');
        expect(doc).not.toBeNull();
        expect(doc).toHaveProperty('topicSlug', 'before-you-start');
        expect(doc).toHaveProperty('blocks');
        expect(Array.isArray(doc.blocks)).toBe(true);
        expect(doc.blocks.length).toBeGreaterThan(0);
    });

    it('getPLC5TopicEditorial resolves module1/introduction-to-computers and has content blocks', async () => {
        const { getPLC5TopicEditorial } = await import('../../../data/editorial/plc5');
        const doc = getPLC5TopicEditorial('module1', 'introduction-to-computers');
        expect(doc).not.toBeNull();
        expect(doc).toHaveProperty('topicSlug', 'introduction-to-computers');
        expect(doc).toHaveProperty('blocks');
        expect(Array.isArray(doc.blocks)).toBe(true);
    });
});

// ── TEST 11-008: mapApiTreeToNavigation sorts modules by order ────────────────
describe('TEST 11-008: mapApiTreeToNavigation sorts modules by order', () => {
    it('sorts modules ascending by order field', () => {
        const apiResponse = {
            modules: [
                { _id: 'mod-1', slug: 'module1', title: 'Module 1', moduleNumber: 1, order: 1, topics: [] },
                { _id: 'mod-0', slug: 'basics', title: '0. Basics', moduleNumber: 0, order: 0, topics: [] },
            ]
        };
        const nav = mapApiTreeToNavigation(apiResponse);
        expect(nav[0].moduleNumber).toBe(0);
        expect(nav[1].moduleNumber).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 11 FIX REGRESSION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('TEST 11-FIX-001: Legacy subject/module/topic tree remains usable when API unavailable', () => {
    it('preserves existing subject modules and topics when API returns null or empty', () => {
        const validLegacySubject = {
            _id: 'subj-legacy-1',
            code: 'PHY101',
            name: 'Engineering Physics',
            slug: 'physics-101',
            modules: [
                {
                    moduleNumber: 1,
                    slug: 'module-1',
                    title: 'Quantum Mechanics',
                    topics: [
                        { id: 'phy-1', topicId: 'phy-1', slug: 'wave-particle-duality', title: 'Wave Particle Duality' },
                        { id: 'phy-2', topicId: 'phy-2', slug: 'schrodinger-equation', title: 'Schrodinger Equation' }
                    ]
                },
                {
                    moduleNumber: 2,
                    slug: 'module-2',
                    title: 'Lasers & Optics',
                    topics: [
                        { id: 'phy-3', topicId: 'phy-3', slug: 'laser-principles', title: 'Laser Principles' }
                    ]
                }
            ]
        };

        const merged = mergeSubjectWithContentTree(validLegacySubject, null);

        expect(merged.contentSource).toBe('legacy');
        expect(merged.modules).toHaveLength(2);

        const m1 = merged.modules[0];
        expect(m1.title).toBe('Quantum Mechanics');
        expect(m1.topics).toHaveLength(2);
        expect(m1.topics[0].slug).toBe('wave-particle-duality');
        expect(m1.topics[0].topicId).toBe('phy-1');

        const m2 = merged.modules[1];
        expect(m2.topics).toHaveLength(1);
        expect(m2.topics[0].slug).toBe('laser-principles');
    });
});

describe('TEST 11-FIX-002: API-backed subjects still use API tree and do not receive duplicate PLC5 topics', () => {
    it('uses only API modules and topics when API succeeds', () => {
        const subjectWithLegacy = {
            _id: 'subj-plc5',
            code: 'PLC5',
            name: 'Introduction to C Programming',
            slug: 'plc5',
            modules: [
                {
                    moduleNumber: 1,
                    title: 'Outdated Module',
                    topics: [{ id: 'old-1', slug: 'old-topic', title: 'Old Topic' }]
                }
            ]
        };

        const apiModules = [
            {
                id: 'basics',
                slug: 'basics',
                moduleNumber: 0,
                title: '0. Basics',
                topics: [
                    { id: '0-1', topicId: '0-1', slug: 'before-you-start', title: 'Before You Start' }
                ]
            },
            {
                id: 'module-1',
                slug: 'module-1',
                moduleNumber: 1,
                title: 'Introduction to C',
                topics: [
                    { id: '1-1', topicId: '1-1', slug: 'introduction-to-computers', title: 'Introduction to Computers' }
                ]
            }
        ];

        const merged = mergeSubjectWithContentTree(subjectWithLegacy, apiModules);

        expect(merged.contentSource).toBe('api');
        expect(merged.modules).toHaveLength(2);
        expect(merged.modules[0].topics).toHaveLength(1);
        expect(merged.modules[1].topics).toHaveLength(1);
        expect(merged.modules.flatMap(m => m.topics).map(t => t.id)).not.toContain('old-1');
    });
});

describe('TEST 11-FIX-003: A non-PLC5 legacy subject does not receive PLC5 topics', () => {
    it('legacy non-PLC5 subject only retains its own topics, zero PLC5 topics', () => {
        const mathSubject = {
            _id: 'math-legacy',
            code: 'MAT201',
            name: 'Linear Algebra',
            slug: 'linear-algebra',
            modules: [
                {
                    moduleNumber: 1,
                    slug: 'module-1',
                    title: 'Matrices',
                    topics: [
                        { id: 'mat-1', topicId: 'mat-1', slug: 'matrix-multiplication', title: 'Matrix Multiplication' }
                    ]
                }
            ]
        };

        const merged = mergeSubjectWithContentTree(mathSubject, null);

        expect(merged.contentSource).toBe('legacy');
        expect(merged.modules).toHaveLength(1);
        const allTopicIds = merged.modules[0].topics.map(t => t.topicId);
        expect(allTopicIds).toEqual(['mat-1']);
        expect(allTopicIds).not.toContain('0-1');
        expect(allTopicIds).not.toContain('1-1');
    });
});

describe('TEST 11-FIX-004: Editorial fallback works for PLC5 when API fails, but never resolves PLC5 content for non-PLC5 subjects', () => {
    let container = null;
    let root = null;

    beforeEach(() => {
        clearEditorialCache();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        if (root) {
            act(() => {
                root.unmount();
            });
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        container = null;
        root = null;
        vi.restoreAllMocks();
    });

    it('renders PLC5 structured fallback when editorial API fails for a PLC5 subject', async () => {
        vi.spyOn(academicContentApi, 'getAcademicTopicEditorial')
            .mockRejectedValue(new Error('Network error'));

        const plc5Subject = { code: '22PLC55B', slug: 'plc5', name: 'Introduction to C Programming' };
        const activeMod = { moduleNumber: 0, slug: 'basics', displayLabel: '0. Basics' };
        const activeTop = { id: '0-1', slug: 'before-you-start', title: 'Before You Start' };

        await act(async () => {
            root.render(
                React.createElement(TopicEditorialView, {
                    activeSubject: plc5Subject,
                    activeModule: activeMod,
                    activeTopic: activeTop,
                    isDark: true
                })
            );
        });

        // Local PLC5 fallback document renders its sections/headings
        expect(container.innerHTML).toContain('Before You Start');
        expect(container.innerHTML).not.toContain('Editorial content for this topic is being prepared');
    });

    it('does NOT render PLC5 editorial content for a non-PLC5 subject when API fails', async () => {
        vi.spyOn(academicContentApi, 'getAcademicTopicEditorial')
            .mockRejectedValue(new Error('API 404 Not Found'));

        const mathSubject = { code: 'MAT101', slug: 'engineering-math', name: 'Engineering Mathematics' };
        const activeMod = { moduleNumber: 0, slug: 'basics', displayLabel: '0. Basics' };
        const activeTop = { id: '0-1', slug: 'before-you-start', title: 'Before You Start' };

        await act(async () => {
            root.render(
                React.createElement(TopicEditorialView, {
                    activeSubject: mathSubject,
                    activeModule: activeMod,
                    activeTopic: activeTop,
                    isDark: true
                })
            );
        });

        // Must render graceful "being prepared" state, NOT PLC5 content
        expect(container.innerHTML).toContain('Editorial content for this topic is being prepared');
    });
});
