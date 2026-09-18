const mongoose = require('mongoose');
const AcademicEvaluationRule = require('../models/AcademicEvaluationRule');
const AcademicEvaluationGroup = require('../models/AcademicEvaluationGroup');
const Scheme = require('../models/Scheme');

const VALID_COMPONENT_TYPES = ['ASSESSMENT', 'LAB_RECORD', 'LAB_TEST', 'PROJECT', 'PRACTICAL_EXAM', 'THEORY_EXAM', 'OTHER'];
const VALID_ENTRY_MODES = ['COUNTED', 'MANUAL'];
const VALID_AGGREGATION_METHODS = ['SUM', 'AVERAGE', 'BEST_N'];
const VALID_CONDITION_TYPES = ['CIE_MIN', 'SEE_MIN', 'AGGREGATE_MIN', 'COMPONENT_MIN', 'ATTENDANCE_MIN'];
const VALID_GRADE_TYPES = ['MARK_RANGE', 'PASS_FAIL'];

/**
 * Deep validation of evaluation rule configuration data
 */
async function validateRuleConfig(data, isNew = false) {
    const { scheme, evaluationGroup, name, cie, see, eligibility, gradeScale, contributesToSGPA } = data;

    // 1. Validate Scheme
    if (isNew || scheme !== undefined) {
        if (!scheme || !mongoose.Types.ObjectId.isValid(scheme)) {
            throw new Error('A valid Scheme ID is required');
        }
        const schemeDoc = await Scheme.findById(scheme);
        if (!schemeDoc) {
            throw new Error('Referenced Scheme does not exist');
        }
    }

    // 2. Validate Evaluation Group
    let groupDoc = null;
    if (isNew || evaluationGroup !== undefined) {
        if (!evaluationGroup || !mongoose.Types.ObjectId.isValid(evaluationGroup)) {
            throw new Error('A valid Evaluation Group ID is required');
        }
        groupDoc = await AcademicEvaluationGroup.findById(evaluationGroup);
        if (!groupDoc) {
            throw new Error('Referenced Evaluation Group does not exist');
        }

        // 3. Cross-scheme integrity check: Group MUST belong to the specified Scheme
        const targetSchemeId = scheme ? String(scheme) : String(groupDoc.scheme);
        if (String(groupDoc.scheme) !== targetSchemeId) {
            throw new Error('Cross-scheme violation: Evaluation Group does not belong to the selected Scheme');
        }
    }

    // 4. Validate Name
    if (isNew || name !== undefined) {
        if (!name || typeof name !== 'string' || !name.trim()) {
            throw new Error('Rule name is required');
        }
    }

    // Helper: validate components array
    const validateComponents = (components, sectionName) => {
        if (!Array.isArray(components)) return;
        const keySet = new Set();

        for (let i = 0; i < components.length; i++) {
            const comp = components[i];
            if (!comp.key || typeof comp.key !== 'string' || !comp.key.trim()) {
                throw new Error(`${sectionName} component #${i + 1} is missing a key`);
            }
            const normalizedKey = comp.key.trim();
            if (keySet.has(normalizedKey)) {
                throw new Error(`Duplicate component key "${normalizedKey}" in ${sectionName}`);
            }
            keySet.add(normalizedKey);

            if (!comp.name || typeof comp.name !== 'string' || !comp.name.trim()) {
                throw new Error(`${sectionName} component "${normalizedKey}" is missing a name`);
            }

            if (comp.type && !VALID_COMPONENT_TYPES.includes(comp.type)) {
                throw new Error(`Invalid component type "${comp.type}" in ${sectionName} component "${normalizedKey}"`);
            }

            if (comp.entryMode && !VALID_ENTRY_MODES.includes(comp.entryMode)) {
                throw new Error(`Invalid entryMode "${comp.entryMode}" in ${sectionName} component "${normalizedKey}"`);
            }

            let totalEntriesCount = 1;
            if (comp.entryMode === 'COUNTED') {
                const count = comp.entries?.count;
                const maxEach = comp.entries?.maxMarksEach;
                if (count === undefined || count < 1 || !Number.isInteger(Number(count))) {
                    throw new Error(`Component "${normalizedKey}" has COUNTED entryMode with invalid count (must be integer >= 1)`);
                }
                if (maxEach === undefined || Number(maxEach) <= 0) {
                    throw new Error(`Component "${normalizedKey}" has COUNTED entryMode with invalid maxMarksEach (must be > 0)`);
                }
                totalEntriesCount = Number(count);
            } else if (comp.entryMode === 'MANUAL') {
                const manual = comp.entries?.manualEntries;
                if (!Array.isArray(manual) || manual.length === 0) {
                    throw new Error(`Component "${normalizedKey}" has MANUAL entryMode but no manualEntries defined`);
                }
                for (const m of manual) {
                    if (!m.key || !m.name || Number(m.maxMarks) <= 0) {
                        throw new Error(`Component "${normalizedKey}" manualEntry must have valid key, name, and maxMarks > 0`);
                    }
                }
                totalEntriesCount = manual.length;
            }

            // Aggregation check
            if (comp.aggregation?.method) {
                if (!VALID_AGGREGATION_METHODS.includes(comp.aggregation.method)) {
                    throw new Error(`Invalid aggregation method "${comp.aggregation.method}" in ${normalizedKey}`);
                }
                if (comp.aggregation.method === 'BEST_N') {
                    const bestN = Number(comp.aggregation.bestN);
                    if (!bestN || bestN < 1 || bestN > totalEntriesCount) {
                        throw new Error(`Component "${normalizedKey}" uses BEST_N aggregation but bestN (${bestN}) is invalid (must be between 1 and ${totalEntriesCount})`);
                    }
                }
            }

            // Conversion check
            if (comp.conversion?.enabled) {
                const sMax = Number(comp.conversion.sourceMax);
                const tMax = Number(comp.conversion.targetMax);
                if (isNaN(sMax) || sMax <= 0) {
                    throw new Error(`Component "${normalizedKey}" has conversion enabled with invalid sourceMax (must be > 0)`);
                }
                if (isNaN(tMax) || tMax < 0) {
                    throw new Error(`Component "${normalizedKey}" has conversion enabled with invalid targetMax (must be >= 0)`);
                }
            }
        }
        return keySet;
    };

    let cieKeys = new Set();
    if (cie?.components) {
        cieKeys = validateComponents(cie.components, 'CIE') || new Set();
    }

    let seeKeys = new Set();
    if (see?.components) {
        seeKeys = validateComponents(see.components, 'SEE') || new Set();
    }

    // 5. Validate Eligibility Conditions
    if (eligibility?.conditions && Array.isArray(eligibility.conditions)) {
        for (let i = 0; i < eligibility.conditions.length; i++) {
            const cond = eligibility.conditions[i];
            if (!VALID_CONDITION_TYPES.includes(cond.type)) {
                throw new Error(`Condition #${i + 1} has invalid type "${cond.type}"`);
            }
            if (cond.value === undefined || isNaN(Number(cond.value)) || Number(cond.value) < 0) {
                throw new Error(`Condition #${i + 1} has invalid value (must be >= 0)`);
            }
            if (cond.type === 'COMPONENT_MIN') {
                if (!cond.componentKey || (!cieKeys.has(cond.componentKey) && !seeKeys.has(cond.componentKey))) {
                    throw new Error(`Condition #${i + 1} is COMPONENT_MIN but componentKey "${cond.componentKey}" was not found in CIE or SEE components`);
                }
            }
        }
    }

    // 6. Validate Grade Scale
    if (gradeScale?.grades && Array.isArray(gradeScale.grades)) {
        if (gradeScale.type && !VALID_GRADE_TYPES.includes(gradeScale.type)) {
            throw new Error(`Invalid gradeScale type "${gradeScale.type}"`);
        }
        for (let i = 0; i < gradeScale.grades.length; i++) {
            const g = gradeScale.grades[i];
            if (!g.grade || typeof g.grade !== 'string' || !g.grade.trim()) {
                throw new Error(`Grade item #${i + 1} is missing grade label`);
            }
            const min = Number(g.minMarks);
            const max = Number(g.maxMarks);
            if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min > max) {
                throw new Error(`Grade "${g.grade}" has invalid minMarks/maxMarks range [${g.minMarks}, ${g.maxMarks}]`);
            }
            if (g.gradePoint !== undefined && (isNaN(Number(g.gradePoint)) || Number(g.gradePoint) < 0)) {
                throw new Error(`Grade "${g.grade}" has invalid gradePoint (must be >= 0)`);
            }
        }
    }
}

