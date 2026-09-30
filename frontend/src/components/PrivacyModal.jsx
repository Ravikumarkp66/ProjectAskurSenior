import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield } from 'lucide-react';

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
                    initial={{ scale: 0.95, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[10px] border border-[#E5E7EB] dark:border-[#292E37] bg-white dark:bg-[#15181D] shadow-lg flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26]">
                        <h2 className="text-lg font-semibold text-[#111827] dark:text-[#F3F4F6] flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#7C3AED] dark:text-[#A78BFA]" />
                            <span>Privacy Policy</span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-[6px] border border-[#E5E7EB] dark:border-[#292E37] bg-white dark:bg-[#15181D] text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
                            aria-label="Close modal"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-[#4B5563] dark:text-[#A1A1AA] font-normal leading-relaxed">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-xs text-[#7C3AED] dark:text-[#A78BFA] font-medium">
                            Last Updated: 03/01/2026
                        </div>

                        <section className="space-y-2">
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                1. Data Collection
                            </h3>
                            <p>
                                We only collect essential information required for platform access and personalized experience, such as your USN, email, and basic profile details. No unnecessary data is stored.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                2. Data Usage
                            </h3>
                            <p>
                                Your data is used strictly for platform functionality, analytics, and improvements. We do not sell or share your data with third parties.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                3. Security
                            </h3>
                            <p>
                                We use industry-standard security practices to protect your information including SSL/TLS encryption for all data transmissions. Password data is securely encrypted using industry-standard hashing.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                4. Cookies
                            </h3>
                            <p>
                                Cookies are used only for authentication and session management. You can disable cookies, but some features may not work as expected.
                            </p>
                        </section>

                        <section className="space-y-3 pt-3 border-t border-[#E5E7EB] dark:border-[#292E37]">
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                5. Support & Contact
                            </h3>
                            <div className="bg-[#F8FAFC] dark:bg-[#1B1F26] border border-[#E5E7EB] dark:border-[#292E37] p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[#6B7280] dark:text-[#71717A]">For any privacy concerns:</p>
                                    <p className="text-sm text-[#7C3AED] dark:text-[#A78BFA] font-medium">askursenior66@gmail.com</p>
                                </div>
                                <a 
                                    href="mailto:askursenior66@gmail.com" 
                                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-3.5 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer"
                                >
                                    Email Us
                                </a>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-[#6B7280] dark:text-[#71717A]">
                            I have read and agree to the Privacy Policy.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto h-10 px-6 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-sm transition-colors cursor-pointer"
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
