import React from 'react';
import { socialPlatformsConfig } from '../config/socialPlatforms';
import { useTheme } from '../../../context/ThemeContext';

const SocialLinks = ({ student, isAnonymous = false }) => {
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

    const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)';
    const bgColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)';
    const iconColor = isDark ? '#A1A1AA' : '#6B7280';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            <h3 style={{
                fontSize: '12px',
                fontWeight: 700,
                color: isDark ? '#A1A1AA' : '#6B7280',
                margin: '0 0 2px 0',
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
            }}>
                Social Links
            </h3>

            <div style={{
                display: 'flex',
                flexWrap: 'nowrap',
                gap: '10px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                paddingTop: '2px'
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
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                border: `1px solid ${borderColor}`,
                                background: bgColor,
                                color: iconColor,
                                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)';
                                e.currentTarget.style.color = isDark ? '#93C5FD' : '#2563EB';
                                e.currentTarget.style.borderColor = isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(37, 99, 235, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = bgColor;
                                e.currentTarget.style.color = iconColor;
                                e.currentTarget.style.borderColor = borderColor;
                            }}
                            title={platform.label}
                        >
                            <Icon size={16} />
                        </a>
                    );
                })}
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .social-links-scroll-row::-webkit-scrollbar {
                    display: none !important;
                }
            `}} />
        </div>
    );
};

export default SocialLinks;
