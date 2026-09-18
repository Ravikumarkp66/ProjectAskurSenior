const mongoose = require('mongoose');
const studentSubjectResolver = require('./studentSubjectResolver');
const AcademicSubjectCms = require('../models/AcademicSubject');
const CourseModule = require('../models/CourseModule');
const Topic = require('../models/Topic');
const EditorialContent = require('../models/EditorialContent');

// Reference to active resolver instance, defaulting to authoritative studentSubjectResolver
let currentSubjectResolver = studentSubjectResolver;

/**
 * Allows injecting a mock resolver for deterministic unit testing.
 * @param {Object} resolver - Object implementing resolveStudentSubjects(student, requestedSemester)
 */
function setSubjectResolver(resolver) {
    if (!resolver || typeof resolver.resolveStudentSubjects !== 'function') {
        throw new Error('Resolver must implement resolveStudentSubjects(student, requestedSemester)');
    }
    currentSubjectResolver = resolver;
}

/**
 * Resets the resolver back to the production studentSubjectResolver.
 */
function resetSubjectResolver() {
    currentSubjectResolver = studentSubjectResolver;
}

/**
 * Authoritatively verifies if a student is allocated a given subject,
 * resolving the canonical AcademicSubjectCms document and metadata.
 * 
 * Invariant: Never trusts client-supplied subjectSlug alone; checks against
 * student's active SectionTimetable allocation via resolveStudentSubjects.
 * 
 * @param {Object} student - Authenticated student account document
 * @param {string} subjectIdentifier - Subject slug, code, branchCode, or ObjectId
 * @param {number|null} requestedSemester - Optional semester override
 * @returns {Promise<{ authorized: boolean, subjectId?: string, subjectMeta?: Object, reason?: string }>}
 */
async function resolveAuthorizedSubject(student, subjectIdentifier, requestedSemester = null) {
    if (!student) {
        return { authorized: false, reason: 'STUDENT_REQUIRED' };
    }

    if (!subjectIdentifier || typeof subjectIdentifier !== 'string') {
        return { authorized: false, reason: 'IDENTIFIER_REQUIRED' };
    }

    const cleanIdentifier = subjectIdentifier.trim().toLowerCase();

    // 1. Authoritatively resolve student's allocated subjects from active timetable projection
    const resolvedContext = await currentSubjectResolver.resolveStudentSubjects(student, requestedSemester);
    const allocatedSubjects = resolvedContext?.subjects || [];

    // 2. Locate requested subject exclusively within the student's allocated subjects list
    const matched = allocatedSubjects.find(s => {
        const slugMatch = s.slug && s.slug.toLowerCase() === cleanIdentifier;
        const codeMatch = s.code && s.code.toLowerCase() === cleanIdentifier;
        const branchCodeMatch = s.branchCode && s.branchCode.toLowerCase() === cleanIdentifier;
        const idMatch = s._id && s._id.toString().toLowerCase() === cleanIdentifier;
        const legacyIdMatch = s.id && s.id.toString().toLowerCase() === cleanIdentifier;
        return slugMatch || codeMatch || branchCodeMatch || idMatch || legacyIdMatch;
    });

    if (!matched) {
        return { authorized: false, reason: 'NOT_ALLOCATED' };
    }

    // 3. Obtain authoritative AcademicSubjectCms document for canonical DB reference
    let authoritativeCms = null;
    if (mongoose.connection.readyState === 1) {
        try {
            authoritativeCms = await AcademicSubjectCms.findById(matched._id).lean();
        } catch (err) {
            // Fallback to matched metadata if findById fails
        }
    }

    const subjectId = (authoritativeCms?._id || matched._id).toString();
    const subjectMeta = {
        id: subjectId,
        code: authoritativeCms?.code || matched.code || 'UNKNOWN',
        name: authoritativeCms?.name || matched.name || 'Untitled Subject',
        slug: authoritativeCms?.slug || matched.slug || cleanIdentifier
    };

    return {
        authorized: true,
        subjectId,
        subjectMeta
    };
}

/**
 * Retrieves the full curriculum content tree for an academic subject.
 * Returns sorted modules and published topics without heavy content blocks.
 * 
 * @param {string|mongoose.Types.ObjectId} academicSubjectId - Authoritative AcademicSubjectCms ObjectId
 * @param {Object} subjectMeta - Subject metadata (id, code, name, slug)
 * @returns {Promise<Object>} Formatted subject content tree
 */
async function getSubjectContentTree(academicSubjectId, subjectMeta = {}) {
    if (!academicSubjectId) {
        throw new Error('academicSubjectId is required to fetch content tree');
    }

    const subjectIdObj = typeof academicSubjectId === 'string'
        ? new mongoose.Types.ObjectId(academicSubjectId)
        : academicSubjectId;

    // 1. Fetch modules sorted by display order
    const modules = await CourseModule.find({ academicSubjectId: subjectIdObj })
        .sort({ order: 1 })
        .lean();

    // 2. Fetch published topics sorted by display order (excluding blocks/sections)
    const topics = await Topic.find({
        academicSubjectId: subjectIdObj,
        status: 'Published'
    })
        .sort({ order: 1 })
        .select('academicSubjectId moduleId topicSlug topicId title displayLabel order status estimatedMinutes readingTimeMinutes')
        .lean();

    // 3. Group topics under parent modules
    const topicsByModule = new Map();
    for (const topic of topics) {
        const mId = topic.moduleId.toString();
        if (!topicsByModule.has(mId)) {
            topicsByModule.set(mId, []);
        }
        topicsByModule.get(mId).push({
            id: topic._id.toString(),
            topicId: topic.topicId,
            title: topic.title,
            topicSlug: topic.topicSlug,
            displayLabel: topic.displayLabel || '',
            order: topic.order,
            status: topic.status,
            estimatedMinutes: topic.estimatedMinutes || topic.readingTimeMinutes || 10
        });
    }

    // 4. Assemble hierarchical tree (clean, student-safe fields only)
    const formattedModules = modules.map(mod => ({
        id: mod._id.toString(),
        moduleId: mod.moduleSlug,
        moduleSlug: mod.moduleSlug,
        moduleNumber: mod.moduleNumber,
        name: mod.title,
        title: mod.title,
        description: mod.description || '',
        order: mod.order,
        topics: topicsByModule.get(mod._id.toString()) || []
    }));

    return {
        subject: {
            id: subjectMeta.id || subjectIdObj.toString(),
            code: subjectMeta.code || '',
            name: subjectMeta.name || '',
            slug: subjectMeta.slug || ''
        },
        modules: formattedModules
    };
}

