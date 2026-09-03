const mongoose = require('mongoose');
const AcademicSubject = require('../models/AcademicSubject');
const Branch = require('../models/Branch');
const Scheme = require('../models/Scheme');
const AcademicMaterial = require('../models/AcademicMaterial');
const subjectService = require('../services/subjectService');

const escapeRegExp = (str) => str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

// Generate a URL-safe slug from a name
const slugify = (text) =>
    text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

// GET /api/admin/subjects/stats
const getStats = async (req, res) => {
    try {
        const total = await AcademicSubject.countDocuments({});

        // Group by year directly
        const yearStats = await AcademicSubject.aggregate([
            {
                $group: {
                    _id: '$year',
                    count: { $sum: 1 }
                }
            }
        ]);

        const byYear = {
            year1: 0,
            year2: 0,
            year3: 0,
            year4: 0
        };

        yearStats.forEach(y => {
            if (y._id === '1st Year') byYear.year1 = y.count;
            else if (y._id === '2nd Year') byYear.year2 = y.count;
            else if (y._id === '3rd Year') byYear.year3 = y.count;
            else if (y._id === '4th Year') byYear.year4 = y.count;
        });

        res.status(200).json({ total, byYear });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/admin/subjects
const getSubjects = async (req, res) => {
    try {
        const { search, year, scheme, status, credits, branch, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        if (scheme) {
            if (mongoose.Types.ObjectId.isValid(scheme)) {
                filter.scheme = scheme;
            } else {
                const foundScheme = await Scheme.findOne({ name: scheme });
                if (foundScheme) {
                    filter.scheme = foundScheme._id;
                }
            }
        }

        if (branch) {
            if (mongoose.Types.ObjectId.isValid(branch)) {
                filter.branch = branch;
            } else {
                const foundBranch = await Branch.findOne({ shortName: branch.toUpperCase() });
                if (foundBranch) {
                    filter.branch = foundBranch._id;
                }
            }
        }

        if (credits !== undefined && credits !== '') {
            filter.credits = parseInt(credits);
        }

        if (year) {
            const yearMap = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
            filter.year = yearMap[year] || year;
        }

        if (search) {
            const regex = new RegExp(escapeRegExp(search.trim()), 'i');
            filter.$or = [
                { name: regex },
                { code: regex }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [subjects, total] = await Promise.all([
            subjectService.getSubjects(filter, skip, limit),
            subjectService.countSubjects(filter)
        ]);

        res.status(200).json({
            subjects,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getSubjects:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/admin/subjects/:id
const getSubjectById = async (req, res) => {
    try {
        const subject = await subjectService.getSubjectById(req.params.id);
        if (!subject) return res.status(404).json({ error: 'Subject not found' });
        res.status(200).json(subject);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/admin/subjects
const createSubject = async (req, res) => {
    try {
        const { name, code, credits, year, scheme, status, branch } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Subject name is required' });
        }
        if (!code || !code.trim()) {
            return res.status(400).json({ error: 'Course code is required' });
        }
        if (!year) {
            return res.status(400).json({ error: 'Academic year is required' });
        }
        if (!scheme) {
            return res.status(400).json({ error: 'Scheme is required' });
        }
        if (credits === undefined || credits === null || credits === '') {
            return res.status(400).json({ error: 'Credits are required' });
        }

        const creditsInt = parseInt(credits);
        if (isNaN(creditsInt) || creditsInt < 0 || creditsInt > 4) {
            return res.status(400).json({ error: 'Credits must be an integer from 0 to 4' });
        }

        const targetCode = code.toUpperCase().trim();
        const baseSlug = slugify(name.trim()) || targetCode.toLowerCase();

        // Ensure uniqueness
        const codeExists = await AcademicSubject.findOne({ code: targetCode });
        if (codeExists) {
            return res.status(400).json({ error: `Course code '${targetCode}' already exists` });
        }

        // Generate unique slug if identical slug exists
        let targetSlug = baseSlug;
        let slugCounter = 1;
        while (await AcademicSubject.findOne({ slug: targetSlug })) {
            targetSlug = `${baseSlug}-${slugCounter++}`;
        }

        // Resolve branch ObjectId
        let branchId = branch;
        if (!branchId || branchId === 'Common' || branchId === 'COMMON' || branchId === '-') {
            const commonBranch = await Branch.findOne({ shortName: { $in: ['COMMON', 'Common'] } });
            branchId = commonBranch ? commonBranch._id : null;
        } else if (!mongoose.Types.ObjectId.isValid(branchId)) {
            const foundBranch = await Branch.findOne({ shortName: branchId.toUpperCase() });
            branchId = foundBranch ? foundBranch._id : null;
        }

        if (!branchId) {
            return res.status(400).json({ error: 'Valid branch selection is required' });
        }

        // Resolve scheme ObjectId
        let schemeId = scheme;
        if (!mongoose.Types.ObjectId.isValid(schemeId)) {
            const foundScheme = await Scheme.findOne({ name: scheme });
            schemeId = foundScheme ? foundScheme._id : null;
        }

        if (!schemeId) {
            return res.status(400).json({ error: 'Valid scheme selection is required' });
        }

        const subject = await AcademicSubject.create({
            name: name.trim(),
            code: targetCode,
            year,
            scheme: schemeId,
            credits: creditsInt,
            branch: branchId,
            status: status || 'Published',
            slug: targetSlug
        });

        const populatedSubject = await subjectService.getSubjectById(subject._id);
        res.status(201).json(populatedSubject);
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// PUT /api/admin/subjects/:id
const updateSubject = async (req, res) => {
    try {
        const { name, code, credits, year, scheme, status, branch } = req.body;

        const subject = await AcademicSubject.findById(req.params.id);
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        if (credits !== undefined) {
            const creditsInt = parseInt(credits);
            if (isNaN(creditsInt) || creditsInt < 0 || creditsInt > 4) {
                return res.status(400).json({ error: 'Credits must be an integer from 0 to 4' });
            }
            subject.credits = creditsInt;
        }

        if (code) {
            const targetCode = code.toUpperCase().trim();
            if (targetCode !== subject.code) {
                const codeExists = await AcademicSubject.findOne({ code: targetCode, _id: { $ne: subject._id } });
                if (codeExists) return res.status(400).json({ error: `Subject code '${targetCode}' already exists` });
                subject.code = targetCode;
            }
        }

        if (name && name.trim()) {
            subject.name = name.trim();
            const baseSlug = slugify(name.trim());
            let targetSlug = baseSlug;
            let slugCounter = 1;
            while (await AcademicSubject.findOne({ slug: targetSlug, _id: { $ne: subject._id } })) {
                targetSlug = `${baseSlug}-${slugCounter++}`;
            }
            subject.slug = targetSlug;
        }

        if (year) subject.year = year;

        if (scheme !== undefined) {
            let schemeId = scheme;
            if (!mongoose.Types.ObjectId.isValid(schemeId)) {
                const foundScheme = await Scheme.findOne({ name: scheme });
                schemeId = foundScheme ? foundScheme._id : null;
            }
            if (schemeId) {
                subject.scheme = schemeId;
            }
        }

        if (status) subject.status = status;

        if (branch !== undefined) {
            let branchId = branch;
            if (!branchId || branchId === 'Common' || branchId === 'COMMON' || branchId === '-') {
                const commonBranch = await Branch.findOne({ shortName: { $in: ['COMMON', 'Common'] } });
                branchId = commonBranch ? commonBranch._id : null;
            } else if (!mongoose.Types.ObjectId.isValid(branchId)) {
                const foundBranch = await Branch.findOne({ shortName: branchId.toUpperCase() });
                branchId = foundBranch ? foundBranch._id : null;
            }
            if (branchId) {
                subject.branch = branchId;
            }
        }

        await subject.save();
        const populatedSubject = await subjectService.getSubjectById(subject._id);
        res.status(200).json(populatedSubject);
    } catch (error) {
        console.error('Error updating subject:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// DELETE /api/admin/subjects/:id  (soft hide by default, hard delete only if no materials)
const deleteSubject = async (req, res) => {
    try {
        const subject = await AcademicSubject.findById(req.params.id);
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const { hard } = req.query;

        if (hard === 'true') {
            const materialsCount = await AcademicMaterial.countDocuments({ subject: subject._id });
            if (materialsCount > 0) {
                return res.status(400).json({
                    error: `Cannot permanently delete '${subject.name}'. It is referenced by ${materialsCount} material(s). Use Archive/Hide instead.`
                });
            }
            await AcademicSubject.findByIdAndDelete(subject._id);
            return res.status(200).json({ message: 'Subject permanently deleted successfully' });
        }

        // Soft delete / archive by setting status to Hidden
        subject.status = 'Hidden';
        await subject.save();

        res.status(200).json({ message: 'Subject archived successfully', subject });
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/admin/subjects/:id/duplicate
const duplicateSubject = async (req, res) => {
    try {
        const original = await AcademicSubject.findById(req.params.id);
        if (!original) return res.status(404).json({ error: 'Subject not found' });

        const baseName = `${original.name} (Copy)`;
        const baseCode = `${original.code}-COPY`;
        const baseSlug = slugify(baseName);

        // Ensure uniqueness
        let uniqueSlug = baseSlug;
        let counter = 1;
        while (await AcademicSubject.findOne({ slug: uniqueSlug })) {
            uniqueSlug = `${baseSlug}-${counter++}`;
        }

        let uniqueCode = baseCode;
        let codeCounter = 1;
        while (await AcademicSubject.findOne({ code: uniqueCode })) {
            uniqueCode = `${baseCode}-${codeCounter++}`;
        }

        const duplicate = await AcademicSubject.create({
            name: baseName,
            code: uniqueCode,
            year: original.year,
            scheme: original.scheme,
            credits: original.credits,
            branch: original.branch,
            status: 'Hidden',
            slug: uniqueSlug
        });

        const populatedDuplicate = await subjectService.getSubjectById(duplicate._id);
        res.status(201).json(populatedDuplicate);
    } catch (error) {
        console.error('Error duplicating subject:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

module.exports = { getStats, getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject, duplicateSubject };
