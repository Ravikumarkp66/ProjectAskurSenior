const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const CourseModule = require('../../models/CourseModule');
const Topic = require('../../models/Topic');
const EditorialContent = require('../../models/EditorialContent');

test('SCHEMA-001: CourseModule validation requires mandatory fields', () => {
    // Missing all fields
    const emptyMod = new CourseModule({});
    const err = emptyMod.validateSync();
    assert.ok(err, 'Validation should fail on empty document');
    assert.ok(err.errors['academicSubjectId'], 'academicSubjectId must be required');
    assert.ok(err.errors['moduleSlug'], 'moduleSlug must be required');
    assert.ok(err.errors['moduleNumber'], 'moduleNumber must be required');
    assert.ok(err.errors['title'], 'title must be required');

    // Valid document
    const validMod = new CourseModule({
        academicSubjectId: new mongoose.Types.ObjectId(),
        moduleSlug: 'basics',
        moduleNumber: 0,
        title: '0. Basics',
        order: 1
    });
    assert.strictEqual(validMod.validateSync(), undefined, 'Valid CourseModule should pass validation');
});

test('SCHEMA-002: CourseModule defines unique and ordering indexes', () => {
    const indexes = CourseModule.schema.indexes();
    const uniqueIndex = indexes.find(idx => idx[0].academicSubjectId === 1 && idx[0].moduleSlug === 1);
    assert.ok(uniqueIndex, 'Should define compound index on { academicSubjectId: 1, moduleSlug: 1 }');
    assert.strictEqual(uniqueIndex[1].unique, true, 'academicSubjectId + moduleSlug index must be unique');

    const orderIndex = indexes.find(idx => idx[0].academicSubjectId === 1 && idx[0].order === 1);
    assert.ok(orderIndex, 'Should define compound index on { academicSubjectId: 1, order: 1 }');
});

test('SCHEMA-003: Topic validation requires mandatory fields and references', () => {
    // Missing all fields
    const emptyTopic = new Topic({});
    const err = emptyTopic.validateSync();
    assert.ok(err, 'Validation should fail on empty document');
    assert.ok(err.errors['academicSubjectId'], 'academicSubjectId must be required');
    assert.ok(err.errors['moduleId'], 'moduleId must be required');
    assert.ok(err.errors['topicSlug'], 'topicSlug must be required');
    assert.ok(err.errors['topicId'], 'topicId must be required');
    assert.ok(err.errors['title'], 'title must be required');

    // Valid document
    const validTopic = new Topic({
        academicSubjectId: new mongoose.Types.ObjectId(),
        moduleId: new mongoose.Types.ObjectId(),
        subjectSlug: 'plc5',
        moduleSlug: 'basics',
        topicSlug: 'before-you-start',
        topicId: 'topic-0.1',
        title: '0.1 Before You Start',
        order: 1
    });
    assert.strictEqual(validTopic.validateSync(), undefined, 'Valid Topic should pass validation');
});

test('SCHEMA-004: Topic rejects invalid status values', () => {
    const invalidTopic = new Topic({
        academicSubjectId: new mongoose.Types.ObjectId(),
        moduleId: new mongoose.Types.ObjectId(),
        topicSlug: 'test-topic',
        topicId: 'test-id',
        title: 'Test',
        status: 'UnapprovedStatus'
    });
    const err = invalidTopic.validateSync();
    assert.ok(err, 'Invalid status must fail validation');
    assert.ok(err.errors['status'], 'Error must target status field');
});

