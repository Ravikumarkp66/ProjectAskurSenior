/**
 * PLC5 (Introduction to C) Structured Editorial Content Registry
 * 
 * Central registry and access point for all migrated PLC5 editorial study sheets.
 * Provides lookups by module slug + topic slug or topic slug alone.
 */

import {
    PLC5_TOPIC_0_1,
    PLC5_TOPIC_0_2,
    PLC5_TOPIC_0_3,
    PLC5_TOPIC_0_4,
    PLC5_TOPIC_0_5,
    PLC5_TOPIC_0_6,
    PLC5_TOPIC_0_7
} from './basics/index.js';

import {
    PLC5_TOPIC_1_1,
    PLC5_TOPIC_1_2,
    PLC5_TOPIC_1_4,
    PLC5_TOPIC_1_5
} from './module1/index.js';

export * from './basics/index.js';
export * from './module1/index.js';

/**
 * All currently migrated PLC5 topics indexed by composite key: `${moduleSlug}/${topicSlug}`
 */
export const PLC5_EDITORIAL_TOPICS = {
    'basics/before-you-start': PLC5_TOPIC_0_1,
    'basics/why-programming': PLC5_TOPIC_0_2,
    'basics/common-myths': PLC5_TOPIC_0_3,
    'basics/no-coding-background': PLC5_TOPIC_0_4,
    'basics/how-to-learn': PLC5_TOPIC_0_5,
    'basics/how-to-practice': PLC5_TOPIC_0_6,
    'basics/using-askursenior': PLC5_TOPIC_0_7,
    'module-1/introduction-to-computers': PLC5_TOPIC_1_1,
    'module-1/input-and-output-devices': PLC5_TOPIC_1_2,
    'module-1/software-basics': PLC5_TOPIC_1_4,
    'module-1/structure-of-a-c-program': PLC5_TOPIC_1_5
};

/**
 * All currently migrated PLC5 topics indexed by topicSlug
 */
export const PLC5_TOPICS_BY_SLUG = {
    'before-you-start': PLC5_TOPIC_0_1,
    'why-programming': PLC5_TOPIC_0_2,
    'common-myths': PLC5_TOPIC_0_3,
    'no-coding-background': PLC5_TOPIC_0_4,
    'how-to-learn': PLC5_TOPIC_0_5,
    'how-to-practice': PLC5_TOPIC_0_6,
    'using-askursenior': PLC5_TOPIC_0_7,
    'introduction-to-computers': PLC5_TOPIC_1_1,
    'input-and-output-devices': PLC5_TOPIC_1_2,
    'software-basics': PLC5_TOPIC_1_4,
    'structure-of-a-c-program': PLC5_TOPIC_1_5
};

/**
 * Resolves a PLC5 topic editorial document.
 * 
 * @param {string} moduleSlug - e.g. 'basics', 'module-1'
 * @param {string} topicSlug - e.g. 'before-you-start', 'introduction-to-computers'
 * @returns {Object|null} The structured editorial document or null if not found
 */
export function getPLC5TopicEditorial(moduleSlug, topicSlug) {
    if (!topicSlug) return null;
    if (moduleSlug) {
        const normalizedMod = moduleSlug === 'module1' ? 'module-1' : moduleSlug;
        const compositeKey = `${normalizedMod}/${topicSlug}`;
        if (PLC5_EDITORIAL_TOPICS[compositeKey]) {
            return PLC5_EDITORIAL_TOPICS[compositeKey];
        }
    }
    return PLC5_TOPICS_BY_SLUG[topicSlug] || null;
}
