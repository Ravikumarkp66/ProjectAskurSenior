const Material = require("../models/Material");

// Get materials with search and filter
const getMaterials = async (req, res) => {
    try {
        const { search, semester, subjectCode, documentType, year } = req.query;
        let query = {};
        
        if (search) {
            // Text search
            query.$text = { $search: search.toLowerCase() };
        }
        
        if (semester) query.semester = parseInt(semester);
        if (subjectCode) query.subjectCode = new RegExp(subjectCode, 'i');
        if (documentType) query.documentType = new RegExp(documentType, 'i');
        if (year) query.year = parseInt(year);

        const materials = await Material.find(query)
            .sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 });

        res.status(200).json(materials);
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

// Create new material (Admin/Upload flow)
const createMaterial = async (req, res) => {
    try {
        const data = req.body;
        
        // Convert fields to lowercase as per requirements for better searching
        if (data.title) data.title = data.title.toLowerCase();
        if (data.subjectName) data.subjectName = data.subjectName.toLowerCase();
        if (data.subjectCode) data.subjectCode = data.subjectCode.toLowerCase();
        if (data.documentType) data.documentType = data.documentType.toLowerCase();
        if (data.paperType) data.paperType = data.paperType.toLowerCase();
        if (data.tags && Array.isArray(data.tags)) {
            data.tags = data.tags.map(t => t.toLowerCase());
        }

        const newMaterial = new Material(data);
        await newMaterial.save();
        res.status(201).json(newMaterial);
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

module.exports = { getMaterials, createMaterial };
