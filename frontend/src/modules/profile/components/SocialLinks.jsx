import React from 'react';
import { socialPlatformsConfig } from '../config/socialPlatforms';

import { useTheme } from '../../../context/ThemeContext';

const SocialLinks = ({ student }) => {
    const { isDark } = useTheme();
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

    const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)';
    const bgColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)';
    const iconColor = isDark ? '#94A3B8' : '#64748B';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            <h3 style={{
                fontSize: '12px',
                fontWeight: 700,
                color: isDark ? '#94A3B8' : '#64748B',
                margin: '0 0 2px 0',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
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
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: `1px solid ${borderColor}`,
                                background: bgColor,
                                color: iconColor,
                                transition: 'background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s',
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.08)';
                                e.currentTarget.style.color = isDark ? '#c4b5fd' : '#7c3aed';
                                e.currentTarget.style.borderColor = isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(124, 58, 237, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = bgColor;
                                e.currentTarget.style.color = iconColor;
                                e.currentTarget.style.borderColor = borderColor;
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            title={platform.label}
                        >
                            <Icon size={13} />
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
