import { BLOCK_TYPES } from '../../contentModel.js';

export const PLC5_TOPIC_0_4 = {
    subjectSlug: 'plc5',
    moduleSlug: 'basics',
    topicSlug: 'no-coding-background',
    title: '0.4 No Coding Background?',
    displayLabel: '0.4 No Coding Background?',
    moduleDisplayTitle: '0. Basics',
    breadcrumbs: ['0. Basics', '0.4 No Coding Background?'],
    sections: [
        { id: 'sec-no-bg-intro', title: 'No Coding Background?' },
        { id: 'sec-classmates-know', title: 'Classmates Already Know Coding' },
        { id: 'sec-bio-non-cs', title: 'Biology / Non-CS Background' },
        { id: 'sec-dont-fake', title: "Don't Fake Understanding" },
        { id: 'sec-start-where-you-are', title: 'Start Where You Are' }
    ],
    blocks: [
        {
            type: BLOCK_TYPES.HEADING,
            level: 1,
            id: 'sec-no-bg-intro',
            text: '0.4 No Coding Background?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Let's talk specifically about something a lot of first-year students worry about:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"I have never coded before. Am I already behind?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'No.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "And honestly, you don't need to pretend that you know something you don't."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'If this is your first time programming, start from zero.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That's not a disadvantage. It simply means we have to build your understanding from the beginning instead of assuming things."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-classmates-know',
            text: '"But my classmates already know coding."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Some of them probably do.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'They may have learned C in school.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'They may have tried Python.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'They may have built small projects.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "That's fine."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "But don't make the mistake of comparing your starting point with someone else's experience."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "If you don't understand something, ask."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'If you need to read an explanation twice, read it twice.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "If you make a mistake in your first program, that's completely normal."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Your goal isn't to catch up with everyone in one week."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "Your goal is to understand what you're learning."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-bio-non-cs',
            text: '"I\'m from Biology / non-CS background."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That's okay too."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You may have never seen programming before, while someone else has been doing it for years.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That doesn't decide how far you can go."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You may simply need a little more time at the beginning to become comfortable with the way programmers think about problems.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Give yourself that time.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-dont-fake',
            text: "Don't fake understanding"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "This is one thing I'd strongly recommend."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "If you see some code and don't understand it, don't just memorize it because your friend said:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Bro, this is easy."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Ask:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Why does this work?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That's a much better question."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Understanding something slowly is far more useful than copying something quickly.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-start-where-you-are',
            text: 'Start where you are'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't need to prepare yourself for programming before learning programming."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't need to finish another programming course first."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't need to learn Python before C."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't need to prove that you belong here."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'bold',
            text: "We'll start from the beginning and build up from there."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "And if something feels confusing along the way, that's exactly when you should stop, ask, and try again."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "That's part of learning."
        }
    ]
};
