/**
 * Migration Script: Migrate Verified PLC5 Editorial Content into MongoDB
 * 
 * Migrates the 8 verified frontend PLC5 editorial topics into:
 *   AcademicSubjectCms (Authoritative PLC5 Subject)
 *         │
 *         ▼
 *   CourseModule (basics, module1)
 *         │
 *         ▼
 *   Topic (8 topics)
 *         │
 *         ▼
 *   EditorialContent (8 reading sheets)
 * 
 * Idempotent: Can be run multiple times safely without creating duplicates.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const path = require('path');
const { pathToFileURL } = require('url');

const AcademicSubjectCms = require('../models/AcademicSubject');
const CourseModule = require('../models/CourseModule');
const Topic = require('../models/Topic');
const EditorialContent = require('../models/EditorialContent');

async function migratePlc5Editorial(options = { disconnectOnComplete: true, verbose: true }) {
    const log = (...args) => {
        if (options.verbose) console.log(...args);
    };

    log('====================================================');
    log('STARTING PLC5 EDITORIAL CONTENT MIGRATION (STEP 7)');
    log('====================================================\n');

    // 1. Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not set in environment');
        }
        log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
        log('Connected to MongoDB successfully.\n');
    }

    // 2. Resolve Authoritative PLC5 AcademicSubjectCms
    log('PART 1: Resolving authoritative AcademicSubjectCms record for PLC5...');
    const plcSubjects = await AcademicSubjectCms.find({ code: 'PLC5' }).lean();

    if (plcSubjects.length === 0) {
        throw new Error('MIGRATION HALTED: No AcademicSubjectCms record found for code "PLC5". Cannot proceed safely without authoritative subject.');
    }
    if (plcSubjects.length > 1) {
        throw new Error(`MIGRATION HALTED: Found ${plcSubjects.length} candidate records for code "PLC5". Expected exactly 1. Ambiguity detected.`);
    }

    const authoritativeSubject = plcSubjects[0];
    const academicSubjectId = authoritativeSubject._id;
    log(`Authoritative AcademicSubjectCms identified:`);
    log(`  - _id:  ${academicSubjectId}`);
    log(`  - Code: ${authoritativeSubject.code}`);
    log(`  - Name: ${authoritativeSubject.name}`);
    log(`  - Slug: ${authoritativeSubject.slug}\n`);

    // 3. Load Structured Editorial Content from Frontend Source
    log('PART 2: Loading verified structured editorial content from frontend...');
    const frontendIndexPath = path.resolve(__dirname, '../../frontend/src/data/editorial/plc5/index.js');
    const fileUrl = pathToFileURL(frontendIndexPath).href;
    const plc5Module = await import(fileUrl);

    const sourceTopics = [
        { doc: plc5Module.PLC5_TOPIC_0_1, moduleSlug: 'basics', topicId: '0-1', order: 1 },
        { doc: plc5Module.PLC5_TOPIC_0_2, moduleSlug: 'basics', topicId: '0-2', order: 2 },
        { doc: plc5Module.PLC5_TOPIC_0_3, moduleSlug: 'basics', topicId: '0-3', order: 3 },
        { doc: plc5Module.PLC5_TOPIC_0_4, moduleSlug: 'basics', topicId: '0-4', order: 4 },
        { doc: plc5Module.PLC5_TOPIC_0_5, moduleSlug: 'basics', topicId: '0-5', order: 5 },
        { doc: plc5Module.PLC5_TOPIC_0_6, moduleSlug: 'basics', topicId: '0-6', order: 6 },
        { doc: plc5Module.PLC5_TOPIC_0_7, moduleSlug: 'basics', topicId: '0-7', order: 7 },
        { doc: plc5Module.PLC5_TOPIC_1_1, moduleSlug: 'module1', topicId: '1-1', order: 1 },
        { doc: plc5Module.PLC5_TOPIC_1_2, moduleSlug: 'module1', topicId: '1-2', order: 2 },
        { doc: plc5Module.PLC5_TOPIC_1_4, moduleSlug: 'module1', topicId: '1-4', order: 4 },
        { doc: plc5Module.PLC5_TOPIC_1_5, moduleSlug: 'module1', topicId: '1-5', order: 5 }
    ];

    log(`Loaded ${sourceTopics.length} structured topics from source files.\n`);

    // 4. Create / Upsert CourseModule Documents
    log('PART 3: Upserting CourseModule documents (basics, module1)...');
    const moduleDefinitions = [
        {
            moduleSlug: 'basics',
            moduleNumber: 0,
            title: '0. Basics',
            description: 'Orientation, mindset, and foundational learning strategies for programming.',
            order: 0
        },
        {
            moduleSlug: 'module1',
            moduleNumber: 1,
            title: 'Introduction to C',
            description: 'Computer architecture overview, memory organization, and basic C program structure.',
            order: 1
        }
    ];

    const moduleMap = new Map();
    const moduleStats = { created: 0, updated: 0 };

    for (const modDef of moduleDefinitions) {
        const existing = await CourseModule.findOne({
            academicSubjectId,
            moduleSlug: modDef.moduleSlug
        });

        const courseModule = await CourseModule.findOneAndUpdate(
            { academicSubjectId, moduleSlug: modDef.moduleSlug },
            {
                $set: {
                    academicSubjectId,
                    moduleSlug: modDef.moduleSlug,
                    moduleNumber: modDef.moduleNumber,
                    title: modDef.title,
                    description: modDef.description,
                    order: modDef.order
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (existing) {
            moduleStats.updated++;
            log(`  [UPDATE] CourseModule "${modDef.moduleSlug}" (_id: ${courseModule._id})`);
        } else {
            moduleStats.created++;
            log(`  [CREATE] CourseModule "${modDef.moduleSlug}" (_id: ${courseModule._id})`);
        }

        moduleMap.set(modDef.moduleSlug, courseModule);
    }
    log(`CourseModules complete: ${moduleStats.created} created, ${moduleStats.updated} updated.\n`);

    // 5. Define Complete Topics List (7 Basics + 12 Module 01 topics)
    const editorialBySlug = new Map();
    for (const s of sourceTopics) {
        editorialBySlug.set(`${s.moduleSlug}/${s.doc.topicSlug}`, s);
    }

    const allTopicDefinitions = [
        // 0. Basics (7 topics)
        { moduleSlug: 'basics', topicId: '0-1', topicSlug: 'before-you-start', title: '0.1 Before You Start', displayLabel: '0.1 Before You Start', order: 1 },
        { moduleSlug: 'basics', topicId: '0-2', topicSlug: 'why-programming', title: '0.2 Why Programming?', displayLabel: '0.2 Why Programming?', order: 2 },
        { moduleSlug: 'basics', topicId: '0-3', topicSlug: 'common-myths', title: '0.3 Common Myths', displayLabel: '0.3 Common Myths', order: 3 },
        { moduleSlug: 'basics', topicId: '0-4', topicSlug: 'no-coding-background', title: '0.4 No Coding Background?', displayLabel: '0.4 No Coding Background?', order: 4 },
        { moduleSlug: 'basics', topicId: '0-5', topicSlug: 'how-to-learn', title: '0.5 How to Learn', displayLabel: '0.5 How to Learn', order: 5 },
        { moduleSlug: 'basics', topicId: '0-6', topicSlug: 'how-to-practice', title: '0.6 How to Practice', displayLabel: '0.6 How to Practice', order: 6 },
        { moduleSlug: 'basics', topicId: '0-7', topicSlug: 'using-askursenior', title: '0.7 Using AskUrSenior', displayLabel: '0.7 Using AskUrSenior', order: 7 },
        // M01. Introduction to C (12 topics)
        { moduleSlug: 'module1', topicId: '1-1', topicSlug: 'introduction-to-computers', title: '1.1 Introduction to Computers', displayLabel: '1.1 Introduction to Computers', order: 1 },
        { moduleSlug: 'module1', topicId: '1-2', topicSlug: 'input-and-output-devices', title: '1.2 Input and Output Devices', displayLabel: '1.2 Input and Output Devices', order: 2 },
        { moduleSlug: 'module1', topicId: '1-3', topicSlug: 'designing-efficient-programs', title: '1.3 Designing Efficient Programs', displayLabel: '1.3 Designing Efficient Programs', order: 3 },
        { moduleSlug: 'module1', topicId: '1-4', topicSlug: 'software-basics', title: '1.4 Software Basics', displayLabel: '1.4 Software Basics', order: 4 },
        { moduleSlug: 'module1', topicId: '1-5', topicSlug: 'structure-of-a-c-program', title: '1.5 Structure of a C Program', displayLabel: '1.5 Structure of a C Program', order: 5 },
        { moduleSlug: 'module1', topicId: '1-6', topicSlug: 'files-used-in-c', title: '1.6 Files Used in C', displayLabel: '1.6 Files Used in C', order: 6 },
        { moduleSlug: 'module1', topicId: '1-7', topicSlug: 'compilers', title: '1.7 Compilers', displayLabel: '1.7 Compilers', order: 7 },
        { moduleSlug: 'module1', topicId: '1-8', topicSlug: 'compiling-and-executing-c', title: '1.8 Compiling and Executing C', displayLabel: '1.8 Compiling and Executing C', order: 8 },
        { moduleSlug: 'module1', topicId: '1-9', topicSlug: 'variables', title: '1.9 Variables', displayLabel: '1.9 Variables', order: 9 },
        { moduleSlug: 'module1', topicId: '1-10', topicSlug: 'constants', title: '1.10 Constants', displayLabel: '1.10 Constants', order: 10 },
        { moduleSlug: 'module1', topicId: '1-11', topicSlug: 'data-types', title: '1.11 Data Types', displayLabel: '1.11 Data Types', order: 11 },
        { moduleSlug: 'module1', topicId: '1-12', topicSlug: 'input-and-output', title: '1.12 Input and Output', displayLabel: '1.12 Input and Output', order: 12 }
    ];

    log(`PART 4 & 5: Upserting all ${allTopicDefinitions.length} Topics and available EditorialContent documents...`);
    const topicStats = { created: 0, updated: 0 };
    const editorialStats = { created: 0, updated: 0 };
    const migratedRecords = [];

    for (const tDef of allTopicDefinitions) {
        const { moduleSlug, topicId, topicSlug, title, displayLabel, order } = tDef;
        const parentModule = moduleMap.get(moduleSlug);

        if (!parentModule) {
            throw new Error(`Parent CourseModule "${moduleSlug}" not found for topic "${topicSlug}".`);
        }

        // Mandatory Invariant Check: Topic.academicSubjectId === CourseModule.academicSubjectId
        if (academicSubjectId.toString() !== parentModule.academicSubjectId.toString()) {
            throw new Error(`CONSISTENCY VIOLATION: Academic subject ID mismatch between Topic and CourseModule.`);
        }

        const editorialSource = editorialBySlug.get(`${moduleSlug}/${topicSlug}`);
        const hasEditorial = !!editorialSource;

        if (hasEditorial) {
            // Validate content blocks before writing anything
            const isValid = EditorialContent.validateEditorialBlocks(editorialSource.doc.blocks);
            if (!isValid) {
                throw new Error(`VALIDATION FAILURE: Editorial blocks for topic "${topicSlug}" failed schema validation.`);
            }
        }

        // Upsert Topic
        const existingTopic = await Topic.findOne({
            moduleId: parentModule._id,
            topicSlug
        });

        const topicDoc = await Topic.findOneAndUpdate(
            { moduleId: parentModule._id, topicSlug },
            {
                $set: {
                    academicSubjectId,
                    moduleId: parentModule._id,
                    subjectSlug: 'plc5',
                    moduleSlug,
                    topicSlug,
                    topicId,
                    title: (editorialSource?.doc?.title) || title,
                    displayLabel: (editorialSource?.doc?.displayLabel) || displayLabel,
                    order,
                    estimatedMinutes: editorialSource?.doc?.estimatedMinutes || 10,
                    status: 'Published',
                    hasEditorial,
                    hasPyq: false,
                    hasLab: false
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (existingTopic) {
            topicStats.updated++;
        } else {
            topicStats.created++;
            log(`  [CREATE] Topic "${topicSlug}" (_id: ${topicDoc._id}) under "${moduleSlug}"`);
        }

        // If this topic has verified editorial content, upsert EditorialContent
        if (hasEditorial) {
            const { doc } = editorialSource;
            const existingEditorial = await EditorialContent.findOne({ topicId: topicDoc._id });

            const editorialDoc = await EditorialContent.findOneAndUpdate(
                { topicId: topicDoc._id },
                {
                    $set: {
                        topicId: topicDoc._id,
                        subjectSlug: 'plc5',
                        moduleSlug,
                        topicSlug,
                        title: doc.title,
                        version: 1,
                        status: 'Published',
                        sections: doc.sections || [],
                        blocks: doc.blocks || [],
                        publishedAt: new Date()
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            if (existingEditorial) {
                editorialStats.updated++;
                log(`  [UPSERT] Topic "${topicSlug}" (_id: ${topicDoc._id}) → EditorialContent (_id: ${editorialDoc._id})`);
            } else {
                editorialStats.created++;
                log(`  [INSERT] Topic "${topicSlug}" (_id: ${topicDoc._id}) → EditorialContent (_id: ${editorialDoc._id})`);
            }

            migratedRecords.push({
                topicSlug,
                topicIdStr: topicId,
                topicDocId: topicDoc._id,
                moduleSlug,
                moduleId: parentModule._id,
                editorialDocId: editorialDoc._id
            });
        }
    }

    log(`\nTopics complete: ${topicStats.created} created, ${topicStats.updated} updated.`);
    log(`EditorialContents complete: ${editorialStats.created} created, ${editorialStats.updated} updated.\n`);

    // 6. Post-Migration Integrity Verification
    log('PART 9: Running post-migration database verification...');
    const verifiedModules = await CourseModule.find({ academicSubjectId }).lean();
    const verifiedTopics = await Topic.find({ academicSubjectId }).lean();
    const verifiedTopicIds = verifiedTopics.map(t => t._id);
    const verifiedEditorials = await EditorialContent.find({ topicId: { $in: verifiedTopicIds } }).lean();

    log(`Verification Counts:`);
    log(`  - PLC5 CourseModules in DB: ${verifiedModules.length} (Expected: 2)`);
    log(`  - PLC5 Topics in DB:        ${verifiedTopics.length} (Expected: ${allTopicDefinitions.length})`);
    log(`  - PLC5 Editorials in DB:     ${verifiedEditorials.length} (Expected: ${sourceTopics.length})`);

    if (verifiedModules.length !== 2) {
        throw new Error(`VERIFICATION FAILED: Expected 2 CourseModules, found ${verifiedModules.length}`);
    }
    if (verifiedTopics.length !== allTopicDefinitions.length) {
        throw new Error(`VERIFICATION FAILED: Expected ${allTopicDefinitions.length} Topics, found ${verifiedTopics.length}`);
    }
    if (verifiedEditorials.length !== sourceTopics.length) {
        throw new Error(`VERIFICATION FAILED: Expected ${sourceTopics.length} EditorialContents, found ${verifiedEditorials.length}`);
    }

    // Verify all invariant mappings
    for (const vt of verifiedTopics) {
        const vm = verifiedModules.find(m => m._id.toString() === vt.moduleId.toString());
        if (!vm) {
            throw new Error(`VERIFICATION FAILED: Topic ${vt.topicSlug} points to non-existent module ${vt.moduleId}`);
        }
        if (vt.academicSubjectId.toString() !== vm.academicSubjectId.toString()) {
            throw new Error(`VERIFICATION FAILED: Subject ID mismatch on topic ${vt.topicSlug}`);
        }
        if (vt.hasEditorial) {
            const ve = verifiedEditorials.find(e => e.topicId.toString() === vt._id.toString());
            if (!ve) {
                throw new Error(`VERIFICATION FAILED: Missing EditorialContent for topic ${vt.topicSlug}`);
            }
            if (ve.blocks.length === 0) {
                throw new Error(`VERIFICATION FAILED: Empty editorial blocks for topic ${vt.topicSlug}`);
            }
        }
    }

    log('\n====================================================');
    log('PLC5 MIGRATION & POST-VERIFICATION SUCCESSFUL (100%)');
    log('====================================================\n');

    const summary = {
        academicSubjectId: academicSubjectId.toString(),
        modulesCount: verifiedModules.length,
        topicsCount: verifiedTopics.length,
        editorialCount: verifiedEditorials.length,
        modules: verifiedModules.map(m => ({ _id: m._id.toString(), moduleSlug: m.moduleSlug, order: m.order })),
        topics: verifiedTopics.map(t => ({ _id: t._id.toString(), topicSlug: t.topicSlug, topicId: t.topicId, moduleId: t.moduleId.toString() })),
        editorials: verifiedEditorials.map(e => ({ _id: e._id.toString(), topicId: e.topicId.toString(), sections: e.sections.length, blocks: e.blocks.length })),
        stats: {
            modules: moduleStats,
            topics: topicStats,
            editorials: editorialStats
        }
    };

    if (options.disconnectOnComplete) {
        await mongoose.disconnect();
        log('MongoDB disconnected cleanly.');
    }

    return summary;
}

if (require.main === module) {
    migratePlc5Editorial({ disconnectOnComplete: true, verbose: true })
        .then(() => process.exit(0))
        .catch(err => {
            console.error('\nMIGRATION ERROR:', err.message);
            process.exit(1);
        });
}

module.exports = migratePlc5Editorial;