/**
 * List Evaluation Rules
 * Supports filtering by scheme, evaluationGroup, status
 */
exports.listEvaluationRules = async (req, res) => {
    try {
        const { scheme, evaluationGroup, status } = req.query;
        const filter = {};

        if (scheme) {
            if (!mongoose.Types.ObjectId.isValid(scheme)) {
                return res.status(400).json({ success: false, error: 'Invalid scheme ID format' });
            }
            filter.scheme = scheme;
        }

        if (evaluationGroup) {
            if (!mongoose.Types.ObjectId.isValid(evaluationGroup)) {
                return res.status(400).json({ success: false, error: 'Invalid evaluationGroup ID format' });
            }
            filter.evaluationGroup = evaluationGroup;
        }

        if (status) {
            if (!['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status)) {
                return res.status(400).json({ success: false, error: 'Invalid status filter' });
            }
            filter.status = status;
        }

        const rules = await AcademicEvaluationRule.find(filter)
            .populate('scheme', 'name year status')
            .populate('evaluationGroup', 'name category status')
            .sort({ evaluationGroup: 1, version: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: rules.length,
            data: rules
        });
    } catch (err) {
        console.error('listEvaluationRules error:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve evaluation rules' });
    }
};

/**
 * Get single Evaluation Rule by ID
 */
