import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
    BLOCK_TYPES, 
    validateEditorialDocument 
} from '../contentModel.js';
import {
    PLC5_EDITORIAL_TOPICS,
    PLC5_TOPICS_BY_SLUG,
    getPLC5TopicEditorial,
    PLC5_TOPIC_0_1,
    PLC5_TOPIC_0_2,
    PLC5_TOPIC_0_3,
    PLC5_TOPIC_0_4,
    PLC5_TOPIC_0_5,
    PLC5_TOPIC_0_6,
    PLC5_TOPIC_0_7,
    PLC5_TOPIC_1_1,
    PLC5_TOPIC_1_2,
    PLC5_TOPIC_1_4,
    PLC5_TOPIC_1_5
} from '../plc5/index.js';
import EditorialRenderer from '../../../pages/my-subjects/components/EditorialRenderer.jsx';

// Reference TOPIC_SECTIONS from original TopicEditorialView.jsx
const EXPECTED_TOPIC_SECTIONS = {
    'before-you-start': [
        { id: 'sec-intro', title: 'Before You Start' },
        { id: 'sec-not-supposed', title: 'You Are Not Supposed to Know Everything' },
        { id: 'sec-dont-compare', title: "Don't Compare Yourself" },
        { id: 'sec-difficult', title: 'Programming Will Feel Difficult' },
        { id: 'sec-memorize', title: "You Don't Need to Memorize Everything" },
        { id: 'sec-need', title: 'What You Actually Need' },
        { id: 'sec-last-thing', title: 'One Last Thing Before We Begin' }
    ],
    'why-programming': [
        { id: 'sec-why-intro', title: 'Why Programming?' },
        { id: 'sec-solve-problems', title: 'Teaches You How to Solve Problems' },
        { id: 'sec-repeated-work', title: 'Saves Repeated Work' },
        { id: 'sec-not-just-cs', title: 'Not Just for CS Students' },
        { id: 'sec-why-c', title: 'Why Are We Starting With C?' },
        { id: 'sec-career', title: "Don't Worry About Your Career Yet" },
        { id: 'sec-real-reason', title: 'The Real Reason' }
    ],
    'common-myths': [
        { id: 'sec-myths-intro', title: 'Common Myths' },
        { id: 'sec-myth-1', title: 'Myth 1: Only for IT Branches' },
        { id: 'sec-myth-2', title: 'Myth 2: Switching to IT' },
        { id: 'sec-myth-3', title: 'Myth 3: Hundreds of LeetCode' },
        { id: 'sec-myth-4', title: 'Myth 4: Finishing the Syllabus' },
        { id: 'sec-myth-5', title: 'Myth 5: Struggling With a Language' },
        { id: 'sec-bigger-picture', title: 'The Bigger Picture' }
    ],
    'no-coding-background': [
        { id: 'sec-no-bg-intro', title: 'No Coding Background?' },
        { id: 'sec-classmates-know', title: 'Classmates Already Know Coding' },
        { id: 'sec-bio-non-cs', title: 'Biology / Non-CS Background' },
        { id: 'sec-dont-fake', title: "Don't Fake Understanding" },
        { id: 'sec-start-where-you-are', title: 'Start Where You Are' }
    ],
    'how-to-learn': [
        { id: 'sec-learn-intro', title: 'How to Learn' },
        { id: 'sec-first-understand', title: 'First, Understand. Then Remember.' },
        { id: 'sec-dont-just-read', title: "Don't Just Read Code" },
        { id: 'sec-get-used-to-stuck', title: 'Get Used to Being Stuck' },
        { id: 'sec-mistakes-feedback', title: 'Use Mistakes as Feedback' },
        { id: 'sec-learn-practise', title: 'Learn a Little, Then Practise It' },
        { id: 'sec-dont-rush', title: "Don't Rush" }
    ],
    'how-to-practice': [
        { id: 'sec-practice-intro', title: 'How to Practice' },
        { id: 'sec-dont-wait-enough', title: "Don't Wait Until You Know Enough" },
        { id: 'sec-try-before-solution', title: 'Try Before Looking at Solution' },
        { id: 'sec-dry-run', title: 'Dry-Run Your Programs' },
        { id: 'sec-write-code-yourself', title: 'Write Code Yourself' },
        { id: 'sec-practice-regularly', title: 'Practice Regularly' },
        { id: 'sec-dont-measure-number', title: "Don't Measure by the Number" },
        { id: 'sec-the-cycle', title: 'The Practice Cycle' }
    ],
    'using-askursenior': [
        { id: 'sec-using-intro', title: 'Using AskUrSenior' },
        { id: 'sec-start-editorial', title: 'Start with the Editorial' },
        { id: 'sec-use-code-editor', title: 'Use the Code Editor' },
        { id: 'sec-use-practice', title: 'Use the Practice Problems' },
        { id: 'sec-use-pyqs', title: 'Use PYQs When You Need Them' },
        { id: 'sec-use-discussion', title: "Use Discussion When You're Stuck" },
        { id: 'sec-dont-finish-at-once', title: "Don't Try to Finish at Once" },
        { id: 'sec-platform-loop', title: 'How to Learn on AskUrSenior' }
    ],
    'introduction-to-computers': [
        { id: 'sec-what-is-computer', title: 'What is a Computer?' },
        { id: 'sec-data-and-information', title: 'Data and Information' },
        { id: 'sec-what-it-does', title: 'What Does a Computer Actually Do?' },
        { id: 'sec-main-parts', title: 'The Main Parts of a Computer' },
        { id: 'sec-more-than-cpu', title: 'A Computer Is More Than Just a CPU' },
        { id: 'sec-simple-example', title: 'One Simple Example' },
        { id: 'sec-different-forms', title: 'Computers Come in Different Forms' },
        { id: 'sec-what-to-remember', title: 'What You Should Remember' }
    ],
    'input-and-output-devices': [
        { id: 'sec-intro', title: 'Introduction' },
        { id: 'sec-input-devices', title: 'Input Devices' },
        { id: 'sec-keyboard', title: 'Keyboard' },
        { id: 'sec-pointing-devices', title: 'Pointing Devices' },
        { id: 'sec-scanner', title: 'Scanner & OCR' },
        { id: 'sec-other-input', title: 'Other Input Devices' },
        { id: 'sec-output-devices', title: 'Output Devices' },
        { id: 'sec-monitor', title: 'Monitor' },
        { id: 'sec-printer', title: 'Printer' },
        { id: 'sec-impact-printers', title: 'Impact Printers' },
        { id: 'sec-non-impact-printers', title: 'Non-Impact Printers' },
        { id: 'sec-plotter', title: 'Plotter' },
        { id: 'sec-input-vs-output', title: 'Input vs Output Devices' },
        { id: 'sec-simple-example', title: 'A Simple Example' },
        { id: 'sec-remember', title: 'Remember' }
    ],
    'software-basics': [
        { id: 'sec-intro', title: 'Introduction' },
        { id: 'sec-what-is-software', title: 'What is Software?' },
        { id: 'sec-types-of-software', title: 'Types of Software' },
        { id: 'sec-system-software', title: '1. System Software' },
        { id: 'sec-application-software', title: '2. Application Software' },
        { id: 'sec-system-vs-application', title: 'System Software vs Application Software' },
        { id: 'sec-where-does-c-come-in', title: 'Where Does C Come In?' },
        { id: 'sec-important-distinction', title: 'One Important Distinction' },
        { id: 'sec-exam-definition', title: 'Exam Definition' },
        { id: 'sec-quick-mental-model', title: 'Quick Mental Model' }
    ],
    'structure-of-a-c-program': [
        { id: 'sec-intro', title: 'Introduction' },
        { id: 'sec-basic-structure', title: 'Basic Structure' },
        { id: 'sec-documentation', title: 'Documentation Section' },
        { id: 'sec-link', title: 'Link Section' },
        { id: 'sec-definition', title: 'Definition Section' },
        { id: 'sec-global-declaration', title: 'Global Declaration Section' },
        { id: 'sec-main', title: 'main() Section' },
        { id: 'sec-subprogram', title: 'Subprogram Section' },
        { id: 'sec-putting-it-together', title: 'Putting It Together' },
        { id: 'sec-things-to-notice', title: 'A Few Things You Should Notice' },
        { id: 'sec-complete-picture', title: 'The Complete Picture' }
    ]
};

