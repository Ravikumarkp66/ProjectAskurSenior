/**
 * Sample Structured Editorial Data for PLC5 (Introduction to C)
 * 
 * Source: Extracted directly from existing hardcoded JSX in TopicEditorialView.jsx
 * - Topic 0.1: Before You Start (Module 0 Basics)
 * - Topic 1.1: Introduction to Computers (Module 1 Introduction to C)
 * 
 * Demonstrates the structured data model representation without modifying the existing JSX view.
 */

import { BLOCK_TYPES } from '../contentModel.js';

export const PLC5_TOPIC_0_1_SAMPLE = {
    subjectSlug: 'plc5',
    moduleSlug: 'basics',
    topicSlug: 'before-you-start',
    title: '0.1 Before You Start',
    displayLabel: '0.1 Before You Start',
    moduleDisplayTitle: '0. Basics',
    breadcrumbs: ['0. Basics', '0.1 Before You Start'],
    sections: [
        { id: 'sec-intro', title: 'Before You Start' },
        { id: 'sec-not-supposed', title: 'You Are Not Supposed to Know Everything' },
        { id: 'sec-dont-compare', title: "Don't Compare Yourself" }
    ],
    blocks: [
        {
            type: BLOCK_TYPES.HEADING,
            level: 1,
            id: 'sec-intro',
            text: '0.1 Before You Start'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Hey, before we start with C, let's clear something up right away."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'You do not need to know programming before learning programming.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't worry if you've never written a program before. That's completely fine. If you've never written a single line of code in your life, you haven't missed some secret chapter that everyone else was taught. You're starting exactly where every beginner starts."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Maybe you have already seen classmates talking about Python, Java, C++, LeetCode, or showing off GitHub projects. And you might be thinking:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Everyone already knows coding. What am I even doing here?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Relax. Some people just started earlier. That's all. Starting earlier doesn't mean they understand core concepts better, and it doesn't decide where you will be by the end of the course."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-not-supposed',
            text: 'You Are Not Supposed to Know Everything'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'When you start C, there will be things that look completely strange.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You'll see things like:"
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'C',
            code: `#include <stdio.h>\n\nint main() {\n    printf("Hello");\n    return 0;\n}`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'And your first thought might be:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"What is all of this?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'That is a completely valid reaction. You are not expected to understand this on Day 1.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'We will reach it step by step.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-dont-compare',
            text: "Don't Compare Your Day 1 With Someone Else's Year 2"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'This is probably one of the biggest mistakes beginners make:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Someone sitting next to you might already know how to write programs.',
                'Someone else might have built a website.',
                'Another person might be solving problems online.'
            ]
        }
    ]
};

export const PLC5_TOPIC_1_1_SAMPLE = {
    subjectSlug: 'plc5',
    moduleSlug: 'module-1',
    topicSlug: 'introduction-to-computers',
    title: '1.1 Introduction to Computers',
    displayLabel: '1.1 Introduction to Computers',
    moduleDisplayTitle: 'M01 · Introduction to C',
    breadcrumbs: ['M01 · Introduction to C', '1.1 Introduction to Computers'],
    sections: [
        { id: 'sec-intro', title: 'Introduction to Computers' },
        { id: 'sec-what-is-computer', title: 'What is a Computer?' },
        { id: 'sec-data-and-information', title: 'Data and Information' }
    ],
    blocks: [
        {
            type: BLOCK_TYPES.HEADING,
            level: 1,
            id: 'sec-intro',
            text: '1.1 Introduction to Computers'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You use a computer almost every day. You open a browser, type something, click a button, watch a video, edit a document, or run a program.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'What exactly is a computer?'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-what-is-computer',
            text: 'What is a Computer?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'In simple words, a computer is an electronic device that takes data as input, processes it, stores data or information, and produces output.'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            label: 'Standard Definition',
            text: '"A computer is an electronic device which accepts input, processes data, stores information and produces output."'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `Input → Processing → Output\n            ↕\n          Storage`
        },
        {
            type: BLOCK_TYPES.FORMULA,
            formula: 'Output = Process(Input) + State',
            explanation: 'General computational model relationship.'
        },
        {
            type: BLOCK_TYPES.CALLOUT,
            tone: 'tip',
            title: 'Core Takeaway',
            text: 'Every program you write in C will follow this exact cycle: read inputs, manipulate them in memory, and present results.'
        }
    ]
};
