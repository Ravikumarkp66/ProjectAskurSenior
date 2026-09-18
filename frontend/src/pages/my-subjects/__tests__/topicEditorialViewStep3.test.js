import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TopicEditorialView from '../components/TopicEditorialView.jsx';

describe('TopicEditorialView Step 3 Integration Tests', () => {
    const defaultSubject = {
        code: '22PLC15B',
        slug: 'plc5',
        title: 'Introduction to C Programming'
    };

    const module0 = {
        moduleNumber: 0,
        slug: 'basics',
        title: 'Basics',
        displayLabel: '0. Basics',
        topics: [
            { id: '0-1', slug: 'before-you-start', title: 'Before You Start', displayLabel: '0.1 Before You Start' },
            { id: '0-2', slug: 'why-programming', title: 'Why Programming?', displayLabel: '0.2 Why Programming?' },
            { id: '0-3', slug: 'common-myths', title: 'Common Myths', displayLabel: '0.3 Common Myths' },
            { id: '0-4', slug: 'no-coding-background', title: 'No Coding Background?', displayLabel: '0.4 No Coding Background?' },
            { id: '0-5', slug: 'how-to-learn', title: 'How to Learn', displayLabel: '0.5 How to Learn' },
            { id: '0-6', slug: 'how-to-practice', title: 'How to Practice', displayLabel: '0.6 How to Practice' },
            { id: '0-7', slug: 'using-askursenior', title: 'Using AskUrSenior', displayLabel: '0.7 Using AskUrSenior' }
        ]
    };

    const module1 = {
        moduleNumber: 1,
        slug: 'module-1',
        title: 'Introduction to C',
        displayLabel: 'M01 · Introduction to C',
        topics: [
            { id: '1-1', slug: 'introduction-to-computers', title: 'Introduction to Computers', displayLabel: '1.1 Introduction to Computers' }
        ]
    };

    it('TEV-001: renders all 7 Basics topics via new structured editorial renderer', () => {
        module0.topics.forEach((topic, idx) => {
            const html = renderToStaticMarkup(
                React.createElement(TopicEditorialView, {
                    activeSubject: defaultSubject,
                    activeModule: module0,
                    activeTopic: topic,
                    onToggleCompletion: () => {},
                    isDark: true
                })
            );

            expect(html).toBeTruthy();
            expect(html).toContain(topic.displayLabel);
            expect(html).toContain('0. Basics');
            expect(html).toContain('On This Page');
            // Progress indicator
            expect(html).toContain(`${idx + 1} / 7 topics`);
            // EditorialActionBar
            expect(html).toContain('Mark as completed');
        });
    });

    it('TEV-002: renders Module 1 Topic 1.1 Introduction to Computers via structured renderer', () => {
        const topic11 = module1.topics[0];
        const html = renderToStaticMarkup(
            React.createElement(TopicEditorialView, {
                activeSubject: defaultSubject,
                activeModule: module1,
                activeTopic: topic11,
                onToggleCompletion: () => {},
                isDark: true
            })
        );

        expect(html).toBeTruthy();
        expect(html).toContain('1.1 Introduction to Computers');
        expect(html).toContain('M01 · Introduction to C');
        expect(html).toContain('What is a Computer?');
        expect(html).toContain('The Main Parts of a Computer');
        expect(html).toContain('Input Unit');
        expect(html).toContain('ALU + CU');
        expect(html).toContain('Registers');
        expect(html).toContain('Mark as completed');
    });

    it('TEV-003: passes completion status accurately to EditorialActionBar', () => {
        const topic01 = module0.topics[0];

        // Incomplete
        const htmlIncomplete = renderToStaticMarkup(
            React.createElement(TopicEditorialView, {
                activeSubject: defaultSubject,
                activeModule: module0,
                activeTopic: topic01,
                isCompleted: false,
                onToggleCompletion: () => {},
                isDark: true
            })
        );
        expect(htmlIncomplete).toContain('Mark as completed');
        expect(htmlIncomplete).not.toContain('Completed');

        // Completed
        const htmlCompleted = renderToStaticMarkup(
            React.createElement(TopicEditorialView, {
                activeSubject: defaultSubject,
                activeModule: module0,
                activeTopic: topic01,
                isCompleted: true,
                onToggleCompletion: () => {},
                isDark: true
            })
        );
        expect(htmlCompleted).toContain('Completed');
    });

    it('TEV-004: safely handles unknown topic with fallback', () => {
        const unknownTopic = { id: '0-99', slug: 'unknown-future-topic', title: 'Future Topic' };
        const html = renderToStaticMarkup(
            React.createElement(TopicEditorialView, {
                activeSubject: defaultSubject,
                activeModule: module0,
                activeTopic: unknownTopic,
                onToggleCompletion: () => {},
                isDark: true
            })
        );

        // Does not crash, renders polished empty state card without irrelevant completion/reaction buttons
        expect(html).toBeTruthy();
        expect(html).toContain('Editorial content for this topic is being prepared');
        expect(html).toContain('Coming Soon');
        expect(html).toContain('Future Topic');
        expect(html).not.toContain('Mark as completed');
    });

    it('TEV-005: supports both light and dark themes seamlessly', () => {
        const topic01 = module0.topics[0];

        const htmlDark = renderToStaticMarkup(
            React.createElement(TopicEditorialView, {
                activeSubject: defaultSubject,
                activeModule: module0,
                activeTopic: topic01,
                isDark: true
            })
        );
        expect(htmlDark).toContain('#1E1E1E');

        const htmlLight = renderToStaticMarkup(
            React.createElement(TopicEditorialView, {
                activeSubject: defaultSubject,
                activeModule: module0,
                activeTopic: topic01,
                isDark: false
            })
        );
        expect(htmlLight).toContain('#F6F7F9');
    });

    it('TEV-006: verifies verbatim content fidelity across all 8 migrated topics', () => {
        const testCases = [
            {
                module: module0,
                topic: module0.topics[0],
                mustContain: [
                    '0.1 Before You Start',
                    'You do not need to know programming before learning programming.',
                    'You Are Not Supposed to Know Everything',
                    '#include &lt;stdio.h&gt;',
                    'printf(&quot;Hello&quot;);',
                    'Curiosity:',
                    'Patience:',
                    'Practice:'
                ]
            },
            {
                module: module0,
                topic: module0.topics[1],
                mustContain: [
                    '0.2 Why Programming?',
                    'Teaches You How to Solve Problems',
                    '10,000 students?',
                    'Saves Repeated Work',
                    'Then Why Are We Starting With C?',
                    'Programming teaches me how to break problems down'
                ]
            },
            {
                module: module0,
                topic: module0.topics[2],
                mustContain: [
                    '0.3 Common Myths',
                    'Programming is only for IT branches',
                    'Myth 3: I need to solve hundreds of LeetCode',
                    'Myth 4: If I finish this syllabus',
                    'Myth 5: If I fail at a programming language',
                    'Learn the fundamentals. Practise. Build things.'
                ]
            },
            {
                module: module0,
                topic: module0.topics[3],
                mustContain: [
                    '0.4 No Coding Background?',
                    'I have never coded before. Am I already behind?',
                    'start from zero',
                    'Biology / non-CS background',
                    'Don&#x27;t fake understanding',
                    'Start where you are'
                ]
            },
            {
                module: module0,
                topic: module0.topics[4],
                mustContain: [
                    '0.5 How to Learn',
                    'First, understand. Then remember.',
                    'Don&#x27;t just read code',
                    'Read → Understand → Close it → Try yourself',
                    'Get used to being stuck',
                    'Use mistakes as feedback',
                    'They&#x27;re feedback.'
                ]
            },
            {
                module: module0,
                topic: module0.topics[5],
                mustContain: [
                    '0.6 How to Practice',
                    'Don&#x27;t wait until you &quot;know enough&quot;',
                    'Dry-run your programs',
                    'x = 5',
                    'x = 8',
                    'The Practice Cycle',
                    'Learn → Try → Get Stuck → Think → Fix → Repeat'
                ]
            },
            {
                module: module0,
                topic: module0.topics[6],
                mustContain: [
                    '0.7 Using AskUrSenior',
                    'Start with the Editorial',
                    'Use the Code Editor',
                    'Use the Practice Problems',
                    'Use PYQs When You Need Them',
                    'What I learned → How it is asked',
                    'Use Discussion When You&#x27;re Stuck'
                ]
            },
            {
                module: module1,
                topic: module1.topics[0],
                mustContain: [
                    '1.1 Introduction to Computers',
                    'What is a Computer?',
                    'Data and Information',
                    '70, 80, 90',
                    'The Main Parts of a Computer',
                    'Input Unit',
                    'ALU + CU',
                    'Registers',
                    'A Computer Is More Than Just a CPU',
                    'Input → Processing → Storage → Output'
                ]
            }
        ];

        testCases.forEach(({ module, topic, mustContain }) => {
            const html = renderToStaticMarkup(
                React.createElement(TopicEditorialView, {
                    activeSubject: defaultSubject,
                    activeModule: module,
                    activeTopic: topic,
                    onToggleCompletion: () => {},
                    isDark: true
                })
            );

            mustContain.forEach(phrase => {
                expect(html, `Topic ${topic.slug} missing phrase: "${phrase}"`).toContain(phrase);
            });
        });
    });
});
