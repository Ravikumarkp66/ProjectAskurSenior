import { BLOCK_TYPES } from '../../contentModel.js';

export const PLC5_TOPIC_1_4 = {
    subjectSlug: 'plc5',
    moduleSlug: 'module-1',
    topicSlug: 'software-basics',
    title: '1.4 Software Basics',
    displayLabel: '1.4 Software Basics',
    moduleDisplayTitle: 'M01 · Introduction to C',
    breadcrumbs: ['M01 · Introduction to C', '1.4 Software Basics'],
    sections: [
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
    blocks: [
        {
            type: BLOCK_TYPES.HEADING,
            level: 1,
            id: 'sec-intro',
            text: '1.4 Software Basics'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Before writing C programs, we need to understand one basic thing:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            label: 'Core Question',
            text: '"What is software, and how is it different from hardware?"'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-what-is-software',
            text: 'What is Software?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Software is a collection of programs/instructions that tells a computer what to do.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Windows',
                'Chrome',
                'VLC',
                'MS Word',
                'C compiler',
                'Your own C program'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'All of these are software.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Think of it like this:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `Hardware = Physical parts\nSoftware = Instructions/programs`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `Keyboard → Hardware\nWindows  → Software\nCPU      → Hardware\nChrome   → Software\nRAM      → Hardware`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The C notes describe software as a collection of code that drives a computer to perform related tasks.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-types-of-software',
            text: 'Types of Software'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Software is broadly divided into two types:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `                    SOFTWARE\n                       |\n             ┌─────────┴─────────┐\n             ↓                   ↓\n      System Software     Application Software`
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-system-software',
            text: '1. System Software'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'System software is software that manages and controls computer hardware and provides a platform for application software.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Examples:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Operating System',
                'BIOS',
                'Compiler',
                'Assembler',
                'Device Drivers',
                'Debugger'
            ]
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Operating System'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "An operating system manages the computer's resources and provides services to applications."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Examples:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Windows',
                'Linux',
                'macOS',
                'Android',
                'iOS'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `Chrome\n   ↓\nOperating System\n   ↓\nHardware`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Chrome doesn't normally control the hardware directly. It requests services from the operating system."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-application-software',
            text: '2. Application Software'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Application software is designed to help the user perform a specific task.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Examples:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'MS Word → Document creation',
                'Excel → Spreadsheet calculations',
                'Chrome → Web browsing',
                'VLC → Playing media',
                'Photoshop → Image editing'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Simple idea:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `User\n ↓\nApplication Software\n ↓\nSystem Software\n ↓\nHardware`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The notes similarly distinguish system software as hardware-oriented and application software as user-task-oriented.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-system-vs-application',
            text: 'System Software vs Application Software'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `┌───────────────────────────────────────────────┬───────────────────────────────────────┐\n│ System Software                               │ Application Software                  │\n├───────────────────────────────────────────────┼───────────────────────────────────────┤\n│ Manages computer hardware                     │ Performs specific user tasks          │\n│ Works mainly in the background                │ Directly used by users                │\n│ Provides a platform for applications          │ Runs on top of system software        │\n│ OS, compiler, driver                          │ Word processor, browser, media player │\n│ Usually essential for normal system operation │ Installed according to user's needs   │\n└───────────────────────────────────────────────┴───────────────────────────────────────┘`
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-where-does-c-come-in',
            text: 'Where Does C Come In?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'This is important.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'When you write:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `#include <stdio.h>\n\nint main()\n{\n    printf("Hello");\n    return 0;\n}`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'you are writing application/source code.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'But your computer cannot directly execute the C source code. It needs a compiler.'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `C Source Code\n      ↓\n   Compiler\n      ↓\nMachine/Object Code\n      ↓\n    Execution`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The compiler is considered system software because it helps translate programs into a form that the computer can execute.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-important-distinction',
            text: 'One Important Distinction'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't confuse programming language with software."
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'C'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'C is a programming language. It provides rules and syntax for writing programs.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'C Compiler'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A C compiler is software. It translates your C program into machine-understandable code.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'So:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `C = Language\nGCC = Compiler software\nYour .c file = Source program`
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-exam-definition',
            text: 'Exam Definition'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'If they ask: "What is software?"'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            label: 'Exam Answer',
            text: '"Software is a collection of programs or instructions that directs a computer to perform specific tasks."'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'If they ask: "Classify software."'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            label: 'Exam Answer',
            text: '"Software is broadly classified into System Software and Application Software. (Then give 2-3 examples of each)."'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-quick-mental-model',
            text: 'Quick Mental Model'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `                COMPUTER\n                   |\n          ┌────────┴────────┐\n          ↓                 ↓\n       HARDWARE          SOFTWARE\n                            |\n                    ┌───────┴───────┐\n                    ↓               ↓\n              SYSTEM SOFTWARE   APPLICATION\n                    |             SOFTWARE\n                    ↓               ↓\n                OS, Compiler    Chrome, Word\n                Drivers         VLC, etc.`
        },
        {
            type: BLOCK_TYPES.CALLOUT,
            tone: 'info',
            title: 'Next Step',
            text: 'Next 1.5 → Operating System would be the natural continuation from here.'
        }
    ]
};
