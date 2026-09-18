/**
 * academicContentMapper.js
 * 
 * Pure normalizer utility for converting MongoDB Academic Content API tree
 * payloads into the frontend navigation shape expected by MySubjectsPage and sidebars.
 * 
 * Responsibilities:
 * - Maps API CourseModule -> Frontend Module navigation shape
 * - Maps API Topic -> Frontend Topic navigation shape
 * - Preserves stable application topicId ("0-1", "1-1") for progress compatibility
 * - Normalizes module slugs (e.g. "module1" -> "module-1") for route compatibility
 * - Preserves ordering of modules and topics
 * - Pure functions: no side effects, easily testable
 */

/**
 * Normalizes an API module slug into frontend route-compatible format.
 * E.g. "basics" -> "basics", "module1" -> "module-1", "module01" -> "module-1".
 * 
 * @param {string} apiSlug - Raw moduleSlug from MongoDB CourseModule
 * @param {number} moduleNumber - Numerical module index
 * @returns {string} Route-compatible slug
 */
export const normalizeModuleSlug = (apiSlug, moduleNumber) => {
    if (!apiSlug && moduleNumber === 0) return 'basics';
    if (!apiSlug && moduleNumber !== undefined) return `module-${moduleNumber}`;
    
    const clean = String(apiSlug || '').trim().toLowerCase();
    if (clean === 'basics' || clean === 'module-0' || clean === 'module0' || moduleNumber === 0) {
        return 'basics';
    }

    if (/^module-\d+$/.test(clean)) {
        return clean;
    }

    const match = clean.match(/^module(\d+)$/);
    if (match) {
        const num = parseInt(match[1], 10);
        return `module-${num}`;
    }

    if (moduleNumber !== undefined && moduleNumber !== null) {
        return `module-${moduleNumber}`;
    }

    return clean;
};

/**
 * Converts a frontend route slug back into the API module slug format.
 * E.g. "module-1" -> "module1", "basics" -> "basics".
 * 
 * @param {string} routeSlug - Frontend route slug
 * @returns {string} API-compatible moduleSlug
 */
export const denormalizeModuleSlug = (routeSlug) => {
    if (!routeSlug) return 'basics';
    const clean = String(routeSlug).trim().toLowerCase();
    if (clean === 'basics') return 'basics';
    if (clean === 'module-1') return 'module1';
    return clean.replace('-', '');
};

/**
 * Maps a single API topic item into the frontend navigation topic shape.
 * Strict invariant: id and topicId must expose the stable application identifier (e.g. "0-1"),
 * NEVER the MongoDB ObjectId.
 * 
 * @param {Object} apiTopic - Topic object from API tree
 * @param {number} modNum - Parent module number
 * @param {number} idx - Zero-based index of topic in module
 * @returns {Object} Normalized frontend topic item
 */
export const mapApiTopicToNavigation = (apiTopic, modNum, idx) => {
    if (!apiTopic) return null;

    const tSlug = apiTopic.topicSlug || apiTopic.slug || `topic-${idx + 1}`;
    const tTitle = apiTopic.title || apiTopic.name || `Topic ${idx + 1}`;
    const stableTopicId = apiTopic.topicId || apiTopic.id || tSlug;
    const isBasics = modNum === 0;
    const cleanTitle = tTitle.replace(/^\d+\.\d+\s+/, '');
    const defaultDisplay = isBasics ? `0.${idx + 1} ${cleanTitle}` : `${modNum}.${idx + 1} ${cleanTitle}`;

    return {
        id: stableTopicId,
        topicId: stableTopicId,
        mongoTopicId: apiTopic._id || (apiTopic.id && apiTopic.id.length === 24 ? apiTopic.id : undefined),
        slug: tSlug,
        topicSlug: tSlug,
        title: tTitle,
        displayLabel: apiTopic.displayLabel || defaultDisplay,
        order: apiTopic.order !== undefined ? apiTopic.order : idx + 1,
        status: apiTopic.status || 'Published',
        estimatedMinutes: apiTopic.estimatedMinutes || 10,
        hasEditorial: apiTopic.hasEditorial !== undefined ? apiTopic.hasEditorial : true,
        hasPyq: !!apiTopic.hasPyq,
        hasLab: !!apiTopic.hasLab
    };
};

/**
 * Normalizes an API content tree payload into the frontend module/topic hierarchy.
 * Returns null if the tree is invalid or has no modules.
 * 
 * @param {Object|Array} apiData - Content tree response from /api/v2/academic-content/:subjectSlug
 * @returns {Array|null} Array of normalized module objects, or null if invalid
 */
export const mapApiTreeToNavigation = (apiData) => {
    if (!apiData) return null;

    const rawModules = Array.isArray(apiData) 
        ? apiData 
        : (Array.isArray(apiData?.modules) ? apiData.modules : null);

    if (!rawModules || rawModules.length === 0) {
        return null;
    }

    const sortedModules = [...rawModules].sort((a, b) => (a.order || 0) - (b.order || 0));

    return sortedModules.map((mod, idx) => {
        const modNum = (mod.moduleNumber !== undefined && mod.moduleNumber !== null)
            ? mod.moduleNumber
            : idx;
        const numPadded = String(modNum).padStart(2, '0');
        const routeSlug = normalizeModuleSlug(mod.moduleSlug || mod.slug, modNum);
        const isBasics = modNum === 0 || routeSlug === 'basics';
        const rawTitle = mod.title || mod.name || '';
        const isGeneric = !rawTitle || 
            rawTitle.toLowerCase().trim() === `module ${modNum}` || 
            rawTitle.toLowerCase().trim() === `module ${numPadded}`;
        
        const cleanTitle = isBasics ? '0. Basics' : (isGeneric ? `Module ${numPadded}` : rawTitle);
        const displayLabel = isBasics ? '0. Basics' : (isGeneric ? `Module ${numPadded}` : `M${numPadded} · ${rawTitle}`);

        const rawTopics = Array.isArray(mod.topics) ? mod.topics : [];
        const sortedTopics = [...rawTopics].sort((a, b) => (a.order || 0) - (b.order || 0));
        const normalizedTopics = sortedTopics
            .map((t, tIdx) => mapApiTopicToNavigation(t, modNum, tIdx))
            .filter(Boolean);

        return {
            id: routeSlug,
            slug: routeSlug,
            moduleSlug: mod.moduleSlug || routeSlug,
            moduleNumber: modNum,
            title: cleanTitle,
            displayLabel: displayLabel,
            description: mod.description || '',
            order: mod.order !== undefined ? mod.order : idx + 1,
            topics: normalizedTopics
        };
    });
};

/**
 * Merges authoritative API content tree into a subject object while strictly preserving
 * all academic allocation metadata (code, name, credits, faculty, scheme, semester, etc.).
 * 
 * If normalizedApiModules is provided and valid, it BECOMES the primary modules hierarchy.
 * Otherwise, subject.modules is left untouched as the fallback.
 * 
 * @param {Object} subject - Academic subject from allocation
 * @param {Array|null} normalizedApiModules - Normalized modules from mapApiTreeToNavigation
 * @returns {Object} Augmented subject object
 */
export const mergeSubjectWithContentTree = (subject, normalizedApiModules) => {
    if (!subject) return null;

    if (Array.isArray(normalizedApiModules) && normalizedApiModules.length > 0) {
        return {
            ...subject,
            modules: normalizedApiModules,
            contentSource: 'api'
        };
    }

    return {
        ...subject,
        contentSource: 'legacy'
    };
};
