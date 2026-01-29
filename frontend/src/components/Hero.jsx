import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './Hero.css';

const ArrowRightIcon = ({ size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="hero-button-icon"
    >
        <path
            d="M5 12h12m0 0-5-5m5 5-5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const FeatureIcon = ({ children }) => (
    <div className="feature-icon-container">
        <div className="feature-icon">{children}</div>
    </div>
);

const features = [
    {
        title: 'Notes',
        description: 'Clean, structured notes for every module—fast to find, easy to revise.',
        icon: (
            <FeatureIcon>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path d="M14 3v3h3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M8 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            </FeatureIcon>
        )
    },
    {
        title: 'PYQs',
        description: 'Previous year questions with smart practice to boost exam confidence.',
        icon: (
            <FeatureIcon>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M6.5 4H18a2 2 0 0 1 2 2v12.5a1.5 1.5 0 0 1-1.5 1.5H6.5A2.5 2.5 0 0 1 4 17.5V6.5A2.5 2.5 0 0 1 6.5 4Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path d="M8 9h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M8 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            </FeatureIcon>
        )
    },
    {
        title: 'CGPA / SGPA Calculator',
        description: 'Instantly calculate SGPA/CGPA and plan your targets semester-wise.',
        icon: (
            <FeatureIcon>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <path d="M8 8h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M8 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M13 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M8 16h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M13 16h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            </FeatureIcon>
        )
    },
    {
        title: 'College Interview Experiences',
        description: 'Real interview experiences and tips shared by students and seniors.',
        icon: (
            <FeatureIcon>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M7 7a4 4 0 1 1 8 0"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    <path
                        d="M4 20a8 8 0 0 1 16 0"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    <path
                        d="M18 11h2v4h-2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </FeatureIcon>
        )
    }
];

const featuresContainerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.15
        }
    }
};

const featureCardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
};

export default function Hero() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        try {
            const userData = localStorage.getItem('user');
            setUser(userData ? JSON.parse(userData) : null);
        } catch {
            setUser(null);
        }
    }, []);

    const handleExploreFeatures = (e) => {
        e.preventDefault();
        const el = document.getElementById('features');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="hero-container">
            <section className="hero-section">
                <div className="hero-gradient-orb" />

                <motion.div
                    className="hero-dots"
                    initial={{ y: 0 }}
                    whileInView={{ y: -30 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                >
                    <img src="/dots.png" alt="" className="hero-dots-img" />
                </motion.div>

                <div className="hero-content animate-fade-up">
                    <div className="hero-badge">
                        <span className="hero-badge-dot animate-pulse" />
                        <span className="hero-badge-text">Trusted by 2000+ Students</span>
                    </div>

                    <h1 className="hero-heading">
                        Your Complete
                        <br />
                        <span className="hero-heading-gradient">Academic Companion</span>
                    </h1>

                    <p className="hero-subheading">
                        Master your studies with AI-powered notes, expert-curated PYQs, real-time attendance tracking, and a
                        supportive community. Everything you need to ace your semesters—all in one powerful platform.
                    </p>

                    <div className="hero-buttons">
                        {user ? (
                            <Link to="/dashboard" className="hero-button hero-button-primary">
                                Go to Dashboard
                                <ArrowRightIcon size={20} />
                            </Link>
                        ) : (
                            <>
                                <Link to="/signup" className="hero-button hero-button-primary">
                                    Get Started Free
                                    <ArrowRightIcon size={20} />
                                </Link>
                                <a href="#features" onClick={handleExploreFeatures} className="hero-button hero-button-link">
                                    Explore Features
                                </a>
                            </>
                        )}
                    </div>

                    <p className="hero-trust">
                        {user ? (
                            <>Welcome back! Start exploring your resources</>
                        ) : (
                            <>
                                Join <span className="hero-trust-highlight">1,000+</span> students already using ASK+
                            </>
                        )}
                    </p>
                </div>
            </section>

            <section className="features-section" id="features">
                <div className="features-container">
                    <div className="features-header">
                        <h2 className="features-title">
                            Everything You Need to{' '}
                            <span className="hero-heading-gradient" style={{ display: 'inline' }}>
                                Excel
                            </span>
                        </h2>
                        <p className="features-description">
                            A complete suite of tools designed to help you succeed in your academic journey.
                        </p>
                    </div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={featuresContainerVariants}
                        className="features-grid"
                    >
                        {features.map((item, i) => (
                            <motion.div
                                key={i}
                                variants={featureCardVariants}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="feature-card"
                            >
                                {item.icon}
                                <h3 className="feature-title">{item.title}</h3>
                                <p className="feature-description">{item.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section className="about-section">
                <div className="about-container">
                    <div className="about-header">
                        <h2 className="about-title">
                            Why{' '}
                            <span className="hero-heading-gradient" style={{ display: 'inline' }}>
                                ASK+
                            </span>{' '}
                            Stands Out
                        </h2>
                        <p className="about-subtitle">Built by students, for students—simplifying your academic journey</p>
                    </div>

                    <div className="about-grid">
                        <div className="about-card">
                            <div className="about-icon-container">
                                <div className="about-icon">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M12 2l2.2 6.7H21l-5.4 3.9 2.1 6.7L12 15.6 6.3 19.3l2.1-6.7L3 8.7h6.8L12 2Z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="about-card-title">Student-Centric Design</h3>
                            <p className="about-card-text">
                                Created by students who understand the real struggles of college life. We built ASK+ to solve the
                                exact problems we faced—managing notes, attendance, exams, and mental health all at once.
                            </p>
                        </div>

                        <div className="about-card">
                            <div className="about-icon-container">
                                <div className="about-icon blue">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M12 21s-7-4.6-7-11a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6.4-7 11-7 11Z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="about-card-title">Holistic Academic Support</h3>
                            <p className="about-card-text">
                                From study materials to community support, we've got everything under one roof. Less switching
                                between apps, more focus on what matters—your success and well-being.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <div className="cta-container">
                    <div className="cta-card">
                        <div className="cta-glow" />

                        <div className="cta-content">
                            <h2 className="cta-title">
                                Ready to Ace Your
                                <br />
                                <span className="hero-heading-gradient">Academic Goals?</span>
                            </h2>
                            <p className="cta-description">
                                Stop struggling with scattered resources. Join 1000+ successful students using ASK+ to excel in their
                                studies, stay organized, and achieve their dreams.
                            </p>
                            {!user && (
                                <Link to="/signup" className="cta-button">
                                    Start Learning Today
                                    <ArrowRightIcon size={20} />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <footer className="hero-footer">
                <div className="hero-footer-inner">Secure • Privacy-first • Built for students</div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="feature-card">
            {icon}
            <h3 className="feature-title">{title}</h3>
            <p className="feature-description">{description}</p>
        </div>
    );
}
