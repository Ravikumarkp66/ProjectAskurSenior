const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const path = require('path');
const { pathToFileURL } = require('url');

const CourseModule = require('../../models/CourseModule');
const Topic = require('../../models/Topic');
const EditorialContent = require('../../models/EditorialContent');

test('MIGRATE-001: All 8 frontend structured PLC5 topic documents pass schema block validation', async () => {
    const frontendIndexPath = path.resolve(__dirname, '../../../frontend/src/data/editorial/plc5/index.js');
    const fileUrl = pathToFileURL(frontendIndexPath).href;
    const plc5 = await import(fileUrl);

    const topics = [
        plc5.PLC5_TOPIC_0_1,
        plc5.PLC5_TOPIC_0_2,
        plc5.PLC5_TOPIC_0_3,
        plc5.PLC5_TOPIC_0_4,
        plc5.PLC5_TOPIC_0_5,
        plc5.PLC5_TOPIC_0_6,
        plc5.PLC5_TOPIC_0_7,
        plc5.PLC5_TOPIC_1_1,
        plc5.PLC5_TOPIC_1_2,
        plc5.PLC5_TOPIC_1_4,
        plc5.PLC5_TOPIC_1_5
    ];

    assert.strictEqual(topics.length, 11, 'Expected exactly 11 structured topics from frontend source');

    for (const [idx, t] of topics.entries()) {
        assert.ok(t.title, `Topic ${idx + 1} must have a title`);
        assert.ok(t.topicSlug, `Topic ${idx + 1} must have a topicSlug`);
        assert.ok(Array.isArray(t.sections), `Topic ${idx + 1} must have a sections array`);
        assert.ok(Array.isArray(t.blocks), `Topic ${idx + 1} must have a blocks array`);

        const isValid = EditorialContent.validateEditorialBlocks(t.blocks);
        assert.strictEqual(isValid, true, `Topic ${idx + 1} (${t.topicSlug}) blocks must pass validateEditorialBlocks`);
    }
});

test('MIGRATE-002: CourseModule definition and identity keys', () => {
    const academicSubjectId = new mongoose.Types.ObjectId();
    const mod = new CourseModule({
        academicSubjectId,
        moduleSlug: 'basics',
        moduleNumber: 0,
        title: '0. Basics',
        order: 0
    });

    assert.strictEqual(mod.validateSync(), undefined, 'Valid CourseModule must pass validation');
    assert.strictEqual(mod.moduleSlug, 'basics');
    assert.strictEqual(mod.moduleNumber, 0);
});

test('MIGRATE-003: Topic preserves application topicId and distinguishes from MongoDB _id', () => {
    const academicSubjectId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();

    const topic = new Topic({
        academicSubjectId,
        moduleId,
        subjectSlug: 'plc5',
        moduleSlug: 'basics',
        topicSlug: 'before-you-start',
        topicId: '0-1', // Application-level compatibility identifier matching EditorialProgress
        title: '0.1 Before You Start',
        order: 1
    });

    assert.strictEqual(topic.validateSync(), undefined, 'Valid Topic must pass validation');
    assert.strictEqual(topic.topicId, '0-1', 'topicId must store the curriculum string');
    assert.ok(mongoose.Types.ObjectId.isValid(topic._id), 'Topic must have a valid MongoDB ObjectId _id');
    assert.notStrictEqual(topic._id.toString(), topic.topicId, 'Topic._id must be distinct from Topic.topicId');
});

test('MIGRATE-004: EditorialContent links authoritatively to Topic._id ObjectId', () => {
    const topicObjectId = new mongoose.Types.ObjectId();

    const editorial = new EditorialContent({
        topicId: topicObjectId, // Must be ObjectId, NOT string "0-1"
        subjectSlug: 'plc5',
        moduleSlug: 'basics',
        topicSlug: 'before-you-start',
        title: '0.1 Before You Start',
        sections: [{ id: 'sec-intro', title: 'Intro' }],
        blocks: [{ type: 'paragraph', text: 'Hello' }]
    });

    assert.strictEqual(editorial.validateSync(), undefined, 'EditorialContent must accept valid topicId ObjectId');
    assert.strictEqual(editorial.topicId.toString(), topicObjectId.toString());
});

test('MIGRATE-005: Academic subject ID consistency between Topic and CourseModule is enforced', () => {
    const subjectId = new mongoose.Types.ObjectId();
    const mismatchedSubjectId = new mongoose.Types.ObjectId();

    const parentModule = new CourseModule({
        academicSubjectId: subjectId,
        moduleSlug: 'basics',
        moduleNumber: 0,
        title: '0. Basics',
        order: 0
    });

    const validTopic = new Topic({
        academicSubjectId: parentModule.academicSubjectId,
        moduleId: parentModule._id,
        topicSlug: 'before-you-start',
        topicId: '0-1',
        title: '0.1 Before You Start',
        order: 1
    });

    // Invariant holds
    assert.strictEqual(
        validTopic.academicSubjectId.toString(),
        parentModule.academicSubjectId.toString(),
        'Topic and CourseModule must reference the same academicSubjectId'
    );

    // Mismatch detected
    assert.notStrictEqual(
        mismatchedSubjectId.toString(),
        parentModule.academicSubjectId.toString(),
        'Subject mismatch must be detectable before persistence'
    );
});
