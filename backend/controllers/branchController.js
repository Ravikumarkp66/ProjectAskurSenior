const Branch = require('../models/Branch');

// GET /api/public/branches
const getPublicBranches = async (req, res) => {
    try {
        const branches = await Branch.find({ status: 'Published' }).sort({ displayOrder: 1, name: 1 });
        res.status(200).json(branches);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/admin/branches
const getAdminBranches = async (req, res) => {
    try {
        const branches = await Branch.find({}).sort({ displayOrder: 1, name: 1 });
        res.status(200).json(branches);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// POST /api/admin/branches
const createBranch = async (req, res) => {
    try {
        const { name, shortName, displayOrder, status } = req.body;
        if (!name || !shortName) {
            return res.status(400).json({ error: 'name and shortName are required' });
        }

        const normalizedShortName = shortName.toUpperCase().trim();

        // Check if exists
        const exists = await Branch.findOne({ shortName: normalizedShortName });
        if (exists) {
            return res.status(400).json({ error: `Branch with code '${normalizedShortName}' already exists` });
        }

        const branch = await Branch.create({
            name: name.trim(),
            shortName: normalizedShortName,
            displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0,
            status: status || 'Published'
        });

        res.status(201).json(branch);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// PUT /api/admin/branches/:id
const updateBranch = async (req, res) => {
    try {
        const { name, shortName, displayOrder, status } = req.body;

        const branch = await Branch.findById(req.params.id);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });

        if (shortName) {
            const normalizedShortName = shortName.toUpperCase().trim();
            if (normalizedShortName !== branch.shortName) {
                const exists = await Branch.findOne({ shortName: normalizedShortName });
                if (exists) {
                    return res.status(400).json({ error: `Branch with code '${normalizedShortName}' already exists` });
                }
                branch.shortName = normalizedShortName;
            }
        }

        if (name) branch.name = name.trim();
        if (displayOrder !== undefined) branch.displayOrder = parseInt(displayOrder);
        if (status) branch.status = status;

        await branch.save();
        res.status(200).json(branch);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// DELETE /api/admin/branches/:id
const deleteBranch = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });

        branch.status = 'Hidden';
        await branch.save();

        res.status(200).json({ message: 'Branch hidden successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

module.exports = {
    getPublicBranches,
    getAdminBranches,
    createBranch,
    updateBranch,
    deleteBranch
};
