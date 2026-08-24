import React from 'react';
import { 
    CheckCircle2, Sparkles, Award, ArrowRight, 
    X, Clock, HardDrive, Share2, ThumbsUp, Terminal 
} from 'lucide-react';

const SubmissionSuccessModal = ({
    isOpen,
    onClose,
    program,
    language,
    runtime = '12ms',
    memory = '14.2 MB',
    onNextProgram
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(3, 1, 10, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            userSelect: 'none'
        }}>
            <div style={{
                backgroundColor: '#0F0926',
                border: '1.5px solid rgba(168, 85, 247, 0.5)',
                borderRadius: 20,
                width: '100%',
                maxWidth: 480,
                padding: '28px 24px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(168, 85, 247, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: 'none',
                        color: '#94A3B8',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <X size={16} />
                </button>

                {/* Animated Green Badge */}
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
                    marginBottom: 16
                }}>
                    <CheckCircle2 size={36} color="#34D399" />
                </div>

                <h2 style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#34D399',
                    margin: '0 0 6px 0',
                    fontFamily: 'Outfit, sans-serif'
                }}>
                    Accepted (All Test Cases Passed!)
                </h2>

                <p style={{
                    fontSize: 13,
                    color: '#CBD5E1',
                    margin: '0 0 20px 0',
                    lineHeight: 1.4,
                    fontFamily: 'Outfit, sans-serif'
                }}>
                    Great job! You have successfully solved <strong>{program?.title}</strong> in {language?.fullName}.
                </p>

                {/* Stat Metrics Strip */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    width: '100%',
                    marginBottom: 24
                }}>
                    <div style={{
                        backgroundColor: '#070314',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#A78BFA', fontSize: 11, fontWeight: 700 }}>
                            <Clock size={14} />
                            <span>Runtime</span>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', marginTop: 4, fontFamily: 'monospace' }}>
                            {runtime}
                        </span>
                        <span style={{ fontSize: 10, color: '#34D399', fontWeight: 600, marginTop: 2 }}>
                            Faster than 94.8%
                        </span>
                    </div>

                    <div style={{
                        backgroundColor: '#070314',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#A78BFA', fontSize: 11, fontWeight: 700 }}>
                            <HardDrive size={14} />
                            <span>Memory</span>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', marginTop: 4, fontFamily: 'monospace' }}>
                            {memory}
                        </span>
                        <span style={{ fontSize: 10, color: '#34D399', fontWeight: 600, marginTop: 2 }}>
                            Optimal Space
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#E2E8F0',
                            padding: '10px 0',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        Review Code
                    </button>

                    {onNextProgram && (
                        <button
                            onClick={() => {
                                onClose();
                                onNextProgram();
                            }}
                            style={{
                                flex: 1.2,
                                background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
                                border: '1px solid rgba(168, 85, 247, 0.5)',
                                color: '#FFFFFF',
                                padding: '10px 0',
                                borderRadius: 10,
                                fontSize: 13,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span>Next Program</span>
                            <ArrowRight size={15} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionSuccessModal;
