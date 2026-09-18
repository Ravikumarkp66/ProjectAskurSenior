import { BLOCK_TYPES } from '../../contentModel.js';

export const PLC5_TOPIC_0_3 = {
    subjectSlug: 'plc5',
    moduleSlug: 'basics',
    topicSlug: 'common-myths',
    title: '0.3 Common Myths',
    displayLabel: '0.3 Common Myths',
    moduleDisplayTitle: '0. Basics',
    breadcrumbs: ['0. Basics', '0.3 Common Myths'],
    sections: [
        { id: 'sec-myths-intro', title: 'Common Myths' },
        { id: 'sec-myth-1', title: 'Myth 1: Only for IT Branches' },
        { id: 'sec-myth-2', title: 'Myth 2: Switching to IT' },
        { id: 'sec-myth-3', title: 'Myth 3: Hundreds of LeetCode' },
        { id: 'sec-myth-4', title: 'Myth 4: Finishing the Syllabus' },
        { id: 'sec-myth-5', title: 'Myth 5: Struggling With a Language' },
        { id: 'sec-bigger-picture', title: 'The Bigger Picture' }
    ],
    blocks: [
        {
            type: BLOCK_TYPES.HEADING,
            level: 1,
            id: 'sec-myths-intro',
            text: '0.3 Common Myths'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Before we go further, let's clear up a few things you may hear about programming during engineering."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Some of them sound reasonable at first.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "They're not always true."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-myth-1',
            text: 'Myth 1: Programming is only for IT branches'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'No.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Programming is not something that belongs exclusively to IT or CSE students.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Students from ECE, EEE, Mechanical, Civil, Chemical, and other branches can use programming too.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The branch you study and the programming skills you develop are two different things.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Your branch gives you a particular engineering domain.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Programming is a tool you can use within that domain.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "So don't think:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"I\'m not from IT, so programming isn\'t for me."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'It absolutely can be.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-myth-2',
            text: 'Myth 2: You must know programming to switch from a non-IT branch to IT'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'This one needs a little clarification.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "If you're from a non-IT branch and later want to move into software or IT-related roles, programming can certainly become an important skill."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "But don't turn that into:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"I must become an expert programmer immediately, otherwise I can\'t switch."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't need to know everything from the beginning."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You build the required skills gradually depending on the role you're aiming for."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "And if you don't want to move into IT at all, that's fine too."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "Learning programming doesn't force you to change your branch or career."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-myth-3',
            text: 'Myth 3: I need to solve hundreds of LeetCode problems to become good at problem solving'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'This is a very common trap.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'LeetCode is useful.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'But solving more problems does not automatically mean you have better problem-solving skills.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "If you're blindly memorizing patterns or copying solutions, you may solve a lot of questions without actually understanding how to approach a new problem."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Good problem solving comes from learning how to:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'understand the problem',
                'break it into smaller parts',
                'think of possible solutions',
                'test your thinking',
                'find mistakes',
                'improve your approach'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'LeetCode can help you practise these skills.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "It isn't the definition of problem solving."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "You don't need to solve 500 problems just to prove that you're good at programming."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-myth-4',
            text: "Myth 4: If I finish this syllabus, I'm good at programming"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'No.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'And this is important to understand from the beginning.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Finishing a syllabus means you've learned the concepts covered in that syllabus."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "It doesn't mean you've mastered programming."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Think about learning to drive.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Finishing a driving course doesn't mean you've become an excellent driver."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You still need experience.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Programming is similar.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'This course gives you a foundation.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You'll need to write programs, solve problems, make mistakes, build things, and learn beyond the syllabus if you want to become really good."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "So don't measure yourself by:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"I finished the syllabus."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Measure yourself by:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"Can I understand a problem and build a solution on my own?"'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-myth-5',
            text: "Myth 5: If I fail at a programming language, I'm bad at programming"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Definitely not.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Struggling with C doesn't mean you're bad at programming."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Struggling with Java doesn't mean you're bad at programming."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Even experienced programmers can find a new language difficult at first.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A programming language has its own syntax, rules, libraries and ways of doing things.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You can be good at understanding problems and still struggle with a particular language.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "So don't make this connection:"
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            text: '"I couldn\'t learn this language → I\'m bad at programming."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Those are two different things.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Sometimes you simply need more time and practice with that language.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-bigger-picture',
            text: 'The Bigger Picture'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't let programming become a test of whether you're \"naturally talented.\""
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't need to prove that you're a programmer before you start learning."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "And you don't become a good programmer simply by:"
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'choosing an IT branch',
                'solving hundreds of LeetCode problems',
                'finishing one syllabus',
                'knowing one programming language'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'There is much more to it.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'bold',
            text: 'Learn the fundamentals. Practise. Build things. Get stuck. Figure things out. Repeat.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "That's how the skill develops."
        }
    ]
};
