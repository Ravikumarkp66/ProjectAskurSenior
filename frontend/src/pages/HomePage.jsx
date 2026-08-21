import { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import Hero from '../components/hero/Hero';
import PlatformFeaturesSection from '../components/landing/PlatformFeaturesSection';
import ComparisonSection from '../components/landing/ComparisonSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import CommunityContributorsSection from '../components/landing/CommunityContributorsSection';
import CreatorSection from '../components/CreatorSection';
import FaqSection from '../components/landing/FaqSection';
import Footer from '../components/Footer';

import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';
import { landingPageAPI } from '../services/api';

const HomePage = () => {
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [landingData, setLandingData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        landingPageAPI.getLandingPage()
            .then(res => {
                if (isMounted && res.data?.data) {
                    setLandingData(res.data.data);
                    // Set page title strictly to AskUrSenior - One Stop Platform
                    document.title = 'AskUrSenior - One Stop Platform';
                }
            })
            .catch(err => {
                console.error('Failed to fetch landing page config:', err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-[#030712] font-outfit">
            {/* V3 Global Navbar */}
            <Navbar />
            <main className="flex-1 relative z-10">
                {/* Hero Section */}
                <Hero />

                {/* Platform Features Section (Below Hero) */}
                <PlatformFeaturesSection data={landingData?.platformFeatures} />

                {/* Without vs With AskUrSenior Comparison Table */}
                <ComparisonSection data={landingData?.comparison} />

                {/* Testimonials Section (Below Comparison Table) */}
                <TestimonialsSection data={landingData?.testimonials} />

                {/* Community Contributors Section (Below Testimonials, Above Creator) */}
                <CommunityContributorsSection data={landingData?.communityContributors} />

                {/* Creator Section */}
                <CreatorSection />

                {/* Frequently Asked Questions (FAQ) Section */}
                <FaqSection data={landingData?.faqs} />
            </main>

            {/* Redesigned Compact Centered SaaS Footer */}
            <Footer 
                onOpenTerms={() => setShowTerms(true)}
                onOpenPrivacy={() => setShowPrivacy(true)}
            />

            <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
            />
            <PrivacyModal
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
            />
        </div>
    );
};

export default HomePage;
