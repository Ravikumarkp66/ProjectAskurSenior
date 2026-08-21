import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Tag, ShieldCheck, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { subscriptionAPI } from '../../services/api';

const SubscriptionModal = ({ isOpen, onClose, plan }) => {
    if (!isOpen || !plan) return null;

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [loadingCoupon, setLoadingCoupon] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(true);
    const [paymentSubmitted, setPaymentSubmitted] = useState(false);

    const basePrice = plan.price || 199;
    const discountAmount = appliedCoupon?.discountAmount || 0;
    const finalPrice = Math.max(0, basePrice - discountAmount);

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode.trim()) return;

        setLoadingCoupon(true);
        setCouponError('');

        try {
            const res = await subscriptionAPI.validateCoupon(couponCode, plan.code);
            if (res.data?.success && res.data?.data) {
                setAppliedCoupon(res.data.data);
                setCouponError('');
            }
        } catch (err) {
            console.error('Coupon validation failed:', err);
            setCouponError(err.response?.data?.message || 'Invalid or expired coupon code.');
            setAppliedCoupon(null);
        } finally {
            setLoadingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const handleCheckout = () => {
        setPaymentSubmitted(true);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg rounded-3xl bg-[#090d1a] border border-purple-500/30 p-6 sm:p-8 shadow-2xl shadow-purple-950/50 text-white font-outfit overflow-hidden"
                >
                    {/* Background Ambient Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={18} />
                    </button>

                    {!paymentSubmitted ? (
                        <div className="space-y-6">
                            {/* Modal Header */}
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                                    <Sparkles size={12} />
                                    <span>Plan Confirmation</span>
                                </div>
                                <h3 className="text-2xl font-extrabold text-white tracking-tight pt-1">
                                    Review Your Subscription
                                </h3>
                                <p className="text-slate-400 text-xs sm:text-sm font-normal">
                                    Unlock full academic companion access for Siddaganga Institute of Technology.
                                </p>
                            </div>

                            {/* Plan Summary Card */}
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-base text-white">{plan.name}</h4>
                                        <p className="text-xs text-slate-400 font-medium">1 Semester Access • V3 Platform</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-extrabold text-white">₹{basePrice}</div>
                                        {plan.originalPrice && (
                                            <div className="text-xs text-slate-500 line-through">₹{plan.originalPrice}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs text-slate-300">
                                    <div className="flex items-center gap-1.5">
                                        <Check size={14} className="text-emerald-400 shrink-0" />
                                        <span>Ask+ AI RAG Assistant</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Check size={14} className="text-emerald-400 shrink-0" />
                                        <span>85% Attendance Tracker</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Check size={14} className="text-emerald-400 shrink-0" />
                                        <span>CIE & Year Back Predictors</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Check size={14} className="text-emerald-400 shrink-0" />
                                        <span>Senior Mentorship Sessions</span>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon Code Section */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Tag size={13} className="text-purple-400" />
                                        Have a Promo or Ambassador Coupon?
                                    </span>
                                </label>

                                {!appliedCoupon ? (
                                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="Try SITFIRSTYEAR or LAUNCH50"
                                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs font-mono uppercase focus:outline-none focus:border-purple-500 transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            disabled={loadingCoupon || !couponCode.trim()}
                                            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                                        >
                                            {loadingCoupon ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} className="text-emerald-400" />
                                            <div>
                                                <span className="font-bold text-emerald-400 font-mono">{appliedCoupon.code}</span>
                                                <span className="text-slate-300 ml-2 font-medium">(-₹{appliedCoupon.discountAmount})</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRemoveCoupon}
                                            className="text-slate-400 hover:text-white text-[11px] underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}

                                {couponError && (
                                    <p className="text-[11px] text-rose-400 font-medium">{couponError}</p>
                                )}
                            </div>

                            {/* Price Summary Breakdown */}
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                                <div className="flex justify-between text-slate-400">
                                    <span>Subtotal</span>
                                    <span>₹{basePrice}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-emerald-400 font-medium">
                                        <span>Coupon Discount ({appliedCoupon.code})</span>
                                        <span>-₹{discountAmount}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-extrabold text-white">
                                    <span>Total Payable Today</span>
                                    <span className="text-xl text-purple-300 font-outfit">₹{finalPrice}</span>
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="flex items-start gap-2 text-xs text-slate-400">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-0.5 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="terms" className="cursor-pointer select-none">
                                    I agree to the <span className="text-slate-200 underline">Terms of Service</span> and acknowledge that this pass provides instant access to current version V3 features.
                                </label>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={!acceptedTerms}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                <ShieldCheck size={16} />
                                <span>Proceed to Checkout (₹{finalPrice})</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="text-[11px] text-center text-slate-500 font-medium">
                                🔒 Secure 256-Bit SSL Encrypted Student Checkout
                            </p>
                        </div>
                    ) : (
                        /* Post-selection Confirmation Notice */
                        <div className="text-center py-6 space-y-4">
                            <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
                                <Sparkles size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Plan Selection Saved!</h3>
                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                                You selected <strong className="text-white">{plan.name}</strong> ({appliedCoupon ? `Discounted to ₹${finalPrice} via ${appliedCoupon.code}` : `₹${finalPrice} / Semester`}).
                            </p>
                            <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30 text-xs text-purple-300">
                                ℹ️ Live Razorpay payment gateway integration will be connected in the upcoming deployment pass.
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all"
                            >
                                Back to Subscription Page
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SubscriptionModal;
