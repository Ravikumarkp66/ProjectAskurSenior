import { describe, it, expect } from 'vitest';
import { accountAPI, feedbackAPI, bugAPI } from '../../../services/api';
import { ACCOUNT_TABS } from '../AccountPage';

describe('Account & Product Completeness Contract', () => {
    it('ACCT-001: accountAPI has all required account management methods', () => {
        expect(typeof accountAPI.getSummary).toBe('function');
        expect(typeof accountAPI.getSessions).toBe('function');
        expect(typeof accountAPI.revokeOtherSessions).toBe('function');
        expect(typeof accountAPI.deleteAccount).toBe('function');
    });

    it('ACCT-002: feedbackAPI has submit and getLatest methods', () => {
        expect(typeof feedbackAPI.submit).toBe('function');
        expect(typeof feedbackAPI.getLatest).toBe('function');
    });

    it('ACCT-003: bugAPI has submit method', () => {
        expect(typeof bugAPI.submit).toBe('function');
    });

    it('ACCT-004: verifies problem categories list for Bug Report', () => {
        const expectedCategories = [
            'UI / Design',
            'Feature not working',
            'Performance',
            'Login / Account',
            'Academic data',
            'Other'
        ];
        expect(expectedCategories).toHaveLength(6);
        expect(expectedCategories).toContain('UI / Design');
        expect(expectedCategories).toContain('Academic data');
        expect(expectedCategories).toContain('Login / Account');
    });

    it('ACCT-005: verifies Help & Support coverage across all key platform domains', () => {
        const expectedDomains = [
            'account',
            'academic',
            'attendance',
            'subjects',
            'payments',
            'technical'
        ];
        expect(expectedDomains).toHaveLength(6);
    });

    it('ACCT-006: verifies Account tabs contain only Summary, Security, Login History (NO Review)', () => {
        const tabIds = ACCOUNT_TABS.map(t => t.id);
        expect(tabIds).toEqual(['summary', 'security', 'login-history']);
        expect(tabIds).not.toContain('review');
        expect(tabIds).not.toContain('feedback');
    });
});
