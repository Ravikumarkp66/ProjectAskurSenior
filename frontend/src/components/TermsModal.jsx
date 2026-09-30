import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText } from 'lucide-react';

const TermsModal = ({ isOpen, onClose }) => {
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
                            <FileText className="w-5 h-5 text-[#7C3AED] dark:text-[#A78BFA]" />
                            <span>Terms & Conditions</span>
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
                                1. Platform Purpose
                            </h3>
                            <p>
                                AskUrSenior is an educational resource platform designed to organize and provide structured access to academic materials such as notes, previous year question papers (PYQs), question banks, and student-shared interview experiences.
                            </p>
                            <p>
                                The platform serves as a centralized collection system for educational materials intended strictly for personal academic use.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                2. Nature of Service & Payment
                            </h3>
                            <p className="text-xs text-[#6B7280] dark:text-[#71717A]">By upgrading to AskUrSenior Plus (Premium), users are paying for:</p>
                            <ul className="space-y-1.5 list-disc pl-5">
                                <li>Platform infrastructure and technical maintenance</li>
                                <li>Secure cloud hosting and storage</li>
                                <li>Organized collection and structured access to academic materials</li>
                                <li>Premium features genuinely provided within the platform</li>
                            </ul>
                            <div className="mt-3 p-3.5 rounded-lg bg-[#FAF5FF] dark:bg-[#581C87]/15 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-xs text-[#6D28D9] dark:text-[#DDD6FE]">
                                Users are not purchasing ownership of any academic material. Payments are made strictly for access to the curated collection, platform management, and continuous service improvements.
                            </div>
                            <p className="mt-2">
                                Interview experiences available on the platform are collected from students of the respective college. AskUrSenior acts solely as a structured collection and hosting platform for such submissions.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                3. Premium Access Policy
                            </h3>
                            <ul className="space-y-1.5 list-disc pl-5">
                                <li>Premium access is provided based on the plan selected at the time of payment.</li>
                                <li>Access duration, features, and pricing may be updated or modified as the platform evolves.</li>
                                <li>Premium access grants usage rights within the platform only and does not transfer ownership of any content.</li>
                            </ul>
                        </section>

                        <section className="space-y-2 bg-[#FEF2F2] dark:bg-[#450A0A]/20 border border-[#FCA5A5] dark:border-[#DC2626]/30 p-4 rounded-lg">
                            <h3 className="text-base font-semibold text-[#DC2626] dark:text-[#F87171]">
                                4. No Refund Policy
                            </h3>
                            <p className="font-medium text-[#991B1B] dark:text-[#FCA5A5]">
                                As AskUrSenior provides immediate digital access to premium features and organized academic resources upon activation, all payments are final and non-refundable.
                            </p>
                            <p className="text-xs text-[#B91C1C] dark:text-[#F87171] mt-1">
                                Once premium access is granted to an account, refund requests will not be entertained under any circumstances. Users are advised to review all details carefully before making a payment.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                5. Copyright & Content Disclaimer
                            </h3>
                            <p>
                                AskUrSenior does not claim ownership of third-party academic materials (including notes, PYQs, or interview experiences) submitted by students.
                            </p>
                            <p>
                                We function as a hosting and organizing service for educational materials. If you are a copyright owner and believe your material has been used inappropriately, please contact our support team immediately for review.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                6. Acceptable Use
                            </h3>
                            <ul className="space-y-1.5 list-disc pl-5">
                                <li>Use the platform for educational purposes only</li>
                                <li>Not redistribute, resell, or commercially exploit the materials</li>
                                <li>Not misuse platform access</li>
                            </ul>
                            <p className="text-xs text-[#D97706] dark:text-[#FBBF24] font-medium mt-1">Violation of these terms may result in account suspension without refund.</p>
                        </section>

                        <section className="space-y-3 pt-3 border-t border-[#E5E7EB] dark:border-[#292E37]">
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                7. Support & Contact
                            </h3>
                            <div className="bg-[#F8FAFC] dark:bg-[#1B1F26] border border-[#E5E7EB] dark:border-[#292E37] p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[#6B7280] dark:text-[#71717A]">For content concerns or support:</p>
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
                            I have read and agree to all terms.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto h-10 px-6 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-sm transition-colors cursor-pointer"
                        >
                            I Understand
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TermsModal;
