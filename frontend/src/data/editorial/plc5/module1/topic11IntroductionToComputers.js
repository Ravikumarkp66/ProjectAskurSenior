import { BLOCK_TYPES } from '../../contentModel.js';

export const PLC5_TOPIC_1_1 = {
    subjectSlug: 'plc5',
    moduleSlug: 'module-1',
    topicSlug: 'introduction-to-computers',
    title: '1.1 Introduction to Computers',
    displayLabel: '1.1 Introduction to Computers',
    moduleDisplayTitle: 'M01 · Introduction to C',
    breadcrumbs: ['M01 · Introduction to C', '1.1 Introduction to Computers'],
    sections: [
        { id: 'sec-what-is-computer', title: 'What is a Computer?' },
        { id: 'sec-data-and-information', title: 'Data and Information' },
        { id: 'sec-what-it-does', title: 'What Does a Computer Actually Do?' },
        { id: 'sec-main-parts', title: 'The Main Parts of a Computer' },
        { id: 'sec-more-than-cpu', title: 'A Computer Is More Than Just a CPU' },
        { id: 'sec-simple-example', title: 'One Simple Example' },
        { id: 'sec-different-forms', title: 'Computers Come in Different Forms' },
        { id: 'sec-what-to-remember', title: 'What You Should Remember' }
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
            text: 'You use a computer almost every day.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You open a browser, type something, click a button, watch a video, edit a document, or run a program.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "But since we're about to start programming, it's worth understanding one basic question:"
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'What exactly is a computer?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't need to know how every transistor inside a processor works."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'We just need a clear picture of the main parts and what they do.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
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
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Think about calculating the average marks of a student.'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'You provide the marks.',
                'The computer processes them.',
                'It stores the required data while working.',
                'Finally, it gives you the average as the result.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'So, at a basic level:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `Input → Processing → Output\n            ↕\n          Storage`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That's the basic idea we'll keep coming back to."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-data-and-information',
            text: 'Data and Information'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You will often hear these two words together.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "They aren't exactly the same thing."
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Data means raw facts or figures.',
                'Information is the processed form of that data.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example, suppose the marks are:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: '70, 80, 90'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'These are data.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'If we calculate their average:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: '(70 + 80 + 90) / 3 = 80'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: '80 is information obtained after processing the data.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The supplied course material defines data as raw facts/figures and information as processed data.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-what-it-does',
            text: 'What Does a Computer Actually Do?'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'At a high level, most computer operations can be understood through four basic activities:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'ordered',
            items: [
                'Input: The computer receives data.',
                'Processing: The computer works on that data according to the instructions it has been given.',
                'Storage: Data, information, and the instructions needed by the computer can be stored.',
                'Output: The computer provides the result.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'So you can think of a computer like this:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `                 ┌──────────────┐\nInput ─────────→ │              │ ─────────→ Output\n                 │   Computer   │\n                 │              │\n                 └──────┬───────┘\n                        ↕\n                     Storage`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "This is a high-level functional view. Later, we'll look at the actual devices and components involved in these operations."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-main-parts',
            text: 'The Main Parts of a Computer'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Now let's zoom in slightly."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A computer is not one single thing doing everything. Different components have different responsibilities.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The main functional components include:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `               ┌──────────────┐\n               │  Input Unit  │\n               └──────┬───────┘\n                      ↓\n               ┌──────────────┐\n               │     CPU      │\n               │              │\n               │  ALU + CU    │\n               │  Registers   │\n               └──────┬───────┘\n                      ↕\n               ┌──────────────┐\n               │    Memory    │\n               └──────┬───────┘\n                      ↓\n               ┌──────────────┐\n               │ Output Unit  │\n               └──────────────┘`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The supplied course material describes the CPU as consisting of the ALU, Control Unit, special-purpose registers, and a clock, and describes input, output, and memory as the other major functional components.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't worry if these names are new. We'll understand them one by one."
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'CPU'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'CPU stands for Central Processing Unit. You can think of it as the part responsible for carrying out instructions and performing processing.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The CPU contains important components such as:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'ALU – Arithmetic and Logic Unit',
                'CU – Control Unit',
                'Registers',
                'Clock'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The ALU performs arithmetic and logical operations.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The Control Unit controls how data moves between the different components.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Registers are very small, high-speed storage locations used by the CPU while it works.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The supplied notes also describe instruction execution using the fetch-decode-execute mechanism.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "For now, you don't need to memorize all of this. Just remember:"
        },
        {
            type: BLOCK_TYPES.CALLOUT,
            tone: 'info',
            title: 'Core Concept',
            text: 'CPU = the main processing unit of the computer.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "We'll come back to these components when necessary."
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Memory'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "A computer also needs somewhere to keep data and instructions while it is working. That's where memory comes in."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The course material broadly divides memory into:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Primary Memory: Stores data and programs currently needed by the CPU (e.g., RAM, ROM).',
                'Secondary Memory: Used for larger, longer-term storage and is non-volatile (e.g., Hard disk, SSD, Flash storage).'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "We'll study memory in more detail when required."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-more-than-cpu',
            text: 'A Computer Is More Than Just a CPU'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'This is worth remembering.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'When someone says: "The CPU is the brain of the computer." that\'s only a simple analogy.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A working computer needs different components to work together:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'You need a way to provide input.',
                'You need processing.',
                'You need memory and storage.',
                'You need a way to receive output.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'The computer becomes useful because these components work together.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-simple-example',
            text: 'One Simple Example'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Let\'s say you want the computer to calculate: 25 + 15'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'At a very high level:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `You provide:\n25 and 15\n      ↓\nInput\n      ↓\nComputer processes:\n25 + 15\n      ↓\nResult:\n40\n      ↓\nOutput`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: "That's it."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "The computer doesn't magically \"know\" what you want. It receives data and instructions, processes them, and produces a result."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'That idea becomes very important once we start programming.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-different-forms',
            text: 'Computers Come in Different Forms'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "A computer doesn't have to look like the desktop sitting on your table."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The supplied material classifies computers into types such as supercomputers, mainframes, minicomputers/midrange computers, microcomputers, smartphones, and embedded computers.'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Your laptop is a computer.',
                'Your smartphone is a computer.',
                'An embedded computer inside a machine is also a computer.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The size and purpose may be completely different, but the basic idea remains the same:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: 'receive data → process it → store when needed → produce results.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-what-to-remember',
            text: 'What You Should Remember'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Before moving ahead, make sure these ideas are clear:'
        },
        {
            type: BLOCK_TYPES.CALLOUT,
            tone: 'tip',
            title: 'Summary Checklist',
            text: 'Core principles of computer systems and architecture:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'A computer is an electronic device that accepts input, processes data, stores information, and produces output.',
                'Data is raw facts or figures.',
                'Information is processed data.',
                'The CPU performs the main processing operations.',
                'The ALU performs arithmetic and logical operations.',
                'The Control Unit controls the movement and operation of data and instructions.',
                'Memory stores data and instructions needed by the computer.',
                'Computers can exist in many forms, from personal computers to smartphones and embedded systems.'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "You don't need to memorize the entire diagram right now. Just make sure you have the basic picture in your head:"
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: 'Input → Processing → Storage → Output'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Once that picture is clear, the next topic becomes much easier.'
        }
    ]
};
