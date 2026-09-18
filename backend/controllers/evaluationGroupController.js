const mongoose = require('mongoose');
const AcademicEvaluationGroup = require('../models/AcademicEvaluationGroup');
const AcademicSubject = require('../models/AcademicSubject');
const Scheme = require('../models/Scheme');

const VALID_CATEGORIES = ['Theory', 'Theory + Lab', 'Lab Only', 'Practical'];

/**
 * List evaluation groups filtered by scheme and optional category
 */
exports.listEvaluationGroups = async (req, res) => {
    try {
        const { scheme, category } = req.query;

        const filter = {};
        if (scheme) {
            if (!mongoose.Types.ObjectId.isValid(scheme)) {
                return res.status(400).json({ success: false, error: 'Invalid scheme ID format' });
            }
            filter.scheme = scheme;
        }
        if (category) {
            if (!VALID_CATEGORIES.includes(category)) {
                return res.status(400).json({ success: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
            }
            filter.category = category;
        }

        const groups = await AcademicEvaluationGroup.find(filter)
            .populate('scheme', 'name code status')
            .populate({
                path: 'subjects',
                select: '_id code name credits category evaluationType semester year status branch',
                populate: {
                    path: 'branch',
                    select: 'shortName name'
                }
            })
            .sort({ category: 1, name: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: groups.length,
            data: groups
        });
    } catch (err) {
        console.error('listEvaluationGroups error:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve evaluation groups' });
    }
};

/**
 * Get a single evaluation group by ID
 */
exports.getEvaluationGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid group ID format' });
        }

        const group = await AcademicEvaluationGroup.findById(id)
            .populate('scheme', 'name code status')
            .populate({
                path: 'subjects',
                select: '_id code name credits category evaluationType semester year status branch',
                populate: {
                    path: 'branch',
                    select: 'shortName name'
                }
            })
            .lean();

        if (!group) {
            return res.status(404).json({ success: false, error: 'Evaluation group not found' });
        }

        return res.status(200).json({
            success: true,
            data: group
        });
    } catch (err) {
        console.error('getEvaluationGroupById error:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve evaluation group' });
    }
};

/**
 * Create a new evaluation group
 */
exports.createEvaluationGroup = async (req, res) => {
    try {
        const { name, description = '', scheme, category, subjects = [] } = req.body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Group name is required' });
        }
        if (!scheme || !mongoose.Types.ObjectId.isValid(scheme)) {
            return res.status(400).json({ success: false, error: 'A valid scheme ID is required' });
        }
        if (!category || !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ success: false, error: `Valid category is required (${VALID_CATEGORIES.join(', ')})` });
        }

        // Verify scheme exists
        const schemeDoc = await Scheme.findById(scheme);
        if (!schemeDoc) {
            return res.status(404).json({ success: false, error: 'Scheme not found' });
        }

        // Check name uniqueness within scheme
        const trimmedName = name.trim();
        const existingName = await AcademicEvaluationGroup.findOne({
            scheme,
            name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (existingName) {
            return res.status(409).json({
                success: false,
                error: `An evaluation group named "${trimmedName}" already exists for Scheme ${schemeDoc.name}`
            });
        }

        // Validate subjects if provided
        let sanitizedSubjectIds = [];
        if (Array.isArray(subjects) && subjects.length > 0) {
            sanitizedSubjectIds = [...new Set(subjects.map(s => String(s)))];

            // Verify all subjects exist, belong to this scheme, and match this category
            const subjectDocs = await AcademicSubject.find({
                _id: { $in: sanitizedSubjectIds }
            }).lean();

            if (subjectDocs.length !== sanitizedSubjectIds.length) {
                return res.status(400).json({ success: false, error: 'One or more selected subjects do not exist' });
            }

            for (const sub of subjectDocs) {
                if (String(sub.scheme) !== String(scheme)) {
                    return res.status(400).json({
                        success: false,
                        error: `Subject "${sub.name}" (${sub.code}) does not belong to the selected Scheme`
                    });
                }
                if (sub.category !== category) {
                    return res.status(400).json({
                        success: false,
                        error: `Invalid cross-category assignment: Subject "${sub.name}" (${sub.code}) has category "${sub.category}", cannot be assigned to "${category}" group`
                    });
                }
            }

            // Check if any subject is already assigned to an existing group in this scheme
            const conflictingGroup = await AcademicEvaluationGroup.findOne({
                scheme,
                subjects: { $in: sanitizedSubjectIds }
            }).populate('subjects', 'code name').lean();

            if (conflictingGroup) {
                const assignedCodes = conflictingGroup.subjects
                    .filter(s => sanitizedSubjectIds.includes(String(s._id)))
                    .map(s => s.code);
                return res.status(409).json({
                    success: false,
                    error: `Subject(s) [${assignedCodes.join(', ')}] are already assigned to group "${conflictingGroup.name}" in this scheme`
                });
            }
        }

        const newGroup = await AcademicEvaluationGroup.create({
            name: trimmedName,
            description: String(description || '').trim(),
            scheme,
            category,
            subjects: sanitizedSubjectIds,
            status: 'Active'
        });

        const populated = await AcademicEvaluationGroup.findById(newGroup._id)
            .populate('scheme', 'name code')
            .populate({
                path: 'subjects',
                select: '_id code name credits category evaluationType semester year status branch',
                populate: { path: 'branch', select: 'shortName name' }
            })
            .lean();

        return res.status(201).json({
            success: true,
            message: 'Evaluation group created successfully',
            data: populated
        });
    } catch (err) {
        console.error('createEvaluationGroup error:', err);
        return res.status(500).json({ success: false, error: 'Failed to create evaluation group' });
    }
};

