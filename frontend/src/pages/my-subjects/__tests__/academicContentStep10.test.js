// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import {
    normalizeModuleSlug,
    denormalizeModuleSlug,
    mapApiTopicToNavigation,
    mapApiTreeToNavigation,
    mergeSubjectWithContentTree
} from '../../../services/academicContentMapper';
import { CONTENT_TREE_CACHE } from '../MySubjectsPage';

describe('Step 10: MongoDB Academic Content Tree as Authoritative Navigation Source', () => {

    beforeEach(() => {
        if (CONTENT_TREE_CACHE) {
            CONTENT_TREE_CACHE.clear();
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 10-001: API tree normalizes into frontend navigation shape
    // ─────────────────────────────────────────────────────────────────────────
    it('TEST 10-001: API tree normalizes into frontend navigation shape with clean titles and displayLabels', () => {
        const apiData = {
            subject: {
                id: '68cb8b776263df4faacb3cb2',
                code: '22PLC55B',
                name: 'Introduction to C Programming',
                slug: 'introduction-to-c-programming'
            },
            modules: [
                {
                    _id: '68cb8b776263df4faacb3cb3',
                    moduleNumber: 0,
                    moduleSlug: 'basics',
                    title: '0. Basics',
                    order: 0,
                    topics: [
                        {
                            _id: '68cb8b776263df4faacb3cb5',
                            topicId: '0-1',
                            slug: 'before-you-start',
                            title: 'Before You Start',
                            order: 1
                        },
                        {
                            _id: '68cb8b776263df4faacb3cb6',
                            topicId: '0-2',
                            slug: 'why-programming',
                            title: 'Why Programming?',
                            order: 2
                        }
                    ]
                },
                {
                    _id: '68cb8b776263df4faacb3cb4',
                    moduleNumber: 1,
                    moduleSlug: 'module1',
                    title: 'Introduction to C',
                    order: 1,
                    topics: [
                        {
                            _id: '68cb8b776263df4faacb3cb7',
                            topicId: '1-1',
                            slug: 'introduction-to-computers',
                            title: 'Introduction to Computers',
                            order: 1
                        }
                    ]
                }
            ]
        };

        const normalized = mapApiTreeToNavigation(apiData);
        expect(normalized).toHaveLength(2);

        // Module 0
        expect(normalized[0].moduleNumber).toBe(0);
        expect(normalized[0].slug).toBe('basics');
        expect(normalized[0].id).toBe('basics');
        expect(normalized[0].title).toBe('0. Basics');
        expect(normalized[0].displayLabel).toBe('0. Basics');
        expect(normalized[0].topics).toHaveLength(2);
        expect(normalized[0].topics[0]).toEqual({
            id: '0-1',
            topicId: '0-1',
            mongoTopicId: '68cb8b776263df4faacb3cb5',
            slug: 'before-you-start',
            topicSlug: 'before-you-start',
            title: 'Before You Start',
            displayLabel: '0.1 Before You Start',
            order: 1,
            status: 'Published',
            estimatedMinutes: 10,
            hasEditorial: true,
            hasPyq: false,
            hasLab: false
        });

        // Module 1
        expect(normalized[1].moduleNumber).toBe(1);
        expect(normalized[1].slug).toBe('module-1');
        expect(normalized[1].id).toBe('module-1');
        expect(normalized[1].title).toBe('Introduction to C');
        expect(normalized[1].displayLabel).toBe('M01 · Introduction to C');
        expect(normalized[1].topics).toHaveLength(1);
        expect(normalized[1].topics[0].displayLabel).toBe('1.1 Introduction to Computers');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 10-002: API tree takes precedence over legacy navigation
    // ─────────────────────────────────────────────────────────────────────────
    it('TEST 10-002: API tree takes precedence over legacy navigation without topic duplication or mixing', () => {
        const legacySubject = {
            _id: 'subj-1',
            code: 'PLC5',
            name: 'Introduction to C Programming',
            slug: 'plc5',
            credits: 4,
            scheme: '2022',
            modules: [
                {
                    moduleNumber: 1,
                    slug: 'module-1',
                    title: 'Legacy Title',
                    topics: [
                        { id: 'legacy-1', slug: 'old-topic-1', title: 'Old Topic 1' },
                        { id: 'legacy-2', slug: 'old-topic-2', title: 'Old Topic 2' }
                    ]
                }
            ]
        };

        const apiModules = [
            {
                id: 'module-1',
                slug: 'module-1',
                moduleNumber: 1,
                title: 'Introduction to C',
                displayLabel: 'M01 · Introduction to C',
                topics: [
                    { id: '1-1', topicId: '1-1', slug: 'introduction-to-computers', title: 'Introduction to Computers', displayLabel: '1.1 Introduction to Computers' }
                ]
            }
        ];

        const merged = mergeSubjectWithContentTree(legacySubject, apiModules);

        expect(merged.contentSource).toBe('api');
        // Preserves academic metadata
        expect(merged.credits).toBe(4);
        expect(merged.scheme).toBe('2022');
        expect(merged.code).toBe('PLC5');

        // Navigation modules come strictly from API modules
        expect(merged.modules).toHaveLength(1);
        expect(merged.modules[0].title).toBe('Introduction to C');
        expect(merged.modules[0].topics).toHaveLength(1);
        expect(merged.modules[0].topics[0].id).toBe('1-1');
        expect(merged.modules[0].topics[0].slug).toBe('introduction-to-computers');
        // Old topics are not mixed in
        expect(merged.modules[0].topics.some(t => t.id === 'legacy-1')).toBe(false);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 10-003: When API tree fails/null, legacy navigation remains intact
    // ─────────────────────────────────────────────────────────────────────────
    it('TEST 10-003: When API tree fails or is null, legacy navigation remains intact with contentSource legacy', () => {
        const legacySubject = {
            _id: 'subj-1',
            code: 'PLC5',
            name: 'Introduction to C Programming',
            modules: [
                {
                    moduleNumber: 0,
                    slug: 'basics',
                    title: '0. Basics',
                    topics: [{ id: '0-1', slug: 'before-you-start', title: 'Before You Start' }]
                },
                {
                    moduleNumber: 1,
                    slug: 'module-1',
                    title: 'Module 01',
                    topics: [{ id: '1-1', slug: 'intro', title: 'Intro' }]
                }
            ]
        };

        // When apiModules is null
        const mergedNull = mergeSubjectWithContentTree(legacySubject, null);
        expect(mergedNull.contentSource).toBe('legacy');
        expect(mergedNull.modules).toHaveLength(2);
        expect(mergedNull.modules[0].topics[0].id).toBe('0-1');

        // When mapApiTreeToNavigation receives null or invalid data
        const mappedNull = mapApiTreeToNavigation(null);
        expect(mappedNull).toBeNull();

        const mappedEmpty = mapApiTreeToNavigation({ modules: [] });
        expect(mappedEmpty).toBeNull();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 10-004: Stable topicId ('0-1', '1-1') preserved, Mongo _id not used
    // ─────────────────────────────────────────────────────────────────────────
    it('TEST 10-004: Stable topicId is preserved for progress tracking, Mongo _id not used as navigation id', () => {
        const rawApiTopic = {
            _id: '65f1234567890abcdef12345', // Mongo ObjectId
            topicId: '0-1',                   // Stable progress ID
            slug: 'before-you-start',
            title: 'Before You Start',
            order: 1
        };

        const mapped = mapApiTopicToNavigation(rawApiTopic, 0, 0);

        // id and topicId MUST be '0-1', NOT the 24-character Mongo _id
        expect(mapped.id).toBe('0-1');
        expect(mapped.topicId).toBe('0-1');
        expect(mapped.mongoTopicId).toBe('65f1234567890abcdef12345');
        expect(mapped.id).not.toBe('65f1234567890abcdef12345');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 10-005: Module slug normalization (module-1 <-> module1)
    // ─────────────────────────────────────────────────────────────────────────
    it('TEST 10-005: Module slug normalization handles module-1 and module1 correctly in both directions', () => {
        // API (module1) -> Route (module-1)
        expect(normalizeModuleSlug('module1', 1)).toBe('module-1');
        expect(normalizeModuleSlug('module2', 2)).toBe('module-2');
        expect(normalizeModuleSlug('basics', 0)).toBe('basics');
        expect(normalizeModuleSlug('module0', 0)).toBe('basics');
        expect(normalizeModuleSlug('', 1)).toBe('module-1');

        // Route (module-1) -> API (module1)
        expect(denormalizeModuleSlug('module-1')).toBe('module1');
        expect(denormalizeModuleSlug('module-2')).toBe('module2');
        expect(denormalizeModuleSlug('basics')).toBe('basics');
        expect(denormalizeModuleSlug('module1')).toBe('module1');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 10-006: Tree request is not repeatedly triggered (caching check)
    // ─────────────────────────────────────────────────────────────────────────
    it('TEST 10-006: CONTENT_TREE_CACHE stores tree response to prevent repeated fetch loops', () => {
        const cacheKey = 'introduction-to-c-programming';
        expect(CONTENT_TREE_CACHE.has(cacheKey)).toBe(false);

        const sampleTree = [
            { id: 'basics', slug: 'basics', moduleNumber: 0, topics: [] }
        ];

        CONTENT_TREE_CACHE.set(cacheKey, sampleTree);
        expect(CONTENT_TREE_CACHE.has(cacheKey)).toBe(true);
        expect(CONTENT_TREE_CACHE.get(cacheKey)).toEqual(sampleTree);

        // Subsequent lookup hits memory cache synchronously
        const cached = CONTENT_TREE_CACHE.get(cacheKey);
        expect(cached).toBe(sampleTree);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 10-007: Non-PLC5 subjects do not receive PLC5 fallback topics
    // ─────────────────────────────────────────────────────────────────────────
    it('TEST 10-007: Non-PLC5 subjects do not receive PLC5 fallback topics', () => {
        const mathSubject = {
            _id: 'math-1',
            code: '22MAT11',
            name: 'Engineering Mathematics I',
            slug: 'math-1',
            modules: [
                {
                    moduleNumber: 1,
                    slug: 'module-1',
                    title: 'Calculus',
                    topics: []
                }
            ]
        };

        // When merged with null API modules, legacy topics remain empty for non-PLC5
        const merged = mergeSubjectWithContentTree(mathSubject, null);
        expect(merged.contentSource).toBe('legacy');
        expect(merged.modules[0].topics).toEqual([]);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 10-008: Preserves ordering across multiple modules and topics
    // ─────────────────────────────────────────────────────────────────────────
    it('TEST 10-008: Preserves module and topic ordering according to order and moduleNumber fields', () => {
        const unorderedApiData = {
            subject: { code: 'PLC5', slug: 'plc5' },
            modules: [
                {
                    moduleNumber: 2,
                    moduleSlug: 'module2',
                    title: 'Module Two',
                    order: 2,
                    topics: [
                        { topicId: '2-2', slug: 'second-topic', title: 'Second Topic', order: 2 },
                        { topicId: '2-1', slug: 'first-topic', title: 'First Topic', order: 1 }
                    ]
                },
                {
                    moduleNumber: 0,
                    moduleSlug: 'basics',
                    title: 'Basics',
                    order: 0,
                    topics: [
                        { topicId: '0-1', slug: 'start', title: 'Start', order: 1 }
                    ]
                },
                {
                    moduleNumber: 1,
                    moduleSlug: 'module1',
                    title: 'Module One',
                    order: 1,
                    topics: [
                        { topicId: '1-1', slug: 'intro', title: 'Intro', order: 1 }
                    ]
                }
            ]
        };

        const normalized = mapApiTreeToNavigation(unorderedApiData);

        // Modules ordered: 0 (Basics), 1 (Module One), 2 (Module Two)
        expect(normalized.map(m => m.moduleNumber)).toEqual([0, 1, 2]);

        // Topics inside Module 2 ordered by order field: 2-1, 2-2
        const mod2Topics = normalized[2].topics;
        expect(mod2Topics.map(t => t.topicId)).toEqual(['2-1', '2-2']);
    });
});
