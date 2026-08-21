const AcademicSubject = require('../models/AcademicSubject');
const Branch = require('../models/Branch');
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
        const { search, year, scheme, status, credits, branch, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (scheme) filter.scheme = scheme;
        if (branch) filter.branch = branch;
        if (credits !== undefined && credits !== '') {
            filter.credits = parseInt(credits);
        }
        if (year) {
            const yearMap = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
            filter.year = yearMap[year] || year;
        }

        if (search) {
            const regex = new RegExp(escapeRegExp(search), 'i');
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

        if (!name || !code || !year || !scheme || credits === undefined) {
            return res.status(400).json({ error: 'name, code, year, scheme, and credits are required' });
        }

        const creditsInt = parseInt(credits);
        if (isNaN(creditsInt) || creditsInt < 0 || creditsInt > 4) {
            return res.status(400).json({ error: 'Credits must be an integer from 0 to 4' });
        }

        const targetCode = code.toUpperCase().trim();
        const targetSlug = slugify(name);

        // Ensure uniqueness
        const codeExists = await AcademicSubject.findOne({ code: targetCode });
        if (codeExists) return res.status(400).json({ error: `Subject code '${targetCode}' already exists` });

        const slugExists = await AcademicSubject.findOne({ slug: targetSlug });
        if (slugExists) return res.status(400).json({ error: `Subject slug '${targetSlug}' already exists` });

        // Resolve branch ObjectId
        let branchId = branch;
        if (!branchId || branchId === 'Common' || branchId === '-') {
            const commonBranch = await Branch.findOne({ shortName: 'Common' });
            branchId = commonBranch ? commonBranch._id : null;
        }

        if (!branchId) {
            return res.status(400).json({ error: 'Valid branch selection is required' });
        }

        const subject = await AcademicSubject.create({
            name: name.trim(),
            code: targetCode,
            year,
            scheme,
            credits: creditsInt,
            branch: branchId,
            status: status || 'Published',
            slug: targetSlug
        });

        const populatedSubject = await subjectService.getSubjectById(subject._id);
        res.status(201).json(populatedSubject);
    } catch (error) {
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
                const codeExists = await AcademicSubject.findOne({ code: targetCode });
                if (codeExists) return res.status(400).json({ error: `Subject code '${targetCode}' already exists` });
                subject.code = targetCode;
            }
        }

        if (name) {
            subject.name = name.trim();
            subject.slug = slugify(name);
        }

        if (year) subject.year = year;
        if (scheme) subject.scheme = scheme;
        if (status) subject.status = status;

        if (branch !== undefined) {
            let branchId = branch;
            if (!branchId || branchId === 'Common' || branchId === '-') {
                const commonBranch = await Branch.findOne({ shortName: 'Common' });
                branchId = commonBranch ? commonBranch._id : null;
            }
            if (branchId) {
                subject.branch = branchId;
            }
        }

        await subject.save();
        const populatedSubject = await subjectService.getSubjectById(subject._id);
        res.status(200).json(populatedSubject);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// DELETE /api/admin/subjects/:id  (soft hide)
const deleteSubject = async (req, res) => {
    try {
        const subject = await AcademicSubject.findById(req.params.id);
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        subject.status = 'Hidden';
        await subject.save();

        res.status(200).json({ message: 'Subject hidden successfully' });
    } catch (error) {
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
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

module.exports = { getStats, getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject, duplicateSubject };
