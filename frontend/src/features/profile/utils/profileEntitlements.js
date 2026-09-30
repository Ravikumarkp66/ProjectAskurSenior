import { useMemo, useCallback } from 'react';
import { useAuth } from '../../../utils/hooks';

/**
 * Entitlement Architecture:
 * 
 * authentication
 *       ↓
 * identify student
 *       ↓
 * load student profile
 *       ↓
 * check entitlements
 *       ↓
 * render feature
 */

export const PROFILE_FEATURES = {
    // Basic Profile Identity & Metadata (Available for all authenticated users)
    BASIC_PROFILE: 'basic_profile',
    EDIT_PROFILE: 'edit_profile',
    SOCIAL_LINKS: 'social_links',
    SHARE_PROFILE: 'share_profile',

    // Premium Academic Intelligence (Plus Entitlement)
    CGPA_PROGRESS: 'cgpa_progress',
    COMPANIES_VIEW: 'companies_view',
    ATTENDANCE_OVERVIEW: 'attendance_overview',
    TODAY_CLASSES: 'today_classes',
    ACADEMIC_JOURNEY: 'academic_journey',
    ACADEMIC_ANALYTICS: 'academic_analytics'
};

export const USER_STATES = {
    ANONYMOUS: 'ANONYMOUS', // State 1: Non-logged-in visitor
    FREE: 'FREE',           // State 2: Authenticated Free student
    PLUS: 'PLUS'            // State 3: Authenticated Plus student
};

/**
 * Evaluate entitlement for a specific feature key based on user and access record.
 * 
 * Supports future feature-specific bundles / add-on entitlements (e.g. user.entitlements = ['attendance_overview']).
 */
export const checkProfileEntitlement = (user, featureKey) => {
    // State 1: Non-logged-in user
    if (!user) {
        return {
            state: USER_STATES.ANONYMOUS,
            canAccess: false,
            isDemo: true,
            isPremium: true,
            reason: 'AUTH_REQUIRED',
            message: 'Sign in to personalize your profile'
        };
    }

    // Check if user has global Plus access or feature-level entitlement
    const hasGlobalPlus = Boolean(
        user?.access?.plan === 'PLUS' ||
        user?.isPlus ||
        user?.plan === 'plus' ||
        user?.plan === 'PLUS' ||
        user?.subscription === 'plus' ||
        user?.isAdmin ||
        user?.isTestUser
    );

    const hasFeatureEntitlement = Boolean(
        hasGlobalPlus ||
        user?.entitlements?.includes(featureKey) ||
        user?.access?.features?.[featureKey] === true
    );

    // Basic personal identity features are ALWAYS available to any logged-in student
    const isBasicFeature = [
        PROFILE_FEATURES.BASIC_PROFILE,
        PROFILE_FEATURES.EDIT_PROFILE,
        PROFILE_FEATURES.SOCIAL_LINKS,
        PROFILE_FEATURES.SHARE_PROFILE
    ].includes(featureKey);

    if (isBasicFeature) {
        return {
            state: hasGlobalPlus ? USER_STATES.PLUS : USER_STATES.FREE,
            canAccess: true,
            isDemo: false,
            isPremium: false,
            reason: 'BASIC_GRANTED',
            message: 'Available'
        };
    }

    // Premium features check
    if (hasFeatureEntitlement) {
        return {
            state: USER_STATES.PLUS,
            canAccess: true,
            isDemo: false,
            isPremium: true,
            reason: 'PLUS_ACTIVE',
            message: 'Personalized Plus Feature'
        };
    }

    // State 2: Authenticated Free student trying to access a premium feature
    return {
        state: USER_STATES.FREE,
        canAccess: false,
        isDemo: false,
        isPremium: true,
        reason: 'PLUS_REQUIRED',
        message: 'Unlock with Plus'
    };
};

/**
 * Custom React hook for consumable profile entitlements across components.
 */
export const useProfileEntitlements = () => {
    const { user, isAuthenticated, hasPlusAccess } = useAuth();

    const userState = useMemo(() => {
        if (!isAuthenticated || !user) return USER_STATES.ANONYMOUS;
        if (hasPlusAccess) return USER_STATES.PLUS;
        return USER_STATES.FREE;
    }, [isAuthenticated, user, hasPlusAccess]);

    const isAnonymous = userState === USER_STATES.ANONYMOUS;
    const isFree = userState === USER_STATES.FREE;
    const isPlus = userState === USER_STATES.PLUS;

    const checkEntitlement = useCallback((featureKey) => {
        return checkProfileEntitlement(user, featureKey);
    }, [user]);

    const canAccess = useCallback((featureKey) => {
        return checkProfileEntitlement(user, featureKey).canAccess;
    }, [user]);

    return {
        userState,
        isAnonymous,
        isFree,
        isPlus,
        checkEntitlement,
        canAccess
    };
};