/**
 * Update an evaluation group (name, description, status, subject assignments)
 */
exports.updateEvaluationGroup = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid group ID format' });
        }

        const group = await AcademicEvaluationGroup.findById(id);
        if (!group) {
            return res.status(404).json({ success: false, error: 'Evaluation group not found' });
        }

        const { name, description, status, subjects } = req.body;

        // If name changed, verify uniqueness
        if (name !== undefined) {
            const trimmedName = String(name).trim();
            if (!trimmedName) {
                return res.status(400).json({ success: false, error: 'Group name cannot be empty' });
            }

            const existingName = await AcademicEvaluationGroup.findOne({
                _id: { $ne: group._id },
                scheme: group.scheme,
                name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });
            if (existingName) {
                return res.status(409).json({
                    success: false,
                    error: `Another group named "${trimmedName}" already exists for this scheme`
                });
            }
            group.name = trimmedName;
        }

        if (description !== undefined) {
            group.description = String(description || '').trim();
        }

        if (status !== undefined) {
            if (!['Active', 'Inactive'].includes(status)) {
                return res.status(400).json({ success: false, error: 'Status must be "Active" or "Inactive"' });
            }
            group.status = status;
        }

        // If subjects array provided, validate assignment
        if (subjects !== undefined) {
            if (!Array.isArray(subjects)) {
                return res.status(400).json({ success: false, error: 'Subjects must be an array of IDs' });
            }

            const sanitizedSubjectIds = [...new Set(subjects.map(s => String(s)))];

            if (sanitizedSubjectIds.length > 0) {
                const subjectDocs = await AcademicSubject.find({
                    _id: { $in: sanitizedSubjectIds }
                }).lean();

                if (subjectDocs.length !== sanitizedSubjectIds.length) {
                    return res.status(400).json({ success: false, error: 'One or more selected subjects do not exist' });
                }

                for (const sub of subjectDocs) {
                    if (String(sub.scheme) !== String(group.scheme)) {
                        return res.status(400).json({
                            success: false,
                            error: `Subject "${sub.name}" (${sub.code}) does not belong to the group's scheme`
                        });
                    }
                    if (sub.category !== group.category) {
                        return res.status(400).json({
                            success: false,
                            error: `Invalid cross-category assignment: Subject "${sub.name}" (${sub.code}) has category "${sub.category}", cannot be assigned to "${group.category}" group`
                        });
                    }
                }

                // Check conflict: subject assigned to another group in this scheme
                const conflictingGroup = await AcademicEvaluationGroup.findOne({
                    _id: { $ne: group._id },
                    scheme: group.scheme,
                    subjects: { $in: sanitizedSubjectIds }
                }).populate('subjects', 'code name').lean();

                if (conflictingGroup) {
                    const assignedCodes = conflictingGroup.subjects
                        .filter(s => sanitizedSubjectIds.includes(String(s._id)))
                        .map(s => s.code);
                    return res.status(409).json({
                        success: false,
                        error: `Subject(s) [${assignedCodes.join(', ')}] are already assigned to group "${conflictingGroup.name}"`
                    });
                }
            }

            group.subjects = sanitizedSubjectIds;
        }

        await group.save();

        const populated = await AcademicEvaluationGroup.findById(group._id)
            .populate('scheme', 'name code')
            .populate({
                path: 'subjects',
                select: '_id code name credits category evaluationType semester year status branch',
                populate: { path: 'branch', select: 'shortName name' }
            })
            .lean();

        return res.status(200).json({
            success: true,
            message: 'Evaluation group updated successfully',
            data: populated
        });
    } catch (err) {
        console.error('updateEvaluationGroup error:', err);
        return res.status(500).json({ success: false, error: 'Failed to update evaluation group' });
    }
};

