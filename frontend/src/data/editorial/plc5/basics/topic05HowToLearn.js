import { BLOCK_TYPES } from '../../contentModel.js';

export const PLC5_TOPIC_0_5 = {
    subjectSlug: 'plc5',
    moduleSlug: 'basics',
    topicSlug: 'how-to-learn',
    title: '0.5 How to Learn',
    displayLabel: '0.5 How to Learn',
    moduleDisplayTitle: '0. Basics',
    breadcrumbs: ['0. Basics', '0.5 How to Learn'],
    sections: [
        { id: 'sec-learn-intro', title: 'How to Learn' },
        { id: 'sec-first-understand', title: 'First, Understand. Then Remember.' },
        { id: 'sec-dont-just-read', title: "Don't Just Read Code" },
        { id: 'sec-get-used-to-stuck', title: 'Get Used to Being Stuck' },
        { id: 'sec-mistakes-feedback', title: 'Use Mistakes as Feedback' },
        { id: 'sec-learn-practise', title: 'Learn a Little, Then Practise It' },
        { id: 'sec-dont-rush', title: "Don't Rush" }
    ],
    blocks: [
        {
            type: BLOCK_TYPES.HEADING,
            level: 1,
            id: 'sec-learn-intro',
            text: '0.5 How to Learn'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Now you know that you don't need a coding background to start."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'So the next question is:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Okay, then how should I actually learn programming?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'This is where many students go wrong.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'They watch a few videos, copy some programs, memorize syntax before an exam, and then wonder why they still can\'t write a program on their own.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "Don't do that."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-first-understand',
            text: 'First, understand. Then remember.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "When you learn something new, don't immediately ask:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"What do I need to memorize?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Ask:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"What is actually happening here?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example, when we eventually learn a new C concept, don\'t just copy the syntax into your notebook.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Understand what the concept is doing, why we need it, and when we would use it.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Once you understand something, remembering it becomes much easier.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-dont-just-read',
            text: "Don't just read code"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'This is a big one.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You can look at a program and think:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Yeah, yeah, I understand this."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Then close the page and try writing it yourself.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Suddenly:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Wait... what comes here?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That's normal."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Reading someone else\'s solution and producing your own solution are two different skills.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'So whenever possible:'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'bold',
            text: 'Read → Understand → Close it → Try yourself'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "That's where the actual learning happens."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-get-used-to-stuck',
            text: 'Get used to being stuck'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You are going to get stuck.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That's not something we need to avoid."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "If you can't solve something immediately, don't jump straight to the answer."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'First try to figure out:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'What exactly is the problem asking?',
                'What information do I have?',
                'What do I need to produce?',
                'Can I break the problem into smaller steps?',
                'Where exactly am I getting stuck?'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "Even if you don't reach the answer, that thinking is useful."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-mistakes-feedback',
            text: 'Use mistakes as feedback'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "When your program doesn't work, don't just think:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"My code is wrong."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Find out why it's wrong."
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Maybe the logic is wrong.',
                'Maybe you misunderstood the problem.',
                'Maybe there\'s a small syntax mistake.',
                'Maybe your program works but produces the wrong output.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Each mistake tells you something.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That's why you shouldn't be afraid of errors."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "They're feedback."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-learn-practise',
            text: 'Learn a little, then practise it'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't wait until you've finished an entire module before writing programs."
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Learn a concept.',
                'Try a few examples.',
                'Write something yourself.',
                'Make mistakes.',
                'Then move to the next concept.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'This keeps programming from becoming something you only read about.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-dont-rush',
            text: "Don't rush"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'And one more thing.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'bold',
            text: "Don't rush just because someone else is moving faster."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "If it takes you two attempts to understand something that took someone else one attempt, that's fine."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You're learning a skill, not trying to finish a race."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The goal is simple:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Understand what you\'re doing well enough that you can eventually do it yourself."'
        }
    ]
};
