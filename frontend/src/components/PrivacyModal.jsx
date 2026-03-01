import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PrivacyModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-3xl border border-white/10 bg-[#141416] shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-blue-400">🛡️</span> Privacy Policy
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 text-gray-300 custom-scrollbar">
                        <p className="text-xs text-blue-400 font-medium uppercase tracking-widest">Last Updated: 03/01/2026</p>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-blue-500/50">1.</span> Data Collection
                            </h3>
                            <p className="leading-relaxed">
                                We only collect essential information required for platform access and personalized experience, such as your USN, email, and basic profile details. No unnecessary data is stored.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-blue-500/50">2.</span> Data Usage
                            </h3>
                            <p className="leading-relaxed">
                                Your data is used strictly for platform functionality, analytics, and improvements. We do not sell or share your data with third parties.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-blue-500/50">3.</span> Security
                            </h3>
                            <p className="leading-relaxed">
                                We use industry-standard security practices to protect your information including SSL/TLS encryption for all data transmissions. Password data is securely encrypted using industry-standard hashing.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-blue-500/50">4.</span> Cookies
                            </h3>
                            <p className="leading-relaxed">
                                Cookies are used only for authentication and session management. You can disable cookies, but some features may not work as expected.
                            </p>
                        </section>

                        <section className="space-y-3 pt-4 border-t border-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-blue-500/50">5.</span> Support & Contact
                            </h3>
                            <div className="bg-white/5 p-4 rounded-2xl">
                                <p className="text-sm opacity-70">For any privacy concerns:</p>
                                <p className="text-blue-400 font-bold">askursenior66@gmail.com</p>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/5 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                I have read and agree to the Privacy Policy
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            I Agree
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PrivacyModal;
