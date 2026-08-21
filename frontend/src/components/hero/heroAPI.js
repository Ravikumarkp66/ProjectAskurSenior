/**
 * heroAPI.js
 * ─────────────────────────────────────────────────────────
 * Fetches dynamic Hero Content, MongoDB Statistics, and Activity Feed
 * from the backend API, with fallback to heroConfig.js if server is offline.
 * ─────────────────────────────────────────────────────────
 */

import { apiClient } from '../../services/api';
import {
    DEFAULT_HERO_CONTENT,
    DEFAULT_HERO_STATS,
    DEFAULT_LIVE_ACTIVITIES
} from './heroConfig';

/**
 * Fetch Hero CMS Content
 */
export async function fetchHeroContent() {
    try {
        const res = await apiClient.get('/hero/content');
        if (res.data?.success && res.data?.data) {
            return res.data.data;
        }
        return DEFAULT_HERO_CONTENT;
    } catch (err) {
        return DEFAULT_HERO_CONTENT;
    }
}

/**
 * Fetch Live MongoDB Statistics
 */
export async function fetchHeroStats() {
    try {
        const res = await apiClient.get('/hero/stats');
        if (res.data?.success && res.data?.data) {
            const d = res.data.data;
            return [
                { key: "resources", count: d.resources || 355, label: "Resources", prefix: "✔ ", desc: "Notes, PYQs & Question Banks" },
                { key: "students", count: d.students || 900, label: "Students", prefix: "✔ ", desc: "Active SIT Learners" },
                { key: "companies", count: d.companies || 12, label: "Companies", prefix: "✔ ", desc: "Interview Insights" },
                { key: "community", count: d.community || 2000, label: "2000+ Students", prefix: "whatsapp", desc: "WhatsApp Peer Network" }
            ];
        }
        return DEFAULT_HERO_STATS;
    } catch (err) {
        return DEFAULT_HERO_STATS;
    }
}

/**
 * Fetch Recent Real Database Activities
 */
export async function fetchHeroActivities() {
    try {
        const res = await apiClient.get('/hero/activities');
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
            return res.data.data;
        }
        return DEFAULT_LIVE_ACTIVITIES;
    } catch (err) {
        return DEFAULT_LIVE_ACTIVITIES;
    }
}
