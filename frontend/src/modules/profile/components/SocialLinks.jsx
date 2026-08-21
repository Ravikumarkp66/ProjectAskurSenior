import React from 'react';
import { socialPlatformsConfig } from '../config/socialPlatforms';

const SocialLinks = ({ student }) => {
    if (!student) return null;

    const links = student.socialLinks || {};

    const formatUrl = (url, platform) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        
        switch (platform) {
            case 'github':
                return `https://github.com/${url.replace(/^@/, '')}`;
            case 'linkedin':
                return `https://linkedin.com/in/${url}`;
            case 'x':
                return `https://x.com/${url.replace(/^@/, '')}`;
            default:
                return `https://${url}`;
        }
    };

    const activePlatforms = socialPlatformsConfig.filter(
        platform => !!links[platform.id]
    );

    if (activePlatforms.length === 0) return null;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            <h3 style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#94a3b8',
                margin: '0 0 2px 0'
            }}>
                Social Media
            </h3>

            <div style={{
                display: 'flex',
                flexWrap: 'nowrap',
                gap: '8px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }} className="social-links-scroll-row">
                {activePlatforms.map((platform) => {
                    const Icon = platform.icon;
                    const rawValue = links[platform.id];
                    const url = formatUrl(rawValue, platform.id);

                    return (
                        <a
                            key={platform.id}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                background: 'rgba(255, 255, 255, 0.02)',
                                color: '#94a3b8',
                                transition: 'background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s',
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                e.currentTarget.style.color = '#94a3b8';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            title={platform.label}
                        >
                            <Icon size={12} />
                        </a>
                    );
                })}
            </div>
            
            {/* Custom Webkit Scrollbar hider inline */}
            <style dangerouslySetInnerHTML={{__html: `
                .social-links-scroll-row::-webkit-scrollbar {
                    display: none !important;
                }
            `}} />
        </div>
    );
};

export default SocialLinks;
