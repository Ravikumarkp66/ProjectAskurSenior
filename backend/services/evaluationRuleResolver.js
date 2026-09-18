const mongoose = require('mongoose');
const AcademicEvaluationRule = require('../models/AcademicEvaluationRule');
const AcademicEvaluationGroup = require('../models/AcademicEvaluationGroup');
const AcademicSubject = require('../models/AcademicSubject');

class RuleNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RuleNotFoundError';
        this.statusCode = 404;
    }
}

class DuplicateActiveRuleError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DuplicateActiveRuleError';
        this.statusCode = 409;
    }
}

class EvaluationGroupNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'EvaluationGroupNotFoundError';
        this.statusCode = 404;
    }
}

class EvaluationSubjectNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'EvaluationSubjectNotFoundError';
        this.statusCode = 404;
    }
}

// High-performance in-memory TTL cache for resolved active evaluation rules
const RULE_RESOLVER_CACHE = new Map();
const RULE_CACHE_TTL_MS = 60 * 1000; // 60 seconds

function clearRuleResolverCache() {
    RULE_RESOLVER_CACHE.clear();
}

/**
 * Resolves exactly one ACTIVE AcademicEvaluationRule for a given subject or evaluation group.
 *
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} [options.schemeId]
 * @param {string|mongoose.Types.ObjectId} [options.subjectId]
 * @param {string} [options.subjectCode]
 * @param {string|mongoose.Types.ObjectId} [options.groupId]
 * @param {Object} [options.subject] Pre-resolved subject document to skip AcademicSubject query
 * @returns {Promise<{ rule: Object, group: Object, subject: Object|null }>}
 */
async function resolveActiveEvaluationRule(options = {}) {
    const { schemeId, subjectId, subjectCode, groupId, subject: preResolvedSubject } = options;

    const cacheSubjectKey = preResolvedSubject?._id || subjectId || subjectCode || '';
    const cacheKey = `${schemeId || ''}_${cacheSubjectKey}_${groupId || ''}`;
    const cachedEntry = RULE_RESOLVER_CACHE.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < RULE_CACHE_TTL_MS)) {
        return cachedEntry.data;
    }

    let resolvedGroupId = groupId;
    let resolvedSchemeId = schemeId;
    let resolvedSubject = null;
    let resolvedGroup = null;

    // 1. If subject is specified, find subject and its containing evaluation group
    if (preResolvedSubject && preResolvedSubject._id) {
        resolvedSubject = preResolvedSubject;
        resolvedSchemeId = resolvedSubject.scheme || schemeId;

        // Find the evaluation group that contains this subject
        resolvedGroup = await AcademicEvaluationGroup.findOne({
            scheme: resolvedSchemeId,
            subjects: resolvedSubject._id,
            status: { $ne: 'Inactive' }
        }).lean();

        if (!resolvedGroup) {
            throw new EvaluationGroupNotFoundError(
                `No active evaluation group contains subject "${resolvedSubject.code}" (${resolvedSubject.name}) in scheme ${resolvedSchemeId}`
            );
        }

        resolvedGroupId = resolvedGroup._id;
    } else if (subjectId || subjectCode) {
        const query = {};
        if (subjectId) {
            query._id = subjectId;
        } else if (subjectCode) {
            query.code = subjectCode.trim().toUpperCase();
        }
        if (schemeId) {
            query.scheme = schemeId;
        }

        resolvedSubject = await AcademicSubject.findOne(query).lean();
        if (!resolvedSubject) {
            throw new EvaluationSubjectNotFoundError(
                `Academic subject not found for query: ${JSON.stringify(options)}`
            );
        }

        resolvedSchemeId = resolvedSubject.scheme;

        // Find the evaluation group that contains this subject
        resolvedGroup = await AcademicEvaluationGroup.findOne({
            scheme: resolvedSchemeId,
            subjects: resolvedSubject._id,
            status: { $ne: 'Inactive' }
        }).lean();

        if (!resolvedGroup) {
            throw new EvaluationGroupNotFoundError(
                `No active evaluation group contains subject "${resolvedSubject.code}" (${resolvedSubject.name}) in scheme ${resolvedSchemeId}`
            );
        }

        resolvedGroupId = resolvedGroup._id;
    } else if (groupId) {
        resolvedGroup = await AcademicEvaluationGroup.findById(groupId).lean();
        if (!resolvedGroup) {
            throw new EvaluationGroupNotFoundError(`Evaluation group not found with ID: ${groupId}`);
        }
        resolvedGroupId = resolvedGroup._id;
        resolvedSchemeId = resolvedSchemeId || resolvedGroup.scheme;
    } else {
        throw new Error('Either subjectId, subjectCode, or groupId must be provided to resolve an evaluation rule');
    }

    // 2. Query for ACTIVE evaluation rule for this group
    const ruleQuery = {
        evaluationGroup: resolvedGroupId,
        status: 'ACTIVE'
    };
    if (resolvedSchemeId) {
        ruleQuery.scheme = resolvedSchemeId;
    }

    const activeRules = await AcademicEvaluationRule.find(ruleQuery)
        .populate('scheme')
        .populate('evaluationGroup')
        .lean();

    if (!activeRules || activeRules.length === 0) {
        const groupName = resolvedGroup ? resolvedGroup.name : resolvedGroupId;
        throw new RuleNotFoundError(
            `No ACTIVE evaluation rule found for evaluation group "${groupName}" (ID: ${resolvedGroupId})`
        );
    }

    if (activeRules.length > 1) {
        const groupName = resolvedGroup ? resolvedGroup.name : resolvedGroupId;
        throw new DuplicateActiveRuleError(
            `Integrity violation: Multiple (${activeRules.length}) ACTIVE evaluation rules found for evaluation group "${groupName}" (ID: ${resolvedGroupId})`
        );
    }

    const result = {
        rule: activeRules[0],
        group: resolvedGroup,
        subject: resolvedSubject
    };
    RULE_RESOLVER_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
}

module.exports = {
    resolveActiveEvaluationRule,
    clearRuleResolverCache,
    RuleNotFoundError,
    DuplicateActiveRuleError,
    EvaluationGroupNotFoundError,
    EvaluationSubjectNotFoundError
};
