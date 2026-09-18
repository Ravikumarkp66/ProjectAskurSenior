import { BLOCK_TYPES } from '../../contentModel.js';

export const PLC5_TOPIC_0_7 = {
    subjectSlug: 'plc5',
    moduleSlug: 'basics',
    topicSlug: 'using-askursenior',
    title: '0.7 Using AskUrSenior',
    displayLabel: '0.7 Using AskUrSenior',
    moduleDisplayTitle: '0. Basics',
    breadcrumbs: ['0. Basics', '0.7 Using AskUrSenior'],
    sections: [
        { id: 'sec-using-intro', title: 'Using AskUrSenior' },
        { id: 'sec-start-editorial', title: 'Start with the Editorial' },
        { id: 'sec-use-code-editor', title: 'Use the Code Editor' },
        { id: 'sec-use-practice', title: 'Use the Practice Problems' },
        { id: 'sec-use-pyqs', title: 'Use PYQs When You Need Them' },
        { id: 'sec-use-discussion', title: "Use Discussion When You're Stuck" },
        { id: 'sec-dont-finish-at-once', title: "Don't Try to Finish at Once" },
        { id: 'sec-platform-loop', title: 'How to Learn on AskUrSenior' }
    ],
    blocks: [
        {
            type: BLOCK_TYPES.HEADING,
            level: 1,
            id: 'sec-using-intro',
            text: '0.7 Using AskUrSenior'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Now, one last thing before we start the actual course.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'bold',
            text: 'How should you use AskUrSenior while learning?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't treat it like a website where you just come, read everything, and leave."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "Use it like you would use a senior when you're learning something new."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-start-editorial',
            text: 'Start with the Editorial'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'When you begin a topic, go through the editorial first.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't worry about finishing everything quickly."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Read the explanation, try the examples, and make sure you understand the idea before moving on.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "If something doesn't make sense, go back and read that part again."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-use-code-editor',
            text: 'Use the Code Editor'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "When you reach a programming example or problem, don't just look at the code."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'bold',
            text: 'Try it yourself.'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Write it in the editor.',
                'Change the values.',
                'Run it.',
                'See what happens.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'If it gives an error, try to understand the error instead of immediately replacing your code with the solution.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-use-practice',
            text: 'Use the Practice Problems'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Once you've understood a concept, try solving problems based on it."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Start with the easier ones.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't worry if you can't solve a problem immediately."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Give it a genuine attempt first.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'If you get stuck, use the hints or explanation and then try again.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-use-pyqs',
            text: 'Use PYQs When You Need Them'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'PYQs are there to help you understand what has actually been asked in your exams.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't use them only during the last few days before the exam."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'As you finish a topic, you can look at the related PYQs and see how that concept appears in exams.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'This helps you connect:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: 'What I learned → How it is asked'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-use-discussion',
            text: "Use Discussion When You're Stuck"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Sometimes you can read an explanation three times and still think:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"I still don\'t get it."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That's when discussion becomes useful."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Ask the question.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Someone may explain it in a completely different way, and suddenly it clicks.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'And don\'t be afraid to ask what feels like a "stupid" question.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "If you don't understand something, there's a good chance someone else is wondering about the same thing."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-dont-finish-at-once',
            text: "And Don't Try to Finish Everything at Once"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't have to complete the entire course in a few days."
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Take one topic.',
                'Understand it.',
                'Practise it.',
                'Then move forward.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You'll eventually reach the end."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'The important thing is that you actually understand what you learned along the way.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-platform-loop',
            text: 'How to Learn on AskUrSenior'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "So that's how I'd suggest using AskUrSenior:"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'bold',
            text: 'Read → Understand → Try → Practise → Ask → Move forward'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't just use the platform to collect information."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'bold',
            text: 'Use it to actually learn.'
        }
    ]
};
