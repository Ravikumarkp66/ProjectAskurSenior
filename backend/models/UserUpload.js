const mongoose = require("mongoose");

const userUploadSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    subjectCode: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        required: true,
        enum: ["notes", "pyqs", "questionBanks", "syllabus", "resources"]
    },
    fileKey: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        default: "pdf"
    },
    tags: {
        type: [String],
        default: []
    },
    originalFileName: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("UserUpload", userUploadSchema);
