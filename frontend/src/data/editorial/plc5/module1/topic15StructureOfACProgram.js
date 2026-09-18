import { BLOCK_TYPES } from '../../contentModel.js';

export const PLC5_TOPIC_1_5 = {
    subjectSlug: 'plc5',
    moduleSlug: 'module-1',
    topicSlug: 'structure-of-a-c-program',
    title: '1.5 Structure of a C Program',
    displayLabel: '1.5 Structure of a C Program',
    moduleDisplayTitle: 'M01 · Introduction to C',
    breadcrumbs: ['M01 · Introduction to C', '1.5 Structure of a C Program'],
    sections: [
        { id: 'sec-intro', title: 'Introduction' },
        { id: 'sec-basic-structure', title: 'Basic Structure' },
        { id: 'sec-documentation', title: 'Documentation Section' },
        { id: 'sec-link', title: 'Link Section' },
        { id: 'sec-definition', title: 'Definition Section' },
        { id: 'sec-global-declaration', title: 'Global Declaration Section' },
        { id: 'sec-main', title: 'main() Section' },
        { id: 'sec-subprogram', title: 'Subprogram Section' },
        { id: 'sec-putting-it-together', title: 'Putting It Together' },
        { id: 'sec-things-to-notice', title: 'A Few Things You Should Notice' },
        { id: 'sec-complete-picture', title: 'The Complete Picture' }
    ],
    blocks: [
        {
            type: BLOCK_TYPES.HEADING,
            level: 1,
            id: 'sec-intro',
            text: '1.5 Structure of a C Program'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Okay, now we're going to look at something you'll see in almost every C program."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'When you first see a C program, it can look like a lot of symbols and words thrown together.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `#include <stdio.h>

int main()
{
    int a, b, sum;

    printf("Enter two numbers: ");
    scanf("%d%d", &a, &b);

    sum = a + b;

    printf("Sum = %d", sum);

    return 0;
}`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't try to memorize this entire program."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'lead',
            text: "Instead, let's understand how a C program is organized."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-basic-structure',
            text: 'Basic Structure'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A C program can be divided into different sections.'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `Documentation Section
        ↓
Link Section
        ↓
Definition Section
        ↓
Global Declaration Section
        ↓
main() Section
        ↓
Subprogram Section`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The course material presents the structure of a C program using these sections.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Not every small program will necessarily contain every section.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Let's understand what each one means."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-documentation',
            text: 'Documentation Section'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'This section contains comments that can describe the program, author, purpose, or other useful information.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `// Program to add two numbers`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'or:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `/*
   Program to calculate
   the area of a rectangle
*/`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Comments are ignored by the compiler.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'There are two common forms:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `// Single-line comment

/* Multi-line
   comment */`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'The main purpose is to make the program easier for humans to understand.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-link',
            text: 'Link Section'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The link section contains instructions that allow the program to use functions from library files.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `#include <stdio.h>`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Here, stdio.h is a header file that provides declarations for standard input/output functions such as printf() and scanf().'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'So when you write:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `#include <stdio.h>`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "you're basically telling the program that you'll be using facilities provided through this header."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-definition',
            text: 'Definition Section'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The definition section is used to define symbolic constants.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `#define PI 3.14159`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Here, PI represents the value 3.14159.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'muted',
            text: 'The definition section is optional. You only need it when your program requires such definitions.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-global-declaration',
            text: 'Global Declaration Section'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Sometimes a variable or function needs to be declared outside the main() function.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Such declarations can be placed in the global declaration section.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `int count;`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A variable declared outside all functions is a global variable and can be accessed according to its scope.'
        },
        {
            type: BLOCK_TYPES.CALLOUT,
            variant: 'note',
            title: 'Scope Note',
            text: "You don't need to worry deeply about global variables yet. We'll study variables and scope in more detail later."
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-main',
            text: 'main() Section'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Now we reach the most important part.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            variant: 'medium',
            text: 'Every C program has a main() function, and program execution begins from main().'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A simple main() looks like:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `int main()
{
    // statements
}`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The curly braces { } mark the beginning and end of the function body.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Inside them, we write the statements that need to be executed.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The main() section can broadly contain:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `main()
{
    Declaration Part
    Executable Part
}`
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Declaration Part'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Variables required by the function can be declared here.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `int a, b, sum;`
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Executable Part'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'These are the statements that actually perform the required operations.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `sum = a + b;

printf("%d", sum);`
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-subprogram',
            text: 'Subprogram Section'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A C program can also contain functions written by the programmer.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'These are called user-defined functions.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `int add(int a, int b)
{
    return a + b;
}`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "We won't go deeply into functions here because they are covered later in the course."
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For now, just remember that additional functions can be written outside main().'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-putting-it-together',
            text: 'Putting It Together'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Let's look at a simple program again:"
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `#include <stdio.h>

int main()
{
    int a, b, sum;

    printf("Enter two numbers: ");
    scanf("%d%d", &a, &b);

    sum = a + b;

    printf("Sum = %d", sum);

    return 0;
}`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Now it should look much less confusing.'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `#include <stdio.h>
        ↓
Link Section

int main()
{
        ↓
Declaration
        ↓
Executable Statements
        ↓
return 0;
}`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The program starts executing from main() and follows the statements inside it.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-things-to-notice',
            text: 'A Few Things You Should Notice'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Every statement usually ends with ;'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `int a;
a = 10;
printf("%d", a);`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'The semicolon marks the end of a statement.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: '{ } define a block'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'For example:'
        },
        {
            type: BLOCK_TYPES.CODE,
            language: 'c',
            code: `int main()
{
    // body of main
}`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Everything inside the braces belongs to that function.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'main() is special'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Unlike ordinary functions, main() is the function from which execution of a C program begins.'
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 3,
            text: 'Comments are for humans'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'Comments help us understand the program, but the compiler does not execute them.'
        },
        {
            type: BLOCK_TYPES.DIVIDER
        },
        {
            type: BLOCK_TYPES.HEADING,
            level: 2,
            id: 'sec-complete-picture',
            text: 'The Complete Picture'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'A commonly presented structure is:'
        },
        {
            type: BLOCK_TYPES.PREFORMATTED,
            text: `┌──────────────────────────────┐
│ Documentation Section        │
├──────────────────────────────┤
│ Link Section                 │
├──────────────────────────────┤
│ Definition Section           │
├──────────────────────────────┤
│ Global Declaration Section   │
├──────────────────────────────┤
│ main() Section               │
│                              │
│   Declaration Part           │
│   Executable Part            │
├──────────────────────────────┤
│ Subprogram Section           │
│   Function 1                 │
│   Function 2                 │
│   ...                        │
└──────────────────────────────┘`
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: 'You may see slightly different representations of this structure in different books or examples.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Don't get stuck trying to force every C program into every section."
        },
        {
            type: BLOCK_TYPES.CALLOUT,
            variant: 'info',
            title: 'Key Takeaway',
            text: 'The important thing is to understand how the pieces of a C program are organized and where the actual execution begins.'
        },
        {
            type: BLOCK_TYPES.PARAGRAPH,
            text: "Once you're comfortable with this structure, the next topics will start making much more sense because you'll know where the things you're learning actually fit into a C program."
        }
    ]
};
