import { BLOCK_TYPES } from '../../contentModel.js';

export const PLC5_TOPIC_0_2 = {
    subjectSlug: 'plc5',
    moduleSlug: 'basics',
    topicSlug: 'why-programming',
    title: '0.2 Why Programming?',
    displayLabel: '0.2 Why Programming?',
    moduleDisplayTitle: '0. Basics',
    breadcrumbs: ['0. Basics', '0.2 Why Programming?'],
    sections: [
        { id: 'sec-why-intro', title: 'Why Programming?' },
        { id: 'sec-solve-problems', title: 'Teaches You How to Solve Problems' },
        { id: 'sec-repeated-work', title: 'Saves Repeated Work' },
        { id: 'sec-not-just-cs', title: 'Not Just for CS Students' },
        { id: 'sec-why-c', title: 'Why Are We Starting With C?' },
        { id: 'sec-career', title: "Don't Worry About Your Career Yet" },
        { id: 'sec-real-reason', title: 'The Real Reason' }
    ],
    blocks: [
        {
            type: BLOCK_TYPES.HEADING,
            level: 1,
            id: 'sec-why-intro',
            text: '0.2 Why Programming?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Okay, now that we've cleared the first fear, let's talk about something more important."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Why are we even learning programming?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You might be thinking:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"I joined engineering to study my branch. Why should I spend time learning programming?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Fair question.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'And I don\'t want to answer that with "because programming has a lot of scope" and move on.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Let\'s understand what programming actually gives you.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-solve-problems',
            text: 'Programming Teaches You How to Solve Problems'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'At first, programming looks like writing code.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "But that's not really the main skill."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The bigger skill is learning to look at a problem and think:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"What exactly do I need to do, and how can I break it into smaller steps?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example, suppose you have to find the average marks of a class.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You could simply calculate it once with a calculator.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'But what if there are:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                '10 students?',
                '100 students?',
                '10,000 students?'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Now you need a better way of handling the problem.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Programming teaches you to think about that process systematically.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-repeated-work',
            text: 'Programming Saves Repeated Work'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Imagine you have to perform the same calculation 500 times.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Doing it manually is possible.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'But why would you?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'If you can describe the steps clearly, you can make the computer perform those repetitive tasks for you.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "That's one of the biggest reasons programming is useful."
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: 'You solve the problem once, then let the computer repeat the work.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'This idea appears everywhere:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'calculating results',
                'processing large amounts of data',
                'automating repetitive tasks',
                'controlling machines',
                'building applications',
                'analysing information',
                'solving engineering problems'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The exact application changes, but the basic idea remains the same.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-not-just-cs',
            text: 'Programming Is Not Just for Computer Science Students'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'This is important.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't have to become a software engineer for programming to be useful."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'An engineer from another branch might use programming for simulations, calculations, automation, data analysis or controlling hardware.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A researcher might use it to process experimental data.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A student might use it to automate a boring task.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'And of course, someone interested in software development can use it to build applications and systems.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'So think of programming as a tool.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't learn a tool only because you want a particular job title. You learn it because it lets you solve certain problems better."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-why-c',
            text: 'Then Why Are We Starting With C?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "We'll properly get into C later."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "For now, just understand the reason we're spending time learning programming through a language like C."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "The goal isn't simply:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Learn some C syntax and pass the exam."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The bigger goal is to learn how to think through a problem and express that solution precisely.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Once that way of thinking starts becoming familiar, learning other programming languages becomes much less intimidating.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-career',
            text: "Don't Worry About Your Career Yet"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You might also be wondering:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"If I learn programming now, what exactly am I supposed to become?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't need to decide that right now."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't need to know whether you'll eventually work in software, electronics, data, embedded systems, research, automation, or something completely different."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Right now, you're simply building a useful skill."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'First learn to solve problems.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Then keep exploring.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Your direction can become clearer as you gain experience.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-real-reason',
            text: 'The Real Reason'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'So if someone asks you:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Why are you learning programming?"'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't have to say:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Because everyone is doing it."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "And you don't have to say:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Because there are lots of jobs."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Those can be reasons, but they're not the whole story."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A better answer is:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: 'Programming teaches me how to break problems down, think logically, and make a computer carry out my solution.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'And that skill can be useful far beyond this one subject.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "That's why we're learning it."
        }
    ]
};
