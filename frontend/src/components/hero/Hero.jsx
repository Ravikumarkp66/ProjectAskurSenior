/**
 * Hero.jsx — AskUrSenior V3 Hero Orchestrator Component
 * ─────────────────────────────────────────────────────────
 * Architecture:
 *   Hero
 *   ├── AnnouncementBadge
 *   ├── HeroHeading
 *   ├── BrandStatement
 *   ├── HeroDescription
 *   ├── HeroButtons
 *   ├── HeroStatistics
 *   ├── HeroPreview
 *   └── FloatingActivity
 *
 * Responsive 2-column layout with generous spacing, premium SaaS design,
 * ambient glow backdrop, and dynamic data fetching from MongoDB backend.
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import AnnouncementBadge from './AnnouncementBadge';
import HeroHeading from './HeroHeading';
import BrandStatement from './BrandStatement';
import HeroDescription from './HeroDescription';
import HeroButtons from './HeroButtons';
import HeroStatistics from './HeroStatistics';
import HeroPreview from './HeroPreview';
import FloatingActivity from './FloatingActivity';

import {
    fetchHeroContent,
    fetchHeroStats,
    fetchHeroActivities
} from './heroAPI';

import {
    DEFAULT_HERO_CONTENT,
    DEFAULT_HERO_STATS,
    DEFAULT_LIVE_ACTIVITIES
} from './heroConfig';

export default function Hero() {
    const [content, setContent] = useState(DEFAULT_HERO_CONTENT);
    const [stats, setStats] = useState(DEFAULT_HERO_STATS);
    const [activities, setActivities] = useState(DEFAULT_LIVE_ACTIVITIES);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const [cData, sData, aData] = await Promise.all([
                    fetchHeroContent(),
                    fetchHeroStats(),
                    fetchHeroActivities()
                ]);

                if (isMounted) {
                    if (cData) setContent(cData);
                    if (sData && sData.length > 0) setStats(sData);
                    if (aData && aData.length > 0) setActivities(aData);
                }
            } catch (e) {
                // Fail silently and keep defaults
            }
        }

        loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="relative min-h-dvh w-full bg-[#030712] font-outfit overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-24 px-4 sm:px-6 lg:px-12">
            {/* Ambient Glow & Grid Layers */}
            <div className="absolute inset-0 bg-radial-glow pointer-events-none z-0 opacity-40 dark:opacity-100" />
            <div className="absolute inset-0 bg-grid-pattern opacity-15 dark:opacity-30 pointer-events-none z-0" />

            {/* Glowing Orbs — Softened in light mode to prevent text wash-out */}
            <div className="absolute top-10 left-1/4 w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none opacity-40 dark:opacity-100" />
            <div className="absolute top-20 right-5 sm:right-10 w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none opacity-40 dark:opacity-100" />

            {/* Main Container */}
            <div className="relative z-10 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    
                    {/* LEFT SIDE: Hero Information & CTAs (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
                        {/* Announcement Badge */}
                        <AnnouncementBadge announcement={content.announcement} />

                        {/* Main Heading */}
                        <HeroHeading heading={content.heading} />

                        {/* Brand Philosophy Statement */}
                        <BrandStatement brandStatement={content.brandStatement} />

                        {/* Short Description */}
                        <HeroDescription description={content.description} />

                        {/* CTAs: Start For Free & Explore Plus */}
                        <HeroButtons
                            primaryCTA={content.primaryCTA}
                            secondaryCTA={content.secondaryCTA}
                        />

                        {/* Dynamic Live Platform Statistics */}
                        <HeroStatistics stats={stats} />
                    </div>

                    {/* RIGHT SIDE: Interactive Product Showcase & Live Floating Cards (5 cols) */}
                    <div className="lg:col-span-5 relative w-full flex items-center justify-center">
                        {/* Floating Live Activity Cards */}
                        <FloatingActivity activities={activities} />

                        {/* 5-Second Rotating Showcase Preview */}
                        <HeroPreview />
                    </div>

                </div>
            </div>
        </div>
    );
}