/**
 * Delete an evaluation group (leaves subjects intact, unassigning them)
 */
exports.deleteEvaluationGroup = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid group ID format' });
        }

        const group = await AcademicEvaluationGroup.findByIdAndDelete(id);
        if (!group) {
            return res.status(404).json({ success: false, error: 'Evaluation group not found' });
        }

        return res.status(200).json({
            success: true,
            message: `Evaluation group "${group.name}" deleted successfully. Any previously assigned subjects are now unassigned.`
        });
    } catch (err) {
        console.error('deleteEvaluationGroup error:', err);
        return res.status(500).json({ success: false, error: 'Failed to delete evaluation group' });
    }
};

/**
 * Fetch available subjects for assignment given a scheme and category,
 * annotated with whether they are currently assigned to any other group in this scheme.
 */
exports.getAvailableSubjects = async (req, res) => {
    try {
        const { scheme, category, currentGroupId } = req.query;

        if (!scheme || !mongoose.Types.ObjectId.isValid(scheme)) {
            return res.status(400).json({ success: false, error: 'Valid scheme ID is required' });
        }
        if (!category || !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ success: false, error: `Valid category is required (${VALID_CATEGORIES.join(', ')})` });
        }

        // 1. Get all subjects matching scheme and category from academic_subjects
        const subjects = await AcademicSubject.find({
            scheme,
            category
        })
        .populate('branch', 'shortName name')
        .sort({ code: 1 })
        .lean();

        // 2. Get all evaluation groups for this scheme to check existing assignments
        const groups = await AcademicEvaluationGroup.find({ scheme }).select('_id name category subjects').lean();

        const assignmentMap = {};
        for (const g of groups) {
            const isCurrent = currentGroupId && String(g._id) === String(currentGroupId);
            for (const subId of (g.subjects || [])) {
                assignmentMap[String(subId)] = {
                    groupId: g._id,
                    groupName: g.name,
                    groupCategory: g.category,
                    isCurrentGroup: isCurrent
                };
            }
        }

        // 3. Annotate subjects
        const annotatedSubjects = subjects.map(s => {
            const assignment = assignmentMap[String(s._id)];
            return {
                _id: s._id,
                code: s.code,
                name: s.name,
                credits: s.credits,
                category: s.category,
                evaluationType: s.evaluationType,
                semester: s.semester,
                year: s.year,
                branch: s.branch ? s.branch.shortName : 'COMMON',
                isAssigned: !!assignment,
                isAssignedToOtherGroup: !!assignment && !assignment.isCurrentGroup,
                isAssignedToThisGroup: !!assignment && assignment.isCurrentGroup,
                assignedGroupName: assignment ? assignment.groupName : null,
                assignedGroupId: assignment ? assignment.groupId : null
            };
        });

        return res.status(200).json({
            success: true,
            count: annotatedSubjects.length,
            data: annotatedSubjects
        });
    } catch (err) {
        console.error('getAvailableSubjects error:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve available subjects' });
    }
};
