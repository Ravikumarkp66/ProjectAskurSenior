const AcademicSubject = require('../models/AcademicSubject');

const slugify = (text) =>
    text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

// GET /api/academic-subjects
const getAllSubjects = async (req, res) => {
    try {
        const { search, year, scheme, status } = req.query;
        const filter = {};

        if (year) filter.year = year;
        if (scheme) filter.scheme = scheme;
        if (status) filter.status = status;

        if (search) {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { name: regex },
                { code: regex }
            ];
        }

        const subjects = await AcademicSubject.find(filter).sort({ year: 1, name: 1 });
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/academic-subjects/:id
const getSubjectById = async (req, res) => {
    try {
        const subject = await AcademicSubject.findById(req.params.id);
        if (!subject) return res.status(404).json({ error: 'Subject not found' });
        res.status(200).json(subject);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/academic-subjects
const createSubject = async (req, res) => {
    try {
        const { name, code, year, scheme, credits, status, slug } = req.body;

        if (!name || !code || !year || !scheme || credits === undefined) {
            return res.status(400).json({ error: 'name, code, year, scheme, and credits are required' });
        }

        const targetCode = code.toUpperCase().trim();
        const targetSlug = (slug || slugify(name)).toLowerCase().trim();

        // Check if code or slug already exists
        const codeExists = await AcademicSubject.findOne({ code: targetCode });
        if (codeExists) return res.status(400).json({ error: `Subject code '${targetCode}' already exists` });

        const slugExists = await AcademicSubject.findOne({ slug: targetSlug });
        if (slugExists) return res.status(400).json({ error: `Subject slug '${targetSlug}' already exists` });

        const subject = await AcademicSubject.create({
            name: name.trim(),
            code: targetCode,
            year,
            scheme,
            credits,
            status: status || 'Published',
            slug: targetSlug
        });

        res.status(201).json(subject);
    } catch (error) {
        res.status(400).json({ error: 'Validation failed', details: error.message });
    }
};

// PUT /api/academic-subjects/:id
const updateSubject = async (req, res) => {
    try {
        const { name, code, year, scheme, credits, status, slug } = req.body;
        const subject = await AcademicSubject.findById(req.params.id);
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        if (code) {
            const targetCode = code.toUpperCase().trim();
            if (targetCode !== subject.code) {
                const codeExists = await AcademicSubject.findOne({ code: targetCode });
                if (codeExists) return res.status(400).json({ error: `Subject code '${targetCode}' already exists` });
                subject.code = targetCode;
            }
        }

        if (slug) {
            const targetSlug = slug.toLowerCase().trim();
            if (targetSlug !== subject.slug) {
                const slugExists = await AcademicSubject.findOne({ slug: targetSlug });
                if (slugExists) return res.status(400).json({ error: `Subject slug '${targetSlug}' already exists` });
                subject.slug = targetSlug;
            }
        } else if (name && name.trim() !== subject.name) {
            // Re-generate slug if name changed but slug wasn't provided
            const targetSlug = slugify(name);
            if (targetSlug !== subject.slug) {
                const slugExists = await AcademicSubject.findOne({ slug: targetSlug });
                if (slugExists) return res.status(400).json({ error: `Subject slug '${targetSlug}' already exists` });
                subject.slug = targetSlug;
            }
        }

        if (name) subject.name = name.trim();
        if (year) subject.year = year;
        if (scheme) subject.scheme = scheme;
        if (credits !== undefined) subject.credits = credits;
        if (status) subject.status = status;

        await subject.save();
        res.status(200).json(subject);
    } catch (error) {
        res.status(400).json({ error: 'Validation failed', details: error.message });
    }
};

// DELETE /api/academic-subjects/:id
const deleteSubject = async (req, res) => {
    try {
        const subject = await AcademicSubject.findByIdAndDelete(req.params.id);
        if (!subject) return res.status(404).json({ error: 'Subject not found' });
        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

module.exports = {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};
