const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: [true, 'Feature key is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[a-z0-9_]+$/, 'Feature key must only contain lowercase alphanumeric characters and underscores']
        },
        name: {
            type: String,
            required: [true, 'Feature name is required'],
            trim: true
        },
        description: {
            type: String,
            default: '',
            trim: true
        },
        category: {
            type: String,
            enum: ['ACADEMIC', 'CONTENT', 'CAREER', 'TOOLS', 'COMMUNITY'],
            default: 'ACADEMIC',
            required: true,
            index: true
        },
        access: {
            type: String,
            enum: ['FREE', 'PLUS', 'DISABLED'],
            default: 'PLUS',
            required: true,
            index: true
        },
        enabled: {
            type: Boolean,
            default: true,
            index: true
        },
        previewEnabled: {
            type: Boolean,
            default: true
        },
        route: {
            type: String,
            default: '',
            trim: true
        },
        order: {
            type: Number,
            default: 0
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: () => ({})
        }
    },
    {
        timestamps: true,
        collection: 'features'
    }
);

featureSchema.index({ key: 1 }, { unique: true });
featureSchema.index({ category: 1, order: 1 });
featureSchema.index({ access: 1 });
featureSchema.index({ enabled: 1 });

const Feature = mongoose.models.Feature || mongoose.model('Feature', featureSchema);

module.exports = Feature;