/**
 * Retrieves the full editorial content sheet for a specific topic.
 * Verifies module existence, topic publication status, relational invariants,
 * and editorial publication status.
 * 
 * @param {string|mongoose.Types.ObjectId} academicSubjectId - Authoritative AcademicSubjectCms ObjectId
 * @param {string} moduleSlug - Module identifier slug
 * @param {string} topicSlug - Topic identifier slug
 * @param {Object} subjectMeta - Canonical subject metadata
 * @returns {Promise<Object>} Formatted topic editorial response or error descriptor
 */
async function getTopicEditorialContent(academicSubjectId, moduleSlug, topicSlug, subjectMeta = {}) {
    if (!academicSubjectId || !moduleSlug || !topicSlug) {
        throw new Error('academicSubjectId, moduleSlug, and topicSlug are required');
    }

    const subjectIdObj = typeof academicSubjectId === 'string'
        ? new mongoose.Types.ObjectId(academicSubjectId)
        : academicSubjectId;

    const cleanModuleSlug = moduleSlug.trim().toLowerCase();
    const cleanTopicSlug = topicSlug.trim().toLowerCase();

    // 1. Locate CourseModule constrained by: academicSubjectId + moduleSlug
    const moduleDoc = await CourseModule.findOne({
        academicSubjectId: subjectIdObj,
        moduleSlug: cleanModuleSlug
    }).lean();

    if (!moduleDoc) {
        return {
            error: 'MODULE_NOT_FOUND',
            message: `Module '${moduleSlug}' not found for this subject`
        };
    }

    // 2. Locate Topic constrained by: moduleId + topicSlug + status: 'Published'
    const topicDoc = await Topic.findOne({
        moduleId: moduleDoc._id,
        topicSlug: cleanTopicSlug,
        status: 'Published'
    }).lean();

    if (!topicDoc) {
        return {
            error: 'TOPIC_NOT_FOUND',
            message: `Topic '${topicSlug}' not found or not published`
        };
    }

    // 3. Strict Relational Integrity Invariants: Topic.academicSubjectId must match CourseModule.academicSubjectId
    if (topicDoc.academicSubjectId.toString() !== subjectIdObj.toString()) {
        throw new Error(`Data integrity violation: Topic academicSubjectId (${topicDoc.academicSubjectId}) does not match subject (${subjectIdObj})`);
    }
    if (topicDoc.academicSubjectId.toString() !== moduleDoc.academicSubjectId.toString()) {
        throw new Error(`Data integrity violation: Topic academicSubjectId (${topicDoc.academicSubjectId}) does not match CourseModule academicSubjectId (${moduleDoc.academicSubjectId})`);
    }

    // 4. Locate EditorialContent constrained by: topicId (Topic._id) + status: 'Published'
    const editorialDoc = await EditorialContent.findOne({
        topicId: topicDoc._id,
        status: 'Published'
    }).lean();

    if (!editorialDoc) {
        return {
            error: 'EDITORIAL_NOT_FOUND',
            message: `Editorial content not found or not published for topic '${topicSlug}'`
        };
    }

    // 5. Clean, student-safe response projection (no Mongo internals or secrets)
    return {
        subject: {
            id: subjectMeta.id || subjectIdObj.toString(),
            code: subjectMeta.code || '',
            name: subjectMeta.name || '',
            slug: subjectMeta.slug || ''
        },
        module: {
            id: moduleDoc._id.toString(),
            moduleId: moduleDoc.moduleSlug,
            moduleSlug: moduleDoc.moduleSlug,
            moduleNumber: moduleDoc.moduleNumber,
            name: moduleDoc.title,
            title: moduleDoc.title
        },
        topic: {
            id: topicDoc._id.toString(),
            topicId: topicDoc.topicId,
            title: topicDoc.title,
            topicSlug: topicDoc.topicSlug,
            order: topicDoc.order,
            status: topicDoc.status
        },
        editorial: {
            title: editorialDoc.title,
            version: editorialDoc.version || 1,
            status: editorialDoc.status,
            sections: (editorialDoc.sections || []).map(s => ({ id: s.id, title: s.title })),
            blocks: editorialDoc.blocks || [],
            publishedAt: editorialDoc.publishedAt || editorialDoc.createdAt
        }
    };
}

module.exports = {
    resolveAuthorizedSubject,
    getSubjectContentTree,
    getTopicEditorialContent,
    setSubjectResolver,
    resetSubjectResolver
};