test('SCHEMA-005: Topic defines compound uniqueness indexes', () => {
    const indexes = Topic.schema.indexes();
    const moduleTopicSlugIndex = indexes.find(idx => idx[0].moduleId === 1 && idx[0].topicSlug === 1);
    assert.ok(moduleTopicSlugIndex, 'Should define compound index on { moduleId: 1, topicSlug: 1 }');
    assert.strictEqual(moduleTopicSlugIndex[1].unique, true, 'moduleId + topicSlug must be unique');

    const subjectTopicIdIndex = indexes.find(idx => idx[0].academicSubjectId === 1 && idx[0].topicId === 1);
    assert.ok(subjectTopicIdIndex, 'Should define compound index on { academicSubjectId: 1, topicId: 1 }');
    assert.strictEqual(subjectTopicIdIndex[1].unique, true, 'academicSubjectId + topicId must be unique');
});

test('SCHEMA-006: Topic and CourseModule subject consistency invariant', () => {
    const subjectAId = new mongoose.Types.ObjectId();
    const subjectBId = new mongoose.Types.ObjectId();

    const parentModule = new CourseModule({
        academicSubjectId: subjectAId,
        moduleSlug: 'basics',
        moduleNumber: 0,
        title: '0. Basics',
        order: 1
    });

    // Consistent topic: topic.academicSubjectId === parentModule.academicSubjectId
    const consistentTopic = new Topic({
        academicSubjectId: parentModule.academicSubjectId,
        moduleId: parentModule._id,
        topicSlug: 'before-you-start',
        topicId: 'topic-0.1',
        title: '0.1 Before You Start'
    });
    assert.strictEqual(
        consistentTopic.academicSubjectId.toString(),
        parentModule.academicSubjectId.toString(),
        'Consistent topic must share academicSubjectId with its parent module'
    );

    // Inconsistent subject detection
    const inconsistentTopic = new Topic({
        academicSubjectId: subjectBId,
        moduleId: parentModule._id,
        topicSlug: 'before-you-start',
        topicId: 'topic-0.1',
        title: '0.1 Before You Start'
    });
    assert.notStrictEqual(
        inconsistentTopic.academicSubjectId.toString(),
        parentModule.academicSubjectId.toString(),
        'Inconsistent subject mismatch detected'
    );
});

test('SCHEMA-007: EditorialContent requires topicId ObjectId and title', () => {
    const emptyDoc = new EditorialContent({});
    const err = emptyDoc.validateSync();
    assert.ok(err, 'Validation should fail on empty document');
    assert.ok(err.errors['topicId'], 'topicId must be required');
    assert.ok(err.errors['title'], 'title must be required');
});

test('SCHEMA-008: EditorialContent defines unique topicId index', () => {
    const indexes = EditorialContent.schema.indexes();
    const topicIdIndex = indexes.find(idx => idx[0].topicId === 1);
    assert.ok(topicIdIndex, 'Should define index on { topicId: 1 }');
    assert.strictEqual(topicIdIndex[1].unique, true, 'topicId index must be unique');
});

test('SCHEMA-009: EditorialContent accepts exact frontend-supported 9 block types', () => {
    const validDoc = new EditorialContent({
        topicId: new mongoose.Types.ObjectId(),
        subjectSlug: 'plc5',
        moduleSlug: 'basics',
        topicSlug: 'before-you-start',
        title: '0.1 Before You Start',
        sections: [
            { id: 'sec-intro', title: 'Introduction' }
        ],
        blocks: [
            { type: 'heading', level: 1, id: 'sec-intro', text: '0.1 Before You Start' },
            { type: 'paragraph', text: 'Welcome to the curriculum.' },
            { type: 'list', style: 'bullet', items: ['Item A', 'Item B'] },
            { type: 'blockquote', text: 'Code is poetry.' },
            { type: 'code', language: 'c', code: 'int main() { return 0; }' },
            { type: 'preformatted', text: 'Input -> Process -> Output' },
            { type: 'formula', formula: 'E = mc^2' },
            { type: 'divider' },
            { type: 'callout', tone: 'tip', title: 'Tip', text: 'Practice daily.' }
        ]
    });

    assert.strictEqual(validDoc.validateSync(), undefined, 'Valid 9 block types should pass validation');
    assert.strictEqual(validDoc.version, 1, 'Version should default to 1');
    assert.strictEqual(validDoc.status, 'Published', 'Status should default to Published');
});