exports.getEvaluationRuleById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid rule ID format' });
        }

        const rule = await AcademicEvaluationRule.findById(id)
            .populate('scheme', 'name year status')
            .populate({
                path: 'evaluationGroup',
                select: 'name category status subjects',
                populate: { path: 'subjects', select: 'code name credits' }
            })
            .lean();

        if (!rule) {
            return res.status(404).json({ success: false, error: 'Evaluation rule not found' });
        }

        return res.status(200).json({ success: true, data: rule });
    } catch (err) {
        console.error('getEvaluationRuleById error:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve evaluation rule' });
    }
};

/**
 * Create a new Evaluation Rule (Starts as DRAFT, version auto-incremented)
 */
exports.createEvaluationRule = async (req, res) => {
    try {
        await validateRuleConfig(req.body, true);

        const { scheme, evaluationGroup, name, description, contributesToSGPA, cie, see, eligibility, gradeScale } = req.body;

        // Auto-increment version per evaluationGroup
        const latestRule = await AcademicEvaluationRule.findOne({ evaluationGroup }).sort({ version: -1 });
        const nextVersion = latestRule ? latestRule.version + 1 : 1;

        const newRule = await AcademicEvaluationRule.create({
            scheme,
            evaluationGroup,
            name: name.trim(),
            description: String(description || '').trim(),
            version: nextVersion,
            status: 'DRAFT', // Always created as DRAFT
            contributesToSGPA: contributesToSGPA !== false,
            cie: cie || { enabled: true, components: [] },
            see: see || { enabled: true, components: [] },
            eligibility: eligibility || { enabled: true, operator: 'AND', conditions: [] },
            gradeScale: gradeScale || { enabled: true, type: 'MARK_RANGE', grades: [] }
        });

        const populated = await AcademicEvaluationRule.findById(newRule._id)
            .populate('scheme', 'name year status')
            .populate('evaluationGroup', 'name category status')
            .lean();

        return res.status(201).json({
            success: true,
            message: `Evaluation rule "${newRule.name}" (v${newRule.version}) created as DRAFT`,
            data: populated
        });
    } catch (err) {
        console.error('createEvaluationRule error:', err);
        return res.status(400).json({ success: false, error: err.message || 'Failed to create evaluation rule' });
    }
};

/**
 * Update an existing Evaluation Rule (Only allowed for DRAFT rules)
 */
exports.updateEvaluationRule = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid rule ID format' });
        }

        const existingRule = await AcademicEvaluationRule.findById(id);
        if (!existingRule) {
            return res.status(404).json({ success: false, error: 'Evaluation rule not found' });
        }

        // Guard: Immutable active or archived rules
        if (existingRule.status === 'ACTIVE') {
            return res.status(400).json({
                success: false,
                error: 'Cannot edit an ACTIVE rule. Historical rules are immutable. Create a new DRAFT version using /new-version.'
            });
        }
        if (existingRule.status === 'ARCHIVED') {
            return res.status(400).json({
                success: false,
                error: 'Cannot edit an ARCHIVED rule.'
            });
        }

        // Validate incoming updates
        await validateRuleConfig({
            ...existingRule.toObject(),
            ...req.body,
            scheme: existingRule.scheme,
            evaluationGroup: existingRule.evaluationGroup
        }, false);

        const { name, description, contributesToSGPA, cie, see, eligibility, gradeScale } = req.body;

        if (name !== undefined) existingRule.name = name.trim();
        if (description !== undefined) existingRule.description = String(description).trim();
        if (contributesToSGPA !== undefined) existingRule.contributesToSGPA = Boolean(contributesToSGPA);
        if (cie !== undefined) existingRule.cie = cie;
        if (see !== undefined) existingRule.see = see;
        if (eligibility !== undefined) existingRule.eligibility = eligibility;
        if (gradeScale !== undefined) existingRule.gradeScale = gradeScale;

        await existingRule.save();

        const populated = await AcademicEvaluationRule.findById(existingRule._id)
            .populate('scheme', 'name year status')
            .populate('evaluationGroup', 'name category status')
            .lean();

        return res.status(200).json({
            success: true,
            message: 'Evaluation rule updated successfully',
            data: populated
        });
    } catch (err) {
        console.error('updateEvaluationRule error:', err);
        return res.status(400).json({ success: false, error: err.message || 'Failed to update evaluation rule' });
    }
};

