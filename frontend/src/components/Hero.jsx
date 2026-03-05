import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/hooks';
import Logo from './Logo';
import './Hero.css';

const ArrowRightIcon = ({ size = 18 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path
            d="M5 12h14m0 0l-6-6m6 6l-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const features = [
    {
        title: 'Study Notes',
        description: 'Comprehensive, well-organized notes for every subject. Find what you need instantly.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M9 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2v0z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        )
    },
    {
        title: 'Previous Year Questions',
        description: 'Practice with curated PYQs to boost your exam confidence and performance.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 7h8M8 11h6M8 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        )
    },
    {
        title: 'CGPA Calculator',
        description: 'Calculate your SGPA and CGPA instantly. Plan your academic targets with precision.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 6h8M8 10h4M14 10h2M8 14h2M14 14h2M8 18h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        )
    },
    {
        title: 'Progress Tracking',
        description: 'Monitor your study progress across modules with detailed analytics and insights.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 12l3-3 4 4 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="7" cy="12" r="1" fill="currentColor" />
                <circle cx="10" cy="9" r="1" fill="currentColor" />
                <circle cx="14" cy="13" r="1" fill="currentColor" />
                <circle cx="19" cy="8" r="1" fill="currentColor" />
            </svg>
        )
    },
    {
        title: 'Smart Notifications',
        description: 'Stay updated with exam schedules, assignment deadlines, and important announcements.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        )
    },
    {
        title: 'Interview Experiences',
        description: 'Real insights from seniors who cracked top companies. Learn from their journey.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M21 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        )
    }
];