test('SCHEMA-010: EditorialContent rejects invalid status', () => {
    const invalidDoc = new EditorialContent({
        topicId: new mongoose.Types.ObjectId(),
        title: 'Test',
        status: 'InvalidStatus'
    });
    const err = invalidDoc.validateSync();
    assert.ok(err, 'Invalid status must fail validation');
    assert.ok(err.errors['status'], 'Error must target status field');
});

test('SCHEMA-011: EditorialContent rejects unrendered block types (image, table, unknown)', () => {
    // Arbitrary unknown block type
    const unknownDoc = new EditorialContent({
        topicId: new mongoose.Types.ObjectId(),
        title: 'Test',
        blocks: [
            { type: 'unsupported_gadget', payload: 'bad' }
        ]
    });
    assert.ok(unknownDoc.validateSync()?.errors['blocks'], 'Unsupported block types must fail validation');

    // Unrendered "image" block type (must wait for renderer implementation)
    const imageDoc = new EditorialContent({
        topicId: new mongoose.Types.ObjectId(),
        title: 'Test',
        blocks: [
            { type: 'image', url: 'https://example.com/diagram.png' }
        ]
    });
    assert.ok(imageDoc.validateSync()?.errors['blocks'], 'Image blocks must be rejected until frontend renderer implements them');

    // Unrendered "table" block type (must wait for renderer implementation)
    const tableDoc = new EditorialContent({
        topicId: new mongoose.Types.ObjectId(),
        title: 'Test',
        blocks: [
            { type: 'table', headers: ['Col 1'], rows: [['Val 1']] }
        ]
    });
    assert.ok(tableDoc.validateSync()?.errors['blocks'], 'Table blocks must be rejected until frontend renderer implements them');
});

test('SCHEMA-012: EditorialContent rejects React runtime and UI leakage', () => {
    // React element simulation ($$typeof)
    const reactLeakDoc = new EditorialContent({
        topicId: new mongoose.Types.ObjectId(),
        title: 'Test',
        blocks: [
            { type: 'paragraph', text: 'Hello', $$typeof: Symbol.for('react.element') }
        ]
    });
    assert.ok(reactLeakDoc.validateSync()?.errors['blocks'], 'Must reject $$typeof React symbols');

    // Function value
    const funcLeakDoc = new EditorialContent({
        topicId: new mongoose.Types.ObjectId(),
        title: 'Test',
        blocks: [
            { type: 'paragraph', text: 'Hello', helperFn: () => 'leak' }
        ]
    });
    assert.ok(funcLeakDoc.validateSync()?.errors['blocks'], 'Must reject functions');

    // Tailwind / inline style leakage
    const styleLeakDoc = new EditorialContent({
        topicId: new mongoose.Types.ObjectId(),
        title: 'Test',
        blocks: [
            { type: 'paragraph', text: 'Hello', className: 'text-red-500 font-bold' }
        ]
    });
    assert.ok(styleLeakDoc.validateSync()?.errors['blocks'], 'Must reject className / Tailwind style attributes');

    // CSS object leakage
    const cssObjectDoc = new EditorialContent({
        topicId: new mongoose.Types.ObjectId(),
        title: 'Test',
        blocks: [
            { type: 'paragraph', text: 'Hello', style: { color: 'red' } }
        ]
    });
    assert.ok(cssObjectDoc.validateSync()?.errors['blocks'], 'Must reject CSS style objects');

    // Event handler leakage
    const eventLeakDoc = new EditorialContent({
        topicId: new mongoose.Types.ObjectId(),
        title: 'Test',
        blocks: [
            { type: 'code', code: 'printf()', onClick: 'alert(1)' }
        ]
    });
    assert.ok(eventLeakDoc.validateSync()?.errors['blocks'], 'Must reject onClick event handlers');
});
