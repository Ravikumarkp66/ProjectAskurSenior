const Program = require('../models/Program');
const Branch = require('../models/CmsBranch');
const Semester = require('../models/Semester');
const MaterialType = require('../models/MaterialType');
const Scheme = require('../models/Scheme');

// GET /api/lookups/programs
const getPrograms = async (req, res) => {
    try {
        const programs = await Program.find({ status: 'Active' }).sort({ displayOrder: 1, name: 1 });
        res.status(200).json(programs);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/lookups/branches
const getBranches = async (req, res) => {
    try {
        const { programId } = req.query;
        const filter = { status: 'Active' };
        if (programId) filter.program = programId;

        const branches = await Branch.find(filter)
            .populate('program', 'name shortName')
            .sort({ displayOrder: 1, name: 1 });
        res.status(200).json(branches);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/lookups/semesters
const getSemesters = async (req, res) => {
    try {
        const { programId } = req.query;
        const filter = {};
        if (programId) filter.program = programId;

        const semesters = await Semester.find(filter)
            .populate('program', 'name shortName')
            .sort({ number: 1 });
        res.status(200).json(semesters);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/lookups/material-types
const getMaterialTypes = async (req, res) => {
    try {
        const materialTypes = await MaterialType.find().sort({ displayOrder: 1, name: 1 });
        res.status(200).json(materialTypes);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// GET /api/lookups/schemes
const getSchemes = async (req, res) => {
    try {
        const schemes = await Scheme.find().sort({ name: 1 });
        res.status(200).json(schemes);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

module.exports = { getPrograms, getBranches, getSemesters, getMaterialTypes, getSchemes };
