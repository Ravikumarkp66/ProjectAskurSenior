/**
 * companies.js — Scalable frontend reference dataset for placement companies.
 *
 * Each entry maps to a company in the `companies` collection in MongoDB.
 * Fields here serve as a frontend display fallback when the DB company record
 * does not yet have cgpaCutoff populated.
 *
 * Future fields to add per company (without changing component structure):
 *   - eligibleBranches: ['ISE', 'CSE', 'ECE']
 *   - hiringStatus: 'active' | 'past' | 'upcoming'
 *   - roles: ['SDE', 'SDE-2', 'Analyst']
 *   - experienceCount: derived from experiences collection via API
 */
export const companiesConfig = [
    {
        name: 'AMAZON',
        type: 'Product',
        cutoff: 8.0
    },
    {
        name: 'Oracle',
        type: 'Product',
        cutoff: 8.0
    },
    {
        name: 'Adobe',
        type: 'Product',
        cutoff: 8.75
    },
    {
        name: 'Morgan Stanley',
        type: 'Product',
        cutoff: 7.5
    },
    {
        name: 'Juspay',
        type: 'Product',
        cutoff: 7.0
    },
    {
        name: 'HSBC',
        type: 'Service',
        cutoff: 7.0
    },
    {
        name: 'Tally Solutions',
        type: 'Product',
        cutoff: 6.5
    },
    {
        name: 'redBus',
        type: 'Product',
        cutoff: 7.5
    },
    {
        name: 'British Telecom',
        type: 'Product',
        cutoff: 7.0
    },
    {
        name: 'Impact Analytics',
        type: 'Product',
        cutoff: 7.5
    }
];
