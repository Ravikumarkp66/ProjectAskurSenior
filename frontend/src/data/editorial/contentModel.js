/**
 * Editorial Content Model Specification
 * 
 * Provides a structured, data-driven representation of educational editorial content,
 * decoupling content from React JSX markup. Designed for seamless persistence
 * in JSON documents and eventual migration to MongoDB.
 * 
 * Content Hierarchy:
 * Subject (e.g. 'plc5')
 *   └── Module (e.g. 'basics', 'module-1')
 *         └── Topic (e.g. 'before-you-start', 'introduction-to-computers')
 *               └── EditorialDocument
 *                     ├── metadata (title, subjectSlug, moduleSlug, topicSlug, breadcrumbs)
 *                     ├── sections (TOC anchors)
 *                     └── blocks [ { type: 'heading' | 'paragraph' | ... }, ... ]
 */

export const BLOCK_TYPES = {
    HEADING: 'heading',
    PARAGRAPH: 'paragraph',
    LIST: 'list',
    BLOCKQUOTE: 'blockquote',
    CODE: 'code',
    PREFORMATTED: 'preformatted',
    FORMULA: 'formula',
    DIVIDER: 'divider',
    CALLOUT: 'callout'
};

/**
 * Validates a structured editorial document against the content model.
 * 
 * @param {Object} doc - The editorial document object.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEditorialDocument(doc) {
    const errors = [];

    if (!doc || typeof doc !== 'object') {
        return { valid: false, errors: ['Document must be an object'] };
    }

    if (!doc.title || typeof doc.title !== 'string') {
        errors.push('Document must have a valid title string');
    }

    if (!Array.isArray(doc.blocks)) {
        errors.push('Document must have a blocks array');
        return { valid: false, errors };
    }

    const validTypes = new Set(Object.values(BLOCK_TYPES));

    doc.blocks.forEach((block, idx) => {
        if (!block || typeof block !== 'object') {
            errors.push(`Block at index ${idx} must be an object`);
            return;
        }

        if (!block.type || !validTypes.has(block.type)) {
            errors.push(`Block at index ${idx} has invalid or missing type: "${block.type}"`);
            return;
        }

        switch (block.type) {
            case BLOCK_TYPES.HEADING:
                if (!block.text) errors.push(`Heading block at index ${idx} must have text`);
                if (block.level && ![1, 2, 3, 4].includes(block.level)) {
                    errors.push(`Heading level at index ${idx} must be 1, 2, 3, or 4`);
                }
                break;

            case BLOCK_TYPES.PARAGRAPH:
                if (block.text === undefined || block.text === null) {
                    errors.push(`Paragraph block at index ${idx} must have text`);
                }
                break;

            case BLOCK_TYPES.LIST:
                if (!Array.isArray(block.items) || block.items.length === 0) {
                    errors.push(`List block at index ${idx} must have a non-empty items array`);
                }
                break;

            case BLOCK_TYPES.BLOCKQUOTE:
                if (!block.text) errors.push(`Blockquote at index ${idx} must have text`);
                break;

            case BLOCK_TYPES.CODE:
                if (typeof block.code !== 'string') {
                    errors.push(`Code block at index ${idx} must have code string`);
                }
                break;

            case BLOCK_TYPES.PREFORMATTED:
                if (typeof block.text !== 'string') {
                    errors.push(`Preformatted block at index ${idx} must have text string`);
                }
                break;

            case BLOCK_TYPES.FORMULA:
                if (typeof block.formula !== 'string') {
                    errors.push(`Formula block at index ${idx} must have formula string`);
                }
                break;

            case BLOCK_TYPES.DIVIDER:
                // No mandatory attributes
                break;

            case BLOCK_TYPES.CALLOUT:
                if (!block.text) errors.push(`Callout block at index ${idx} must have text`);
                break;

            default:
                break;
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Derives Table of Contents (TOC) section anchors from document heading blocks
 * if not explicitly specified.
 * 
 * @param {Array<Object>} blocks - List of editorial blocks
 * @returns {Array<{ id: string, title: string }>}
 */
export function extractSectionsFromBlocks(blocks = []) {
    if (!Array.isArray(blocks)) return [];

    return blocks
        .filter(b => b.type === BLOCK_TYPES.HEADING && (b.level === 1 || b.level === 2))
        .map(b => {
            const id = b.id || b.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return {
                id,
                title: b.tocTitle || b.text
            };
        });
}
