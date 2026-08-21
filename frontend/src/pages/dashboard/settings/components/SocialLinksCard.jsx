import React from 'react';
import { Github, Linkedin, Twitter, Globe } from 'lucide-react';

const SocialLinksCard = ({ socialLinks, onChange }) => {
    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxSizing: 'border-box'
        }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 -4px 0' }}>
                Social Links
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
            }} className="social-links-grid">
                
                {/* GitHub */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="github" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Github size={13} style={{ color: 'rgba(148, 163, 184, 0.7)' }} />
                        GitHub Profile
                    </label>
                    <input
                        type="url"
                        id="github"
                        name="github"
                        placeholder="https://github.com/username"
                        value={socialLinks.github || ''}
                        onChange={onChange}
                        style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            transition: 'border-color 0.15s, box-shadow 0.15s'
                        }}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                            e.currentTarget.style.boxShadow = '0 0 8px rgba(139,92,246,0.15)';
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {/* LinkedIn */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="linkedin" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Linkedin size={13} style={{ color: 'rgba(148, 163, 184, 0.7)' }} />
                        LinkedIn Profile
                    </label>
                    <input
                        type="url"
                        id="linkedin"
                        name="linkedin"
                        placeholder="https://linkedin.com/in/username"
                        value={socialLinks.linkedin || ''}
                        onChange={onChange}
                        style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            transition: 'border-color 0.15s, box-shadow 0.15s'
                        }}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                            e.currentTarget.style.boxShadow = '0 0 8px rgba(139,92,246,0.15)';
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {/* X / Twitter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="x" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Twitter size={13} style={{ color: 'rgba(148, 163, 184, 0.7)' }} />
                        X (Twitter)
                    </label>
                    <input
                        type="url"
                        id="x"
                        name="x"
                        placeholder="https://x.com/username"
                        value={socialLinks.x || ''}
                        onChange={onChange}
                        style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            transition: 'border-color 0.15s, box-shadow 0.15s'
                        }}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                            e.currentTarget.style.boxShadow = '0 0 8px rgba(139,92,246,0.15)';
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {/* Portfolio Website */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="portfolio" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe size={13} style={{ color: 'rgba(148, 163, 184, 0.7)' }} />
                        Portfolio Website
                    </label>
                    <input
                        type="url"
                        id="portfolio"
                        name="portfolio"
                        placeholder="https://yourwebsite.com"
                        value={socialLinks.portfolio || ''}
                        onChange={onChange}
                        style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            transition: 'border-color 0.15s, box-shadow 0.15s'
                        }}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                            e.currentTarget.style.boxShadow = '0 0 8px rgba(139,92,246,0.15)';
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 576px) {
                    .social-links-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}} />
        </div>
    );
};

export default SocialLinksCard;