/**
 * Activate an Evaluation Rule
 * Enforces single active rule per evaluationGroup by archiving previous active rule.
 */
exports.activateEvaluationRule = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid rule ID format' });
        }

        const rule = await AcademicEvaluationRule.findById(id);
        if (!rule) {
            return res.status(404).json({ success: false, error: 'Evaluation rule not found' });
        }

        if (rule.status === 'ACTIVE') {
            return res.status(200).json({ success: true, message: 'Rule is already ACTIVE', data: rule });
        }

        // Archive any currently active rule for this evaluation group
        await AcademicEvaluationRule.updateMany(
            {
                evaluationGroup: rule.evaluationGroup,
                _id: { $ne: rule._id },
                status: 'ACTIVE'
            },
            { $set: { status: 'ARCHIVED' } }
        );

        rule.status = 'ACTIVE';
        await rule.save();

        const populated = await AcademicEvaluationRule.findById(rule._id)
            .populate('scheme', 'name year status')
            .populate('evaluationGroup', 'name category status')
            .lean();

        return res.status(200).json({
            success: true,
            message: `Evaluation rule "${rule.name}" (v${rule.version}) is now ACTIVE`,
            data: populated
        });
    } catch (err) {
        console.error('activateEvaluationRule error:', err);
        return res.status(500).json({ success: false, error: 'Failed to activate evaluation rule' });
    }
};

/**
 * Archive an Evaluation Rule
 */
exports.archiveEvaluationRule = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid rule ID format' });
        }

        const rule = await AcademicEvaluationRule.findById(id);
        if (!rule) {
            return res.status(404).json({ success: false, error: 'Evaluation rule not found' });
        }

        rule.status = 'ARCHIVED';
        await rule.save();

        return res.status(200).json({
            success: true,
            message: `Evaluation rule "${rule.name}" (v${rule.version}) archived`,
            data: rule
        });
    } catch (err) {
        console.error('archiveEvaluationRule error:', err);
        return res.status(500).json({ success: false, error: 'Failed to archive evaluation rule' });
    }
};

/**
 * Create a new DRAFT version cloned from an existing rule
 */
exports.createNewVersion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid rule ID format' });
        }

        const sourceRule = await AcademicEvaluationRule.findById(id).lean();
        if (!sourceRule) {
            return res.status(404).json({ success: false, error: 'Source evaluation rule not found' });
        }

        // Determine next version for this evaluation group
        const latestRule = await AcademicEvaluationRule.findOne({ evaluationGroup: sourceRule.evaluationGroup }).sort({ version: -1 });
        const nextVersion = latestRule ? latestRule.version + 1 : 2;

        const clonedRule = await AcademicEvaluationRule.create({
            scheme: sourceRule.scheme,
            evaluationGroup: sourceRule.evaluationGroup,
            name: sourceRule.name,
            description: sourceRule.description,
            version: nextVersion,
            status: 'DRAFT',
            contributesToSGPA: sourceRule.contributesToSGPA,
            cie: sourceRule.cie,
            see: sourceRule.see,
            eligibility: sourceRule.eligibility,
            gradeScale: sourceRule.gradeScale
        });

        const populated = await AcademicEvaluationRule.findById(clonedRule._id)
            .populate('scheme', 'name year status')
            .populate('evaluationGroup', 'name category status')
            .lean();

        return res.status(201).json({
            success: true,
            message: `Created new DRAFT version v${clonedRule.version} from rule "${sourceRule.name}"`,
            data: populated
        });
    } catch (err) {
        console.error('createNewVersion error:', err);
        return res.status(500).json({ success: false, error: 'Failed to create new rule version' });
    }
};

/**
 * Delete a DRAFT Evaluation Rule (ACTIVE rules cannot be deleted)
 */
exports.deleteEvaluationRule = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid rule ID format' });
        }

        const rule = await AcademicEvaluationRule.findById(id);
        if (!rule) {
            return res.status(404).json({ success: false, error: 'Evaluation rule not found' });
        }

        if (rule.status === 'ACTIVE') {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete an ACTIVE rule. Archive it first or activate another version.'
            });
        }

        await AcademicEvaluationRule.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: `DRAFT evaluation rule "${rule.name}" (v${rule.version}) deleted successfully`
        });
    } catch (err) {
        console.error('deleteEvaluationRule error:', err);
        return res.status(500).json({ success: false, error: 'Failed to delete evaluation rule' });
    }
};