const ALL_TOPICS = [
    PLC5_TOPIC_0_1,
    PLC5_TOPIC_0_2,
    PLC5_TOPIC_0_3,
    PLC5_TOPIC_0_4,
    PLC5_TOPIC_0_5,
    PLC5_TOPIC_0_6,
    PLC5_TOPIC_0_7,
    PLC5_TOPIC_1_1,
    PLC5_TOPIC_1_2,
    PLC5_TOPIC_1_4,
    PLC5_TOPIC_1_5
];

describe('PLC5 Editorial Content Migration - Step 2 Tests', () => {
    it('PLC5-MIG-001: all 11 migrated topics pass content model validation', () => {
        expect(ALL_TOPICS).toHaveLength(11);
        ALL_TOPICS.forEach((topic) => {
            const validation = validateEditorialDocument(topic);
            expect(validation.valid, `Validation failed for ${topic.topicSlug}: ${validation.errors.join(', ')}`).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
    });

    it('PLC5-MIG-002: each topic has complete and consistent metadata', () => {
        ALL_TOPICS.forEach((topic) => {
            expect(topic.subjectSlug).toBe('plc5');
            expect(typeof topic.moduleSlug).toBe('string');
            expect(typeof topic.topicSlug).toBe('string');
            expect(typeof topic.title).toBe('string');
            expect(typeof topic.displayLabel).toBe('string');
            expect(typeof topic.moduleDisplayTitle).toBe('string');
            expect(Array.isArray(topic.breadcrumbs)).toBe(true);
            expect(topic.breadcrumbs.length).toBeGreaterThanOrEqual(2);
            expect(Array.isArray(topic.sections)).toBe(true);
            expect(topic.sections.length).toBeGreaterThan(0);
            expect(Array.isArray(topic.blocks)).toBe(true);
            expect(topic.blocks.length).toBeGreaterThan(0);
        });
    });

    it('PLC5-MIG-003: Table of Contents sections match original TOPIC_SECTIONS exactly', () => {
        ALL_TOPICS.forEach((topic) => {
            const expectedSections = EXPECTED_TOPIC_SECTIONS[topic.topicSlug];
            expect(expectedSections, `Missing expected sections for ${topic.topicSlug}`).toBeDefined();
            expect(topic.sections).toEqual(expectedSections);
        });
    });

    it('PLC5-MIG-004: all block types used are valid schema block types', () => {
        const validTypes = new Set(Object.values(BLOCK_TYPES));
        ALL_TOPICS.forEach((topic) => {
            topic.blocks.forEach((block, idx) => {
                expect(validTypes.has(block.type), `Invalid block type ${block.type} in ${topic.topicSlug} at index ${idx}`).toBe(true);
            });
        });
    });

    it('PLC5-MIG-005: preserves code block in Topic 0.1', () => {
        const codeBlock = PLC5_TOPIC_0_1.blocks.find(b => b.type === BLOCK_TYPES.CODE);
        expect(codeBlock).toBeDefined();
        expect(codeBlock.language).toBe('C');
        expect(codeBlock.code).toContain('#include <stdio.h>');
        expect(codeBlock.code).toContain('printf("Hello");');
    });

    it('PLC5-MIG-006: preserves ASCII architecture diagrams in Topic 1.1', () => {
        const preBlocks = PLC5_TOPIC_1_1.blocks.filter(b => b.type === BLOCK_TYPES.PREFORMATTED);
        expect(preBlocks.length).toBeGreaterThanOrEqual(4);
        const cpuDiagram = preBlocks.find(b => b.text.includes('Input Unit') && b.text.includes('ALU + CU'));
        expect(cpuDiagram).toBeDefined();
        expect(cpuDiagram.text).toContain('Registers');
    });

    it('PLC5-MIG-007: registry and lookup helper resolve topics accurately', () => {
        expect(Object.keys(PLC5_EDITORIAL_TOPICS)).toHaveLength(ALL_TOPICS.length);
        expect(Object.keys(PLC5_TOPICS_BY_SLUG)).toHaveLength(ALL_TOPICS.length);

        // Test composite key lookup
        expect(getPLC5TopicEditorial('basics', 'before-you-start')).toBe(PLC5_TOPIC_0_1);
        expect(getPLC5TopicEditorial('module-1', 'introduction-to-computers')).toBe(PLC5_TOPIC_1_1);
        expect(getPLC5TopicEditorial('module1', 'input-and-output-devices')).toBe(PLC5_TOPIC_1_2);
        expect(getPLC5TopicEditorial('module-1', 'input-and-output-devices')).toBe(PLC5_TOPIC_1_2);

        // Test fallback by topicSlug
        expect(getPLC5TopicEditorial(null, 'why-programming')).toBe(PLC5_TOPIC_0_2);
        expect(getPLC5TopicEditorial('', 'how-to-practice')).toBe(PLC5_TOPIC_0_6);
        expect(getPLC5TopicEditorial(null, 'input-and-output-devices')).toBe(PLC5_TOPIC_1_2);
        expect(getPLC5TopicEditorial('module-1', 'software-basics')).toBe(PLC5_TOPIC_1_4);
        expect(getPLC5TopicEditorial(null, 'software-basics')).toBe(PLC5_TOPIC_1_4);
        expect(getPLC5TopicEditorial('module-1', 'structure-of-a-c-program')).toBe(PLC5_TOPIC_1_5);
        expect(getPLC5TopicEditorial(null, 'structure-of-a-c-program')).toBe(PLC5_TOPIC_1_5);

        // Test unknown slug returns null
        expect(getPLC5TopicEditorial('basics', 'unknown-topic')).toBeNull();
        expect(getPLC5TopicEditorial(null, 'non-existent')).toBeNull();
    });

    it('PLC5-MIG-008: EditorialRenderer renders all 11 migrated documents without error', () => {
        ALL_TOPICS.forEach((topic) => {
            const html = renderToStaticMarkup(
                React.createElement(EditorialRenderer, {
                    content: topic,
                    isDark: true
                })
            );
            expect(html).toBeTruthy();
            expect(html).toContain(topic.title);
            // Verify all sections are represented in rendered markup
            topic.sections.forEach(sec => {
                const escapedTitle = sec.title
                    .replace(/&/g, '&amp;')
                    .replace(/'/g, '&#x27;')
                    .replace(/"/g, '&quot;');
                expect(html).toContain(escapedTitle);
            });
        });
    });
});