const stats = [
    { value: '2,000+', label: 'Active Students' },
    { value: '500+', label: 'Study Materials' },
    { value: '50+', label: 'Subjects Covered' },
    { value: '4.9', label: 'User Rating' }
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

// Optimization: Ensure images are lazy loaded and use WebP where possible
// Note: Hero currently uses mostly inline SVGs which are excellent for performance.

export default function Hero() {
    const { user } = useAuth();

    const handleExploreFeatures = (e) => {
        e.preventDefault();
        const el = document.getElementById('features');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="landing-page">
            {/* Background Elements */}
            <div className="bg-gradient-layer" />
            <div className="bg-grid-pattern" />
            <div className="bg-glow bg-glow-1" />
            <div className="bg-glow bg-glow-2" />

            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-container">
                    <Link to="/" className="nav-logo">
                        <Logo size="md" />
                    </Link>
                    <div className="nav-links">
                        <a href="#features" onClick={handleExploreFeatures} className="nav-link">Features</a>
                        <Link to="/calculator" className="nav-link nav-link-highlight">CGPA Calculator</Link>
                        <Link to="/blog" className="nav-link">Blog</Link>
                        {user ? (
                            <Link to="/dashboard" className="nav-btn nav-btn-primary">Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/login" className="nav-link">Sign In</Link>
                                <Link to="/signup" className="nav-btn nav-btn-primary">Get Started</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <motion.div
                    className="hero-content"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div className="hero-badge" variants={itemVariants}>
                        <span className="badge-pulse" />
                        <span>Trusted by 2,000+ Students</span>
                    </motion.div>

                    <motion.div className="hero-logo-container mb-8" variants={itemVariants}>
                        <Logo size="xl" className="justify-center" />
                    </motion.div>

                    <motion.h1 className="hero-title pt-4" variants={itemVariants}>
                        Your Complete
                        <br />
                        <span className="gradient-text">Academic Companion</span>
                    </motion.h1>

                    <motion.p className="hero-description" variants={itemVariants}>
                        Master your studies with comprehensive notes, curated PYQs, smart CGPA tracking,
                        and real interview experiences. Everything you need to excel—built for students, by students.
                    </motion.p>

                    <motion.div className="availability-banner" variants={itemVariants}>
                        <div className="availability-item available">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>1st Year Materials Available Now</span>
                        </div>
                    </motion.div>

                    <motion.div className="hero-actions" variants={itemVariants}>
                        {user ? (
                            <Link to="/dashboard" className="btn btn-primary">
                                Go to Dashboard
                                <ArrowRightIcon />
                            </Link>
                        ) : (
                            <>
                                <Link to="/signup" className="btn btn-primary">
                                    Start Learning Free
                                    <ArrowRightIcon />
                                </Link>
                                <a href="#features" onClick={handleExploreFeatures} className="btn btn-ghost">
                                    Explore Features
                                </a>
                            </>
                        )}
                    </motion.div>

                    <motion.div className="hero-stats" variants={itemVariants}>
                        {stats.map((stat, i) => (
                            <div key={i} className="stat-item">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="features-section" id="features">
                <div className="section-container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="section-tag">Features</span>
                        <h2 className="section-title">
                            Everything you need to <span className="gradient-text">excel</span>
                        </h2>
                        <p className="section-description">
                            A comprehensive toolkit designed to simplify your academic journey and maximize your success.
                        </p>
                    </motion.div>

                    <motion.div
                        className="features-grid"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={containerVariants}
                    >
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                className="feature-card glass-card"
                                variants={itemVariants}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            >
                                <div className="feature-icon">
                                    {feature.icon}
                                </div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                                <div className="feature-glow" />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* About Section */}
            <section className="about-section" id="about">
                <div className="section-container">
                    <motion.div
                        className="about-content"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="about-text">
                            <span className="section-tag">Academic Tools</span>
                            <h2 className="section-title">
                                Smart <span className="gradient-text">CGPA Calculator</span>
                            </h2>
                            <p className="section-description">
                                Tired of manual calculations? Login to use our SGPA and CGPA calculator
                                to track your academic performance instantly.
                            </p>
                            <div className="about-features">
                                <Link to="/calculator" className="btn btn-primary mb-6 inline-flex">
                                    Open Calculator
                                    <ArrowRightIcon />
                                </Link>
                                <div className="about-feature">
                                    <div className="about-feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span>Curated study materials</span>
                                </div>
                                <div className="about-feature">
                                    <div className="about-feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span>Track your progress</span>
                                </div>
                                <div className="about-feature">
                                    <div className="about-feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span>100% free to use</span>
                                </div>
                            </div>
                        </div>
                        <div className="about-visual glass-card">
                            <div className="visual-content">
                                <div className="visual-stat">
                                    <span className="visual-number gradient-text">98%</span>
                                    <span className="visual-label">Student Satisfaction</span>
                                </div>
                                <div className="visual-bar-group">
                                    <div className="visual-bar">
                                        <span>Notes Quality</span>
                                        <div className="bar-track"><div className="bar-fill" style={{ width: '95%' }}></div></div>
                                    </div>
                                    <div className="visual-bar">
                                        <span>Ease of Use</span>
                                        <div className="bar-track"><div className="bar-fill" style={{ width: '92%' }}></div></div>
                                    </div>
                                    <div className="visual-bar">
                                        <span>Exam Readiness</span>
                                        <div className="bar-track"><div className="bar-fill" style={{ width: '88%' }}></div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Platform Features Section */}
            <section className="platform-section">
                <div className="section-container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="section-tag">Platform</span>
                        <h2 className="section-title">
                            Advanced features that <span className="gradient-text">set us apart</span>
                        </h2>
                        <p className="section-description">
                            Beyond basic study materials, we provide intelligent tools that adapt to your learning journey.
                        </p>
                    </motion.div>

                    <motion.div
                        className="platform-features"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={containerVariants}
                    >
                        <motion.div className="platform-feature glass-card" variants={itemVariants}>
                            <div className="platform-feature-header">
                                <div className="platform-icon">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" />
                                    </svg>
                                </div>
                                <h3>Smart Organization</h3>
                            </div>
                            <p>AI-powered content organization that learns from your study patterns and preferences.</p>
                            <ul className="feature-benefits">
                                <li>Auto-categorized materials</li>
                                <li>Personalized recommendations</li>
                                <li>Quick search & filtering</li>
                            </ul>
                        </motion.div>

                        <motion.div className="platform-feature glass-card" variants={itemVariants}>
                            <div className="platform-feature-header">
                                <div className="platform-icon">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <circle cx="12" cy="17" r="0.5" fill="currentColor" />
                                    </svg>
                                </div>
                                <h3>Community Support</h3>
                            </div>
                            <p>Connect with peers, get help from seniors, and contribute to a collaborative learning environment.</p>
                            <ul className="feature-benefits">
                                <li>Peer feedback system</li>
                                <li>Quality content reviews</li>
                                <li>Bug reporting & fixes</li>
                            </ul>
                        </motion.div>

                        <motion.div className="platform-feature glass-card" variants={itemVariants}>
                            <div className="platform-feature-header">
                                <div className="platform-icon">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M12 20h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h3>Admin Moderation</h3>
                            </div>
                            <p>Quality-controlled content with admin oversight ensures reliable, accurate study materials.</p>
                            <ul className="feature-benefits">
                                <li>Verified study materials</li>
                                <li>Content quality assurance</li>
                                <li>Regular updates & maintenance</li>
                            </ul>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="section-container">
                    <motion.div
                        className="cta-card glass-card"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="cta-glow" />
                        <div className="cta-content">
                            <h2 className="cta-title">
                                Ready to ace your <span className="gradient-text">academics?</span>
                            </h2>
                            <p className="cta-description">
                                Join thousands of students who are already using ASK+ to achieve their academic goals.
                                Start your journey today—completely free.
                            </p>
                            {!user && (
                                <Link to="/signup" className="btn btn-primary btn-lg">
                                    Get Started Now
                                    <ArrowRightIcon />
                                </Link>
                            )}
                            {user && (
                                <Link to="/dashboard" className="btn btn-primary btn-lg">
                                    Continue Learning
                                    <ArrowRightIcon />
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
