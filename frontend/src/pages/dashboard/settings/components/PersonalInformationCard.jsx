import React from 'react';

const PersonalInformationCard = ({ formData, onChange, isGoogleUser }) => {
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
                Personal Information
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
            }} className="personal-info-grid">
                
                {/* Full Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="name" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                        Full Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name || ''}
                        onChange={onChange}
                        required
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

                {/* Username */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="username" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                        Username *
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username || ''}
                        onChange={onChange}
                        required
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

                {/* Email Address (read-only for all users) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="email" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={onChange}
                        readOnly={true}
                        style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.02)',
                            color: 'rgba(255,255,255,0.45)',
                            cursor: 'not-allowed',
                            fontSize: '13px',
                            outline: 'none',
                            transition: 'border-color 0.15s, box-shadow 0.15s'
                        }}
                    />
                </div>

                {/* Phone Number */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="phone" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                        Phone Number
                    </label>
                    <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone || ''}
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
                    .personal-info-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}} />
        </div>
    );
};

export default PersonalInformationCard;
