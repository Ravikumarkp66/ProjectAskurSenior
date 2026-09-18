const mongoose = require('mongoose');

/**
 * Supported semantic block types strictly aligned with frontend contentModel.js (Step 1/2)
 * Note: New types such as "image" and "table" should be added here only after the frontend
 * EditorialRenderer implements corresponding presentation components.
 */
const SUPPORTED_BLOCK_TYPES = new Set([
    'heading',
    'paragraph',
    'list',
    'blockquote',
    'code',
    'preformatted',
    'formula',
    'divider',
    'callout'
]);

/**
 * Prohibited keys that represent React, JSX, or browser UI concerns
 */
const PROHIBITED_KEYS = new Set([
    '$$typeof',
    '_owner',
    'props',
    'children',
    'className',
    'theme',
    'textColor',
    'bgColor',
    'onClick',
    'onChange',
    'onSubmit',
    'onKeyDown',
    'ref'
]);

/**
 * Verifies that a value is strictly JSON-serializable and contains no functions,
 * React elements, or UI runtime bindings.
 */
function isPlainSerializable(val, depth = 0) {
    if (depth > 20) return false;
    if (val === null || val === undefined) return true;
    const t = typeof val;
    if (t === 'function' || t === 'symbol') return false;
    if (t === 'string' || t === 'number' || t === 'boolean') return true;
    if (Array.isArray(val)) {
        return val.every(item => isPlainSerializable(item, depth + 1));
    }
    if (t === 'object') {
        // Reject React element objects or non-plain object prototypes
        if (val.$$typeof || val._owner || (val.constructor && val.constructor.name !== 'Object')) {
            return false;
        }
        // Reject inline CSS style objects (e.g. style: { color: 'red' })
        if (val.style && typeof val.style === 'object') {
            return false;
        }
        for (const key of Object.keys(val)) {
            if (PROHIBITED_KEYS.has(key)) return false;
            if (typeof val[key] === 'function') return false;
            if (!isPlainSerializable(val[key], depth + 1)) return false;
        }
        return true;
    }
    return false;
}

/**
 * Application-level validator for editorial content blocks array.
 * Enforces semantic consistency, JSON serializability, and rejects UI/React leakage.
 */
function validateEditorialBlocks(blocks) {
    if (!Array.isArray(blocks)) {
        return false;
    }

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (!block || typeof block !== 'object' || Array.isArray(block)) {
            return false;
        }

        if (!block.type || !SUPPORTED_BLOCK_TYPES.has(block.type)) {
            return false;
        }

        if (!isPlainSerializable(block)) {
            return false;
        }

        // Structural verification per block type
        switch (block.type) {
            case 'heading':
                if (typeof block.text !== 'string' || !block.text.trim()) return false;
                if (block.level && ![1, 2, 3, 4].includes(block.level)) return false;
                break;
            case 'paragraph':
                if (typeof block.text !== 'string') return false;
                break;
            case 'list':
                if (!Array.isArray(block.items) || block.items.length === 0) return false;
                if (block.style && !['bullet', 'ordered'].includes(block.style)) return false;
                break;
            case 'blockquote':
                if (typeof block.text !== 'string') return false;
                break;
            case 'code':
                if (typeof block.code !== 'string') return false;
                break;
            case 'preformatted':
                if (typeof block.text !== 'string') return false;
                break;
            case 'formula':
                if (typeof block.formula !== 'string') return false;
                break;
            case 'divider':
                break;
            case 'callout':
                if (typeof block.text !== 'string') return false;
                if (block.tone && !['info', 'tip', 'warning', 'success'].includes(block.tone)) return false;
                break;
            default:
                return false;
        }
    }

    return true;
}

const sectionItemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, 'Section anchor ID is required'],
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Section anchor title is required'],
        trim: true
    }
}, { _id: false });

/**
 * EditorialContent Schema
 * 
 * Represents the rich structured educational reading sheet for a Topic.
 * 
 * CRITICAL IDENTIFIER DISTINCTION:
 * - `topicId` (ObjectId): Relational foreign key referencing `Topic._id` (the MongoDB ObjectId primary key).
 *   This is NOT the string `Topic.topicId` (which stores application-level labels like "topic-0.1").
 * 
 * Contains pure JSON-serializable semantic blocks consumed directly by EditorialRenderer.
 */
const editorialContentSchema = new mongoose.Schema({
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: [true, 'Topic reference is required (must reference Topic._id ObjectId)'],
        unique: true,
        index: true
    },
    subjectSlug: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    moduleSlug: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    topicSlug: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    title: {
        type: String,
        required: [true, 'Editorial title is required'],
        trim: true
    },
    version: {
        type: Number,
        default: 1,
        min: [1, 'Version must be at least 1']
    },
    status: {
        type: String,
        enum: {
            values: ['Draft', 'Published', 'Archived'],
            message: '{VALUE} is not a supported editorial status'
        },
        default: 'Published'
    },
    sections: {
        type: [sectionItemSchema],
        default: []
    },
    blocks: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
        validate: {
            validator: validateEditorialBlocks,
            message: 'Invalid editorial blocks: must contain supported block types, valid structure, and no UI/React runtime artifacts'
        }
    },
    publishedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'editorial_contents'
});

// Indexes
// Ensures topicId is uniquely mapped to one EditorialContent document
editorialContentSchema.index({ topicId: 1 }, { unique: true });

// Secondary lookup index for fast slug-based read queries
editorialContentSchema.index({ subjectSlug: 1, moduleSlug: 1, topicSlug: 1 });

const EditorialContent = mongoose.models.EditorialContent || mongoose.model('EditorialContent', editorialContentSchema);
EditorialContent.validateEditorialBlocks = validateEditorialBlocks;
EditorialContent.SUPPORTED_BLOCK_TYPES = SUPPORTED_BLOCK_TYPES;

module.exports = EditorialContent;
