const Material = require("../models/Material");
const Document = require("../models/Document");

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

const performMaterialSearch = async (query) => {
    // 1. Synonym Normalization Map
    const synonymMap = {
        "dbms": "database management",
        "database": "database management",
        "os": "operating system",
        "cn": "computer networks",
        "ada": "design and analysis of algorithms",
        "dsa": "data structures",
        "coa": "computer organization",
        "se": "software engineering",
        "pyq": "previous year",
        "pyqs": "previous year",
        "lab": "lab manual",
        "qb": "question bank",
        "notes": "notes",
        "maths": "mathematics",
        "math": "mathematics",
        "1st": "first",
        "2nd": "second",
        "3rd": "third",
        "4th": "fourth"
    };

    // 2. Pre-process query
    let normalizedQuery = query.toLowerCase();
    for (const [key, val] of Object.entries(synonymMap)) {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        normalizedQuery = normalizedQuery.replace(regex, val);
    }

    // Strip special regex characters and punctuation
    let cleanQuery = normalizedQuery.replace(/[^\w\s]/gi, ' ').trim();

    // 3. Filter out conversational stop words
    const stopWords = ['provide','give','show','need','want','get','me','i','can','you','please','for','the','a','an','of','in','on','some','any','all', 'find', 'search'];
    const searchTerms = cleanQuery.split(/\s+/).filter(t => t.length > 1 && !stopWords.includes(t));
    
    let dbQuery = { isApproved: true, isDeleted: false };
    
    if (searchTerms.length > 0) {
        // Must match ALL search terms across ANY of these fields
        dbQuery.$and = searchTerms.map(term => {
            const regex = new RegExp(term, 'i');
            return {
                $or: [
                    { originalName: regex },
                    { fileName: regex },
                    { subjectName: regex },
                    { subjectCode: regex },
                    { documentType: regex },
                    { paperType: regex },
                    { tags: regex },
                    { moduleInfo: regex }
                ]
            };
        });
    } else {
        // Fallback if somehow all words were filtered out
        const regex = new RegExp(cleanQuery, 'i');
        dbQuery.$or = [
            { originalName: regex },
            { subjectName: regex }
        ];
    }

    // Use Document model instead of Material
    let materials = await Document.find(dbQuery).limit(5).sort({ uploadedAt: -1 });

    // Map Document fields to match our frontend MaterialCard expectations
    return materials.map(doc => ({
        _id: doc._id,
        title: doc.originalName || doc.fileName,
        subjectName: doc.subjectName,
        subjectCode: doc.subjectCode,
        documentType: doc.documentType,
        fileUrl: doc.fileUrl,
        tags: doc.tags,
        createdAt: doc.uploadedAt
    }));
};

// Intelligent Material Search for ASK+ Chatbot
const searchMaterials = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const materials = await performMaterialSearch(query);
        res.status(200).json(materials);
    } catch (error) {
        console.error("Error searching materials:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

module.exports = { getMaterials, createMaterial, searchMaterials, performMaterialSearch };
