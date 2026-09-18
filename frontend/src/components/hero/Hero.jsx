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

import {
    fetchHeroContent,
    fetchHeroStats
} from './heroAPI';

import {
    DEFAULT_HERO_CONTENT,
    DEFAULT_HERO_STATS
} from './heroConfig';

export default function Hero() {
    const [content, setContent] = useState(DEFAULT_HERO_CONTENT);
    const [stats, setStats] = useState(DEFAULT_HERO_STATS);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const [cData, sData] = await Promise.all([
                    fetchHeroContent(),
                    fetchHeroStats()
                ]);

                if (isMounted) {
                    if (cData) setContent(cData);
                    if (sData && sData.length > 0) setStats(sData);
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
        <section className="relative w-full bg-[#F8FAFC] dark:bg-[#080B14] font-outfit overflow-hidden pt-24 pb-14 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            {/* Subtle Hero Background Accent (No giant neon glow) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-purple-100/40 via-transparent to-transparent dark:from-purple-950/20 dark:via-transparent dark:to-transparent pointer-events-none -z-0" />

            {/* Main Container */}
            <div className="relative z-10 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
                    
                    {/* LEFT SIDE: Hero Information & CTAs (7 cols on desktop) */}
                    <div className="lg:col-span-7 flex flex-col items-start text-left">
                        {/* 1. Announcement Badge */}
                        <AnnouncementBadge announcement={content.announcement} />

                        {/* 2. Main Heading */}
                        <HeroHeading />

                        {/* 3. Brand Philosophy Statement */}
                        <BrandStatement />

                        {/* 4. Short Description */}
                        <HeroDescription description={content.description} />

                        {/* 5. CTAs: Go to Dashboard & Explore Plus */}
                        <HeroButtons />

                        {/* 6. Dynamic Live Platform Statistics Strip */}
                        <HeroStatistics stats={stats} />
                    </div>

                    {/* RIGHT SIDE: AskUrSenior Product Showcase (5 cols on desktop) */}
                    <div className="lg:col-span-5 w-full pt-2 lg:pt-4">
                        <HeroPreview />
                    </div>

                </div>
            </div>
        </section>
    );
}
