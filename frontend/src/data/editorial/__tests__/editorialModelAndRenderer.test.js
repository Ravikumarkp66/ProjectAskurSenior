import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
    BLOCK_TYPES, 
    validateEditorialDocument, 
    extractSectionsFromBlocks 
} from '../contentModel.js';
import { 
    PLC5_TOPIC_0_1_SAMPLE, 
    PLC5_TOPIC_1_1_SAMPLE 
} from '../sample/plc5BasicsSample.js';
import EditorialRenderer from '../../../pages/my-subjects/components/EditorialRenderer.jsx';

describe('Editorial Content Model - Unit Tests', () => {
    it('ED-MODEL-001: exports all required block types', () => {
        expect(BLOCK_TYPES.HEADING).toBe('heading');
        expect(BLOCK_TYPES.PARAGRAPH).toBe('paragraph');
        expect(BLOCK_TYPES.LIST).toBe('list');
        expect(BLOCK_TYPES.BLOCKQUOTE).toBe('blockquote');
        expect(BLOCK_TYPES.CODE).toBe('code');
        expect(BLOCK_TYPES.PREFORMATTED).toBe('preformatted');
        expect(BLOCK_TYPES.FORMULA).toBe('formula');
        expect(BLOCK_TYPES.DIVIDER).toBe('divider');
        expect(BLOCK_TYPES.CALLOUT).toBe('callout');
    });

    it('ED-MODEL-002: validates authentic PLC5 sample documents successfully', () => {
        const res01 = validateEditorialDocument(PLC5_TOPIC_0_1_SAMPLE);
        expect(res01.valid).toBe(true);
        expect(res01.errors).toHaveLength(0);

        const res11 = validateEditorialDocument(PLC5_TOPIC_1_1_SAMPLE);
        expect(res11.valid).toBe(true);
        expect(res11.errors).toHaveLength(0);
    });

    it('ED-MODEL-003: rejects invalid documents with descriptive errors', () => {
        expect(validateEditorialDocument(null).valid).toBe(false);
        expect(validateEditorialDocument({}).valid).toBe(false);

        const invalidBlocks = {
            title: 'Test',
            blocks: [
                { type: 'unknown-block' },
                { type: 'heading' }, // missing text
                { type: 'code' }, // missing code
                { type: 'list', items: [] } // empty list
            ]
        };

        const res = validateEditorialDocument(invalidBlocks);
        expect(res.valid).toBe(false);
        expect(res.errors.length).toBeGreaterThanOrEqual(4);
    });

    it('ED-MODEL-004: extracts Table of Contents sections from heading blocks', () => {
        const blocks = [
            { type: BLOCK_TYPES.HEADING, level: 1, id: 'main-title', text: 'Main Title' },
            { type: BLOCK_TYPES.PARAGRAPH, text: 'Some text' },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-one', text: 'Section One', tocTitle: 'Overview' },
            { type: BLOCK_TYPES.HEADING, level: 3, id: 'sub-sec', text: 'Sub Section' },
            { type: BLOCK_TYPES.HEADING, level: 2, text: 'Section Two Without ID' }
        ];

        const sections = extractSectionsFromBlocks(blocks);
        expect(sections).toHaveLength(3); // Level 1 + Level 2 + Level 2
        expect(sections[0]).toEqual({ id: 'main-title', title: 'Main Title' });
        expect(sections[1]).toEqual({ id: 'sec-one', title: 'Overview' });
        expect(sections[2].id).toBe('section-two-without-id');
        expect(sections[2].title).toBe('Section Two Without ID');
    });
});

describe('EditorialRenderer - Unit Tests', () => {
    it('ED-RENDER-001: returns null gracefully if content is missing or empty', () => {
        const htmlNull = renderToStaticMarkup(React.createElement(EditorialRenderer, { content: null }));
        expect(htmlNull).toBe('');

        const htmlEmpty = renderToStaticMarkup(React.createElement(EditorialRenderer, { content: {} }));
        expect(htmlEmpty).toBe('');
    });

    it('ED-RENDER-002: renders PLC5 0.1 sample with headings, code block, quote, and lists', () => {
        const html = renderToStaticMarkup(
            React.createElement(EditorialRenderer, {
                content: PLC5_TOPIC_0_1_SAMPLE,
                isDark: true
            })
        );

        // Heading 1 and 2
        expect(html).toContain('0.1 Before You Start');
        expect(html).toContain('You Are Not Supposed to Know Everything');
        expect(html).toContain("Don&#x27;t Compare Your Day 1 With Someone Else&#x27;s Year 2");

        // Paragraphs
        expect(html).toContain('You do not need to know programming before learning programming.');

        // Blockquote
        expect(html).toContain('&quot;Everyone already knows coding. What am I even doing here?&quot;');

        // Code block
        expect(html).toContain('#include &lt;stdio.h&gt;');
        expect(html).toContain('printf(&quot;Hello&quot;);');

        // Bullet list
        expect(html).toContain('Someone sitting next to you might already know how to write programs.');

        // Table of Contents
        expect(html).toContain('On This Page');
        expect(html).toContain('Before You Start');
    });

    it('ED-RENDER-003: renders PLC5 1.1 sample with preformatted ASCII flowchart, formula, and callout', () => {
        const html = renderToStaticMarkup(
            React.createElement(EditorialRenderer, {
                content: PLC5_TOPIC_1_1_SAMPLE,
                isDark: false
            })
        );

        // Heading
        expect(html).toContain('1.1 Introduction to Computers');

        // Preformatted ASCII
        expect(html).toContain('Input → Processing → Output');

        // Formula
        expect(html).toContain('Output = Process(Input) + State');
        expect(html).toContain('General computational model relationship.');

        // Callout
        expect(html).toContain('Core Takeaway');
        expect(html).toContain('Every program you write in C will follow this exact cycle');
    });

    it('ED-RENDER-004: supports all heading levels and custom action bar', () => {
        const customDoc = {
            title: 'Heading Test',
            breadcrumbs: ['Topic Test'],
            blocks: [
                { type: BLOCK_TYPES.HEADING, level: 1, text: 'H1 Title' },
                { type: BLOCK_TYPES.HEADING, level: 2, text: 'H2 Title' },
                { type: BLOCK_TYPES.HEADING, level: 3, text: 'H3 Title' },
                { type: BLOCK_TYPES.HEADING, level: 4, text: 'H4 Title' },
                { type: BLOCK_TYPES.LIST, style: 'ordered', items: ['Step 1', 'Step 2'] },
                { type: BLOCK_TYPES.CALLOUT, tone: 'warning', title: 'Caution', text: 'Important notice' }
            ]
        };

        const customActionBar = React.createElement('div', { id: 'test-action-bar' }, 'Footer Buttons');

        const html = renderToStaticMarkup(
            React.createElement(EditorialRenderer, {
                content: customDoc,
                isDark: true,
                actionBar: customActionBar
            })
        );

        expect(html).toContain('H1 Title');
        expect(html).toContain('H2 Title');
        expect(html).toContain('H3 Title');
        expect(html).toContain('H4 Title');
        expect(html).toContain('<ol');
        expect(html).toContain('Step 1');
        expect(html).toContain('Caution');
        expect(html).toContain('Important notice');
        expect(html).toContain('test-action-bar');
    });
});
