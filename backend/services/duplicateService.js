const AcademicMaterial = require('../models/AcademicMaterial');

/**
 * Normalizes a filename for duplicate comparison:
 * - Converts to lowercase.
 * - Removes extension (e.g. .pdf).
 * - Strips all spaces, underscores, and hyphens.
 */
const normalizeName = (name) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/\.[^/.]+$/, '') // remove extension
        .replace(/[\s\-_]/g, ''); // strip spaces, underscores, hyphens
};

/**
 * Detects potential duplicate groups dynamically.
 * Returns an array of groups: { groupId, matchType, materials: [...] }
 */
const detectDuplicates = async () => {
    // Only scan active, published materials (not hidden/trash, not ignored)
    const materials = await AcademicMaterial.find({
        status: { $ne: 'Hidden' },
        deletedAt: null,
        ignoredDuplicate: { $ne: true }
    })
    .populate({
        path: 'subject',
        select: 'name code year credits',
        populate: [
            { path: 'branch', select: 'shortName name' },
            { path: 'scheme', select: 'name' }
        ]
    })
    .populate('uploadedBy', 'name email')
    .lean();

    const hashGroups = {};
    const metaGroups = {};

    // Group materials
    materials.forEach(m => {
        // 1. Group by SHA-256 hash (Priority 1)
        if (m.fileHash) {
            if (!hashGroups[m.fileHash]) hashGroups[m.fileHash] = [];
            hashGroups[m.fileHash].push(m);
        }

        // 2. Group by Subject + Type + Normalized Filename + File Size (Priority 2)
        const subId = m.subject?._id ? m.subject._id.toString() : 'common';
        const normName = normalizeName(m.originalFileName || m.title);
        const metaKey = `${subId}_${m.materialType || 'Others'}_${normName}_${m.fileSize || 0}`;

        if (!metaGroups[metaKey]) metaGroups[metaKey] = [];
        metaGroups[metaKey].push(m);
    });

    const finalGroups = [];
    const processedIds = new Set();
    let groupIdx = 0;

    // Process hash groups (Priority 1: Confirmed duplicates)
    Object.keys(hashGroups).forEach(hash => {
        const groupItems = hashGroups[hash];
        if (groupItems.length > 1) {
            groupIdx++;
            const groupId = `dup_hash_${groupIdx}`;
            groupItems.forEach(item => processedIds.add(item._id.toString()));
            finalGroups.push({
                groupId,
                matchType: 'Hash Match (Confirmed)',
                materials: groupItems
            });
        }
    });

    // Process metadata groups (Priority 2: Possible duplicates)
    Object.keys(metaGroups).forEach(key => {
        const groupItems = metaGroups[key];
        // Filter out items already matched in Hash groups
        const remainingItems = groupItems.filter(item => !processedIds.has(item._id.toString()));
        if (remainingItems.length > 1) {
            groupIdx++;
            const groupId = `dup_meta_${groupIdx}`;
            remainingItems.forEach(item => processedIds.add(item._id.toString()));
            finalGroups.push({
                groupId,
                matchType: 'Metadata Match (Possible)',
                materials: remainingItems
            });
        }
    });

    return finalGroups;
};

module.exports = {
    normalizeName,
    detectDuplicates
};
