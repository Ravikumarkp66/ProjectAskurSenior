import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-3xl border border-white/10 bg-[#141416] shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-blue-400">📜</span> Terms & Conditions
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
                                <span className="text-blue-500/50">1.</span> Platform Purpose
                            </h3>
                            <p className="leading-relaxed">
                                AskUrSenior is an educational resource platform designed to organize and provide structured access to academic materials such as notes, previous year question papers (PYQs), question banks, and student-shared interview experiences.
                            </p>
                            <p className="leading-relaxed">
                                The platform serves as a centralized collection system for educational materials intended strictly for personal academic use.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-blue-500/50">2.</span> Nature of Service & Payment
                            </h3>
                            <p className="leading-relaxed text-sm text-gray-400 mb-2">By upgrading to ASK+ (Premium), users are paying for:</p>
                            <ul className="space-y-2 list-disc pl-5">
                                <li>Platform infrastructure and technical maintenance</li>
                                <li>Secure cloud hosting and storage</li>
                                <li>Organized collection and structured access to academic materials</li>
                                <li>Premium features genuinely provided within the platform</li>
                            </ul>
                            <p className="mt-4 leading-relaxed italic text-sm border-l-2 border-blue-500/30 pl-4 bg-blue-500/5 py-2 rounded-r-lg">
                                Users are not purchasing ownership of any academic material. Payments are made strictly for access to the curated collection, platform management, and continuous service improvements.
                            </p>
                            <p className="leading-relaxed mt-2">
                                Interview experiences available on the platform are collected from students of the respective college. AskUrSenior acts solely as a structured collection and hosting platform for such submissions.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-blue-500/50">3.</span> Premium Access Policy
                            </h3>
                            <ul className="space-y-2 list-none">
                                <li className="flex gap-2">
                                    <span className="text-blue-400">●</span>
                                    <span>Premium access is provided based on the plan selected at the time of payment.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-blue-400">●</span>
                                    <span>Access duration, features, and pricing may be updated or modified as the platform evolves.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-blue-400">●</span>
                                    <span>Premium access grants usage rights within the platform only and does not transfer ownership of any content.</span>
                                </li>
                            </ul>
                        </section>

                        <section className="space-y-3 bg-red-500/5 border border-red-500/20 p-6 rounded-2xl">
                            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                                <span className="text-red-500/50">4.</span> No Refund Policy
                            </h3>
                            <p className="leading-relaxed font-semibold text-red-200">
                                As AskUrSenior provides immediate digital access to premium features and organized academic resources upon activation, all payments are final and non-refundable.
                            </p>
                            <p className="leading-relaxed text-sm opacity-80 mt-2">
                                Once premium access is granted to an account, refund requests will not be entertained under any circumstances. Users are advised to review all details carefully before making a payment.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-blue-500/50">5.</span> Copyright & Content Disclaimer
                            </h3>
                            <p className="leading-relaxed">
                                AskUrSenior does not claim ownership of third-party academic materials (including notes, PYQs, or interview experiences) submitted by students.
                            </p>
                            <p className="leading-relaxed">
                                We function as a hosting and organizing service for educational materials. If you are a copyright owner and believe your material has been used inappropriately, please contact our support team immediately for review.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-blue-500/50">6.</span> Acceptable Use
                            </h3>
                            <ul className="space-y-2 text-sm">
                                <li>• Use the platform for educational purposes only</li>
                                <li>• Not redistribute, resell, or commercially exploit the materials</li>
                                <li>• Not misuse platform access</li>
                            </ul>
                            <p className="text-xs text-orange-400 mt-2 font-medium">Violation of these terms may result in account suspension without refund.</p>
                        </section>

                        <section className="space-y-3 pt-4 border-t border-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-blue-500/50">7.</span> Support & Contact
                            </h3>
                            <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-70">For content concerns or support:</p>
                                    <p className="text-blue-400 font-bold">askursenior66@gmail.com</p>
                                </div>
                                <a href="mailto:askursenior66@gmail.com" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-bold">Email Us</a>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/5 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                I have read and agree to all terms
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
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
