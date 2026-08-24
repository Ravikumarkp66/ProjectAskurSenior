import React from 'react';
import { Keyboard, X } from 'lucide-react';

const SHORTCUTS = [
    { key: 'Ctrl + Enter', desc: 'Run Sample Test Cases' },
    { key: 'Ctrl + Shift + Enter', desc: 'Submit to Lab Evaluation Suite' },
    { key: 'Tab', desc: 'Indent code 4 spaces' },
    { key: 'Ctrl + B', desc: 'Toggle Curriculum Sidebar' },
    { key: 'Ctrl + F', desc: 'Find in Code' },
    { key: 'Ctrl + /', desc: 'Toggle Line Comment' }
];

const ShortcutsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(3, 1, 10, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
        }}>
            <div style={{
                backgroundColor: '#0F0926',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                borderRadius: 16,
                width: '100%',
                maxWidth: 420,
                padding: '20px 22px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Keyboard size={18} color="#A855F7" />
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                            Keyboard Shortcuts
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            color: '#94A3B8',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={15} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {SHORTCUTS.map((sc, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#070314',
                            borderRadius: 8,
                            border: '1px solid rgba(255, 255, 255, 0.04)'
                        }}>
                            <span style={{ fontSize: 12.5, color: '#CBD5E1', fontFamily: 'Outfit, sans-serif' }}>
                                {sc.desc}
                            </span>
                            <kbd style={{
                                backgroundColor: '#1E1238',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                color: '#E9D5FF',
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontFamily: 'monospace'
                            }}>
                                {sc.key}
                            </kbd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShortcutsModal;
