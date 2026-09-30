import { describe, it, expect } from 'vitest';
import {
    checkProfileEntitlement,
    PROFILE_FEATURES,
    USER_STATES
} from '../utils/profileEntitlements';
import { DEMO_STUDENT_PROFILE, DEMO_CGPA_CHART_DATA } from '../config/profileDemoData';

describe('Profile 3-State Access Control & Entitlement Engine', () => {

    describe('State 1: Non-logged-in User (Anonymous)', () => {
        const anonymousUser = null;

        it('should correctly identify state as ANONYMOUS', () => {
            const ent = checkProfileEntitlement(anonymousUser, PROFILE_FEATURES.BASIC_PROFILE);
            expect(ent.state).toBe(USER_STATES.ANONYMOUS);
            expect(ent.canAccess).toBe(false);
            expect(ent.isDemo).toBe(true);
            expect(ent.reason).toBe('AUTH_REQUIRED');
        });

        it('should deny access to personal analytics and mark as AUTH_REQUIRED', () => {
            const cgpaEnt = checkProfileEntitlement(anonymousUser, PROFILE_FEATURES.CGPA_PROGRESS);
            expect(cgpaEnt.canAccess).toBe(false);
            expect(cgpaEnt.isDemo).toBe(true);
            expect(cgpaEnt.reason).toBe('AUTH_REQUIRED');

            const attEnt = checkProfileEntitlement(anonymousUser, PROFILE_FEATURES.ATTENDANCE_OVERVIEW);
            expect(attEnt.canAccess).toBe(false);

            const classEnt = checkProfileEntitlement(anonymousUser, PROFILE_FEATURES.TODAY_CLASSES);
            expect(classEnt.canAccess).toBe(false);

            const journeyEnt = checkProfileEntitlement(anonymousUser, PROFILE_FEATURES.ACADEMIC_JOURNEY);
            expect(journeyEnt.canAccess).toBe(false);
        });

        it('should have a realistic synthetic demo profile without leaking real user data', () => {
            expect(DEMO_STUDENT_PROFILE.name).toBe('Aditya Rao');
            expect(DEMO_STUDENT_PROFILE.usn).toBe('1SI23IS000');
            expect(DEMO_STUDENT_PROFILE.branch).toBe('ISE');
            expect(DEMO_STUDENT_PROFILE.section).toBe('A');
            expect(DEMO_STUDENT_PROFILE.labBatch).toBe('1');
            expect(DEMO_CGPA_CHART_DATA.length).toBeGreaterThan(0);
        });
    });

    describe('State 2: Logged-in Free User', () => {
        const freeUser = {
            id: 'user-free-001',
            name: 'Kavya Sharma',
            email: 'kavya.sharma@sit.ac.in',
            usn: '1SI23CS045',
            branch: 'CSE',
            section: 'B',
            labBatch: '2',
            scheme: '2022',
            semester: 4,
            graduationYear: '2027',
            access: { plan: 'FREE', source: 'NONE' },
            socialLinks: { github: 'kavyasharma', linkedin: 'kavya-sharma' }
        };

        it('should grant access to basic profile identity and metadata', () => {
            const basicEnt = checkProfileEntitlement(freeUser, PROFILE_FEATURES.BASIC_PROFILE);
            expect(basicEnt.state).toBe(USER_STATES.FREE);
            expect(basicEnt.canAccess).toBe(true);
            expect(basicEnt.isDemo).toBe(false);
            expect(basicEnt.reason).toBe('BASIC_GRANTED');
        });

        it('should grant access to edit profile, social links, and share profile', () => {
            expect(checkProfileEntitlement(freeUser, PROFILE_FEATURES.EDIT_PROFILE).canAccess).toBe(true);
            expect(checkProfileEntitlement(freeUser, PROFILE_FEATURES.SOCIAL_LINKS).canAccess).toBe(true);
            expect(checkProfileEntitlement(freeUser, PROFILE_FEATURES.SHARE_PROFILE).canAccess).toBe(true);
        });

        it('should lock premium academic analytics and require Plus plan', () => {
            const cgpaEnt = checkProfileEntitlement(freeUser, PROFILE_FEATURES.CGPA_PROGRESS);
            expect(cgpaEnt.canAccess).toBe(false);
            expect(cgpaEnt.isDemo).toBe(false);
            expect(cgpaEnt.reason).toBe('PLUS_REQUIRED');
            expect(cgpaEnt.message).toBe('Unlock with Plus');

            const attEnt = checkProfileEntitlement(freeUser, PROFILE_FEATURES.ATTENDANCE_OVERVIEW);
            expect(attEnt.canAccess).toBe(false);
            expect(attEnt.reason).toBe('PLUS_REQUIRED');

            const classEnt = checkProfileEntitlement(freeUser, PROFILE_FEATURES.TODAY_CLASSES);
            expect(classEnt.canAccess).toBe(false);
            expect(classEnt.reason).toBe('PLUS_REQUIRED');

            const journeyEnt = checkProfileEntitlement(freeUser, PROFILE_FEATURES.ACADEMIC_JOURNEY);
            expect(journeyEnt.canAccess).toBe(false);
            expect(journeyEnt.reason).toBe('PLUS_REQUIRED');
        });
    });

    describe('State 3: Logged-in Plus User', () => {
        const plusUser = {
            id: 'user-plus-001',
            name: 'Rahul Verma',
            email: 'rahul.verma@sit.ac.in',
            usn: '1SI23IS088',
            branch: 'ISE',
            section: 'A',
            labBatch: '1',
            scheme: '2022',
            semester: 4,
            graduationYear: '2027',
            access: { plan: 'PLUS', source: 'PURCHASE' },
            isPlus: true,
            socialLinks: { github: 'rahulverma', linkedin: 'rahul-verma' }
        };

        it('should grant access to basic profile identity and metadata', () => {
            const basicEnt = checkProfileEntitlement(plusUser, PROFILE_FEATURES.BASIC_PROFILE);
            expect(basicEnt.state).toBe(USER_STATES.PLUS);
            expect(basicEnt.canAccess).toBe(true);
            expect(basicEnt.isDemo).toBe(false);
        });

        it('should unlock all premium academic intelligence features', () => {
            const cgpaEnt = checkProfileEntitlement(plusUser, PROFILE_FEATURES.CGPA_PROGRESS);
            expect(cgpaEnt.canAccess).toBe(true);
            expect(cgpaEnt.reason).toBe('PLUS_ACTIVE');

            const attEnt = checkProfileEntitlement(plusUser, PROFILE_FEATURES.ATTENDANCE_OVERVIEW);
            expect(attEnt.canAccess).toBe(true);
            expect(attEnt.reason).toBe('PLUS_ACTIVE');

            const classEnt = checkProfileEntitlement(plusUser, PROFILE_FEATURES.TODAY_CLASSES);
            expect(classEnt.canAccess).toBe(true);
            expect(classEnt.reason).toBe('PLUS_ACTIVE');

            const journeyEnt = checkProfileEntitlement(plusUser, PROFILE_FEATURES.ACADEMIC_JOURNEY);
            expect(journeyEnt.canAccess).toBe(true);
            expect(journeyEnt.reason).toBe('PLUS_ACTIVE');
        });

        it('should unlock individual feature bundles if granted on account', () => {
            const bundleUser = {
                id: 'user-bundle-001',
                name: 'Ananya Deshmukh',
                access: { plan: 'FREE', source: 'NONE' },
                entitlements: [PROFILE_FEATURES.ATTENDANCE_OVERVIEW]
            };

            // ATTENDANCE_OVERVIEW is granted via bundle
            expect(checkProfileEntitlement(bundleUser, PROFILE_FEATURES.ATTENDANCE_OVERVIEW).canAccess).toBe(true);
            // Other features remain locked
            expect(checkProfileEntitlement(bundleUser, PROFILE_FEATURES.CGPA_PROGRESS).canAccess).toBe(false);
            expect(checkProfileEntitlement(bundleUser, PROFILE_FEATURES.TODAY_CLASSES).canAccess).toBe(false);
        });
    });
});
