const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            "UPGRADED_TO_ASKPLUS",
            "DOWNGRADED_TO_FREE",
            "SUSPENDED_USER",
            "ACTIVATED_USER",
            "RESET_USER_ROLE",
            "PAYMENT_APPROVED",
            "PAYMENT_REJECTED",
            "MANUAL_PLAN_CHANGE",
            "PAYMENT_RECORD_DELETED"
        ]
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("AdminLog", adminLogSchema);
