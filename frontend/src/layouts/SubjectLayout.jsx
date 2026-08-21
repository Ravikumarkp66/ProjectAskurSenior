import React from 'react';
import { Outlet, useOutlet, useLocation } from 'react-router-dom';
import { BookOpen, Construction } from 'lucide-react';

const SubjectLayout = () => {
    const outlet = useOutlet();
    const location = useLocation();
    const isRestrictedYear = location.pathname.match(/\/(second|third|fourth)-year/);

    return (
        <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {outlet ? outlet : (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    padding: '40px 24px',
                    textAlign: 'center',
                }}>
                    {isRestrictedYear ? (
                        /* "Select a subject" prompt for 2nd/3rd/4th year */
                        <>
                            <div style={{
                                width: 52, height: 52,
                                borderRadius: 14,
                                background: 'rgba(139,92,246,0.07)',
                                border: '1px solid rgba(139,92,246,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 16,
                            }}>
                                <BookOpen size={22} strokeWidth={1.75} style={{ color: 'rgba(139,92,246,0.55)' }} />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(226,232,240,0.7)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                                Browse subjects from the sidebar
                            </p>
                            <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)', margin: 0, lineHeight: 1.6, maxWidth: 220 }}>
                                Choose a subject to start learning
                            </p>
                        </>
                    ) : (
                        /* "Coming soon" state for future content */
                        <>
                            <div style={{
                                width: 60, height: 60,
                                borderRadius: 16,
                                background: 'rgba(139,92,246,0.06)',
                                border: '1px solid rgba(139,92,246,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 18,
                            }}>
                                <Construction size={26} strokeWidth={1.75} style={{ color: 'rgba(139,92,246,0.45)' }} />
                            </div>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'rgba(241,245,249,0.85)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                                Content is coming soon
                            </h2>
                            <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)', margin: '0 0 6px', maxWidth: 260, lineHeight: 1.65 }}>
                                We're currently organizing notes, PYQs and resources for this year.
                            </p>
                            <p style={{ fontSize: 11, color: 'rgba(167,139,250,0.4)', margin: 0, letterSpacing: '0.02em' }}>
                                Check back soon.
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SubjectLayout;
