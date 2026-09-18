import { BLOCK_TYPES } from '../../contentModel.js';

export const PLC5_TOPIC_0_1 = {
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
        { id: 'sec-dont-compare', title: "Don't Compare Yourself" },
        { id: 'sec-difficult', title: 'Programming Will Feel Difficult' },
        { id: 'sec-memorize', title: "You Don't Need to Memorize Everything" },
        { id: 'sec-need', title: 'What You Actually Need' },
        { id: 'sec-last-thing', title: 'One Last Thing Before We Begin' }
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
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't have to look at a finished program and somehow understand every symbol immediately. That's not how learning programming works."
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
                'Someone else might be solving coding problems.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "Good for them. But that doesn't change where you are starting."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Instead of thinking:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Why don\'t I know this already?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Try thinking:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Okay, I don\'t know it yet. Let me understand it."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'That small change in mindset matters a lot.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-difficult',
            text: 'Programming Will Feel Difficult Sometimes'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "I also don't want to give you the usual motivational speech:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Programming is super easy! Just believe in yourself!"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'No. Some parts will be confusing.'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                "You'll make mistakes.",
                "Your program won't work on the first try.",
                "You'll get compiler errors.",
                "You'll stare at your code and wonder why something that looks perfectly correct isn't working."
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'That is normal. Even after you understand programming, you will still make mistakes.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "The difference is that you'll slowly become better at finding and fixing them. That is what we are trying to build."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-memorize',
            text: "You Don't Need to Memorize Everything"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Please don't start learning programming by trying to memorize every piece of syntax. That is not the goal."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'You should gradually understand the problem-solving flow:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'ordered',
            items: [
                'What are we trying to do?',
                'How can we solve it?',
                'How do we express that solution in C?'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "The syntax becomes much easier when you understand the idea behind it. We'll focus on understanding first and remembering naturally through practice."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-need',
            text: 'So What Do You Actually Need?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Not a perfect coding background. Not years of experience. Not a huge collection of programming certificates.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'You mainly need three things:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Curiosity: Be willing to ask "Why does this work?" instead of blindly copying.',
                "Patience: Some concepts won't click immediately. That is completely normal.",
                'Practice: Reading code is useful, but actually writing and tracing it is where understanding solidifies.'
            ]
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-last-thing',
            text: 'One Last Thing Before We Begin'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't try to finish this course by simply reading everything like a novel."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Programming is not a subject where you read 100 pages today and suddenly become good at it tomorrow. You will need to think, write, run, make mistakes, trace, and try again.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "And we'll take it one step at a time. You don't have to become an expert programmer today."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'You just need to understand the next concept in front of you.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That's it. Let's start from there."
        }
    ]
};
