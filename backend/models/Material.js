const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subjectName: { type: String, required: true },
    subjectCode: { type: String, required: true },
    semester: { type: Number, required: true },
    year: { type: Number, required: true },
    documentType: { type: String, required: true }, // Notes, PYQ, Test-01, etc.
    paperType: { type: String, required: true },
    tags: { type: [String], default: [] },
    fileUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Create text index for search
materialSchema.index({
    title: "text",
    subjectName: "text",
    subjectCode: "text",
    documentType: "text",
    paperType: "text",
    tags: "text"
});

module.exports = mongoose.model("Material", materialSchema);
