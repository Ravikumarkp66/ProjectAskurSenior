import { BLOCK_TYPES } from '../../contentModel.js';

export const PLC5_TOPIC_1_2 = {
    subjectSlug: 'plc5',
    moduleSlug: 'module-1',
    topicSlug: 'input-and-output-devices',
    title: '1.2 Input and Output Devices',
    displayLabel: '1.2 Input and Output Devices',
    moduleDisplayTitle: 'M01 · Introduction to C',
    breadcrumbs: ['M01 · Introduction to C', '1.2 Input and Output Devices'],
    sections: [
        { id: 'sec-intro', title: 'Introduction' },
        { id: 'sec-input-devices', title: 'Input Devices' },
        { id: 'sec-keyboard', title: 'Keyboard' },
        { id: 'sec-pointing-devices', title: 'Pointing Devices' },
        { id: 'sec-scanner', title: 'Scanner & OCR' },
        { id: 'sec-other-input', title: 'Other Input Devices' },
        { id: 'sec-output-devices', title: 'Output Devices' },
        { id: 'sec-monitor', title: 'Monitor' },
        { id: 'sec-printer', title: 'Printer' },
        { id: 'sec-impact-printers', title: 'Impact Printers' },
        { id: 'sec-non-impact-printers', title: 'Non-Impact Printers' },
        { id: 'sec-plotter', title: 'Plotter' },
        { id: 'sec-input-vs-output', title: 'Input vs Output Devices' },
        { id: 'sec-simple-example', title: 'A Simple Example' },
        { id: 'sec-remember', title: 'Remember' }
    ],
    blocks: [
        {
            type: BLOCK_TYPES.HEADING,
            level: 1,
            id: 'sec-intro',
            text: '1.2 Input and Output Devices'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A computer needs a way to communicate with the outside world.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You give data to the computer, the computer processes it, and it gives you a result.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'The devices used for these two purposes are called input devices and output devices.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-input-devices',
            text: 'Input Devices'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'An input device is a hardware device used to enter data or instructions into a computer.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Some common input devices are:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Keyboard',
                'Mouse',
                'Touchpad',
                'Joystick',
                'Stylus',
                'Scanner',
                'Barcode reader',
                'Digital camera'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The basic idea is:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `User\n  ↓\nInput Device\n  ↓\nComputer`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example, when you type your name using a keyboard, the keyboard sends that input to the computer.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-keyboard',
            text: 'Keyboard'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The keyboard is one of the most common input devices.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'It is used to enter:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Letters',
                'Numbers',
                'Symbols',
                'Special characters',
                'Commands'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Most keyboards use the QWERTY layout.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Each letter, number, or symbol entered through the keyboard is treated as a character. The course material also associates characters with unique ASCII values.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `A\n7\n@\n+`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'are all characters that can be entered through a keyboard.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-pointing-devices',
            text: 'Pointing Devices'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A pointing device is used to control the position of the cursor on the screen.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The most common examples are:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Mouse',
                'Touchpad'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A mouse can be used to:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Select an item',
                'Open an item',
                'Move objects',
                'Access options'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The traditional mouse used a rotating ball, while modern optical mice use light-based sensing. Wireless mice commonly use radio-frequency communication.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A laptop usually provides a touchpad as an alternative to a mouse.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-scanner',
            text: 'Scanner'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A scanner is an input device that creates a digital image of a physical document by optically scanning it.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example, suppose you have a printed document:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `Physical Document\n       ↓\n    Scanner\n       ↓\nDigital Image`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The digital version can then be stored or processed by the computer.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'OCR'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Modern scanners may provide OCR (Optical Character Recognition).'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'OCR can recognize text from a scanned image and convert it into characters that a computer can process.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `Printed document\n       ↓\n     Scanner\n       ↓\n     OCR\n       ↓\nEditable text`
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-other-input',
            text: 'Other Input Devices'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'There are many other devices used to provide input to a computer.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Joystick'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A joystick is commonly used to control movement in games and simulations.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Stylus'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A stylus is a pen-like device used to interact with touch-sensitive screens.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Barcode Reader'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A barcode reader reads information encoded in a barcode and sends it to the computer.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Digital Camera'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A digital camera captures images in digital form, which can then be transferred to a computer.'
        },
        {
            type: BLOCK_TYPES.CALLOUT,
            tone: 'info',
            title: 'Takeaway',
            text: 'These are all input devices because they provide data to the computer.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-output-devices',
            text: 'Output Devices'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'An output device is a hardware device used to present the information produced by a computer.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Some common output devices are:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Monitor',
                'Speaker',
                'Printer',
                'Plotter'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The basic idea is:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `Computer\n    ↓\nOutput Device\n    ↓\nUser`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example, when a program displays the result 80 on your screen, the monitor is providing the output.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-monitor',
            text: 'Monitor'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A monitor is an output device that displays text, graphics, images, and other visual information.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The performance of a monitor can be considered in terms of factors such as:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Image quality',
                'Resolution',
                'Energy consumption'
            ]
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'CRT Monitor'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'CRT stands for Cathode Ray Tube. CRT monitors use electron guns inside a tube to produce images. They are large and heavy compared with modern displays.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'LCD Monitor'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'LCD stands for Liquid Crystal Display. LCD monitors use liquid crystals to form images and generally consume less power than CRT monitors.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-printer',
            text: 'Printer'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A printer produces a hard copy of computer output on paper.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Printers can broadly be classified into:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `Printers\n├── Impact Printers\n└── Non-Impact Printers`
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-impact-printers',
            text: 'Impact Printers'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Impact printers produce output by physically striking the printing mechanism against a ribbon or paper. They are generally older and noisier types of printers.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Examples include:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Dot-matrix printer',
                'Daisy-wheel printer',
                'Line printer'
            ]
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Dot-Matrix Printer'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A dot-matrix printer uses pins that strike a ribbon to create characters and images on paper. It can produce multiple copies and is relatively low in print quality.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Daisy-Wheel Printer'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A daisy-wheel printer uses a wheel containing individual characters. Different wheels can be used for different sets of fonts.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Line Printer'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A line printer prints an entire line at a time. It is used where large amounts of printing are required.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-non-impact-printers',
            text: 'Non-Impact Printers'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Non-impact printers do not require physical striking of the printing mechanism against the paper. They are generally faster, quieter, and capable of producing higher-quality output.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Common examples include:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Laser printer',
                'Ink-jet printer'
            ]
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Laser Printer'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A laser printer uses toner to produce output on paper. It works using a process similar in principle to photocopying.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Ink-Jet Printer'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'An ink-jet printer produces output by spraying tiny drops of ink onto paper. It is commonly used for everyday printing.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-plotter',
            text: 'Plotter'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A plotter is an output device used to produce drawings, especially large and precise drawings.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'It can use automated pens and is suitable for applications such as:'
        },
        {
            type: BLOCK_TYPES.LIST,
            style: 'bullet',
            items: [
                'Building drawings',
                'Engineering drawings',
                'Machine designs'
            ]
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Plotters can handle large paper sizes and are generally slower and more expensive than ordinary printers.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-input-vs-output',
            text: 'Input vs Output Devices'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The easiest way to remember the difference is to ask:'
        },
        {
            type: BLOCK_TYPES.BLOCKQUOTE,
            label: 'Key Question',
            text: '"Is the device giving information to the computer or receiving information from the computer?"'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `┌─────────────────────────────┬─────────────────────────────────────────────────┐\n│ Input Device                │ Output Device                                   │\n├─────────────────────────────┼─────────────────────────────────────────────────┤\n│ Sends data to the computer  │ Receives/presents information from the computer │\n│ Used for entering data      │ Used for displaying results                     │\n│ Keyboard                    │ Monitor                                         │\n│ Mouse                       │ Printer                                         │\n│ Scanner                     │ Speaker                                         │\n│ Joystick                    │ Plotter                                         │\n│ Barcode reader              │ —                                               │\n│ Digital camera              │ —                                               │\n└─────────────────────────────┴─────────────────────────────────────────────────┘`
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-simple-example',
            text: 'A Simple Example'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Suppose you type two numbers: 25 and 15 using a keyboard.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The flow is:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `Keyboard\n   ↓\nInput\n   ↓\nComputer processes 25 + 15\n   ↓\nResult = 40\n   ↓\nMonitor\n   ↓\nOutput`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'So the keyboard is an input device, while the monitor is an output device.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "That's the basic difference you should keep in mind."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-remember',
            text: 'Remember'
        },
        {
            type: BLOCK_TYPES.CALLOUT,
            tone: 'success',
            title: 'Key Takeaways',
            text: '• Input devices are used to enter data and instructions into a computer.\n• Output devices are used to present the results produced by a computer.\n• Keyboard, mouse, scanner, joystick, and barcode reader are examples of input devices.\n• Monitor, printer, speaker, and plotter are examples of output devices.\n• Printers can be broadly classified as impact and non-impact printers.\n• A scanner converts physical documents into digital form.\n• A plotter is mainly used for large and precise drawings.'
        }
    ]
};
