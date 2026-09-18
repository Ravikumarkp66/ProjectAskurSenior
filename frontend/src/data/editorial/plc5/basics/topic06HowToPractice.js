import { BLOCK_TYPES } from '../../contentModel.js';

export const PLC5_TOPIC_0_6 = {
    subjectSlug: 'plc5',
    moduleSlug: 'basics',
    topicSlug: 'how-to-practice',
    title: '0.6 How to Practice',
    displayLabel: '0.6 How to Practice',
    moduleDisplayTitle: '0. Basics',
    breadcrumbs: ['0. Basics', '0.6 How to Practice'],
    sections: [
        { id: 'sec-practice-intro', title: 'How to Practice' },
        { id: 'sec-dont-wait-enough', title: "Don't Wait Until You Know Enough" },
        { id: 'sec-try-before-solution', title: 'Try Before Looking at Solution' },
        { id: 'sec-dry-run', title: 'Dry-Run Your Programs' },
        { id: 'sec-write-code-yourself', title: 'Write Code Yourself' },
        { id: 'sec-practice-regularly', title: 'Practice Regularly' },
        { id: 'sec-dont-measure-number', title: "Don't Measure by the Number" },
        { id: 'sec-the-cycle', title: 'The Practice Cycle' }
    ],
    blocks: [
        {
            type: BLOCK_TYPES.HEADING,
            level: 1,
            id: 'sec-practice-intro',
            text: '0.6 How to Practice'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Okay, you understand how you should approach learning.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Now comes the part that actually makes the difference:'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'bold',
            text: 'Practice.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You can read every explanation, watch every video, and understand every example.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "But if you don't actually try things yourself, programming will always feel unfamiliar."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-dont-wait-enough',
            text: 'Don\'t wait until you "know enough"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A common mistake is thinking:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"I\'ll learn the whole topic first. Then I\'ll start practising."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "Don't."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'If you learn something today, try using it today.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Even a very small program is useful.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "The point isn't to write something impressive."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'The point is to make your brain use what you just learned.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-try-before-solution',
            text: 'Try before looking at the solution'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Whenever you're given a programming problem, give yourself some time to solve it first."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Even if you have no idea where to start, try.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Write down what you think the program should do.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Break the problem into steps.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Then attempt it.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Only after you've genuinely tried should you look at the solution."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "And when you do look at it, don't just copy it."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Ask:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Why did they do it this way?"'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-dry-run',
            text: 'Dry-run your programs'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'One of the simplest ways to improve is to take a program and manually trace it.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Suppose a variable starts with:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: 'x = 5'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'and later changes to:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: 'x = x + 3'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't just read it."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Actually follow it:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `x = 5\nx = 5 + 3\nx = 8`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'This is called a dry run.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "You'll use this a lot while learning C because it helps you understand what your program is actually doing."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-write-code-yourself',
            text: 'Write code yourself'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't spend all your practice time reading other people's programs."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Open the editor and type.'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Change the input.',
                'Change the values.',
                'Try a different approach.',
                'Break the program intentionally and see what happens.',
                'Then fix it.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'That interaction is where programming starts becoming familiar.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-practice-regularly',
            text: 'Practice regularly'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't need to spend six hours every day coding."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "But don't disappear for two weeks and then expect everything to come back immediately."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Even small, regular practice is much better.'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Learn something.',
                'Try it.',
                'Come back later.',
                'Solve another problem.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Gradually, things that once looked confusing start becoming familiar.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-dont-measure-number',
            text: "And don't measure practice by the number of problems"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't have to solve 100 problems just so you can say:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"I practised enough."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'One problem that you genuinely understand can teach you more than ten problems you copied.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Focus on what you learned from the practice, not just how many questions you completed.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-the-cycle',
            text: 'The Practice Cycle'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'So whenever you learn something in this course, try to follow this simple cycle:'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'bold',
            text: 'Learn → Try → Get Stuck → Think → Fix → Repeat'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That's practice."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "And over time, you'll notice something interesting."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The things that once required a lot of thinking start becoming easier.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "That's how you know you're improving."
        }
    ]
};
