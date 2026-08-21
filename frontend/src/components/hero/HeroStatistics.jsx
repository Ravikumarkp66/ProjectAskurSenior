/**
 * HeroStatistics.jsx
 * ─────────────────────────────────────────────────────────
 * Live Platform Statistics computed dynamically from MongoDB.
 * Displays Resources, Students, Companies, and WhatsApp 2000+ Community.
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';

const WhatsAppIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-400 shrink-0">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.81 0-3.586-.486-5.138-1.405l-.368-.219-3.82.1.01-3.722-.24-.383A9.85 9.85 0 0 1 1.2 11.026C1.202 5.503 5.698 1.008 11.222 1.008c2.674 0 5.188 1.042 7.078 2.934 1.89 1.891 2.93 4.406 2.928 7.082-.003 5.524-4.5 10.019-10.027 10.019m0-19.026C5.145 2.817.18 7.783.177 13.861c-.001 2.04.532 4.032 1.542 5.787L0 25.405l5.922-1.553a11.01 11.01 0 0 0 5.297 1.353h.005c6.077 0 11.043-4.966 11.046-11.045.002-2.946-1.144-5.717-3.225-7.798C16.963 3.962 14.194 2.817 11.22 2.817" />
    </svg>
);

const HeroStatistics = ({ stats = [] }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.36, ease: "easeOut" }}
            className="w-full"
        >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto lg:mx-0">
                {stats.map((item, idx) => {
                    const isWhatsApp = item.key === 'community' || item.prefix === 'whatsapp';
                    return (
                        <div
                            key={item.key || idx}
                            className="group flex flex-col p-3.5 rounded-xl transition-all duration-300 backdrop-blur-md"
                            style={{
                                backgroundColor: 'var(--stat-card-bg, #FFFFFF)',
                                borderColor: 'var(--stat-card-border, #E5E7EB)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                boxShadow: 'var(--stat-card-shadow, 0 2px 8px rgba(0, 0, 0, 0.04))'
                            }}
                        >
                            <div className="flex items-center gap-1.5 mb-1">
                                {isWhatsApp ? (
                                    <WhatsAppIcon />
                                ) : (
                                    <span className="text-emerald-500 font-bold text-sm">✔</span>
                                )}
                                <span
                                    className="text-lg sm:text-xl font-black tracking-tight transition-colors"
                                    style={{ color: 'var(--stat-count-text, #111827)' }}
                                >
                                    {Number(item.count).toLocaleString()}+
                                </span>
                            </div>
                            <span
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{ color: 'var(--stat-label-text, #374151)' }}
                            >
                                {item.label}
                            </span>
                            {item.desc && (
                                <span
                                    className="text-[10px] truncate mt-0.5"
                                    style={{ color: 'var(--stat-desc-text, #6B7280)' }}
                                >
                                    {item.desc}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default HeroStatistics;
