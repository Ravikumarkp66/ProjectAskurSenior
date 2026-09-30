import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    X, Check, Tag, ShieldCheck, Sparkles, ArrowRight, Loader2, 
    CheckCircle2, AlertCircle, Lock, UserCheck, Calendar, Zap
} from 'lucide-react';
import { subscriptionAPI } from '../../services/api';
import { useAuthContext } from '../../context/AuthContext';

const DEFAULT_FEATURE_LIST = [
    'Attendance Tracker with Section Timetables & 85% Bunk Planner',
    'Today\'s Classes & Daily Schedule Live Tracking',
    'CIE Analyzer (50-Mark Normalization & SEE Target Forecaster)',
    'Branch Change Predictor with Statistical Shift Odds',
    'Year Back Predictor & Pre-Exam Dual Compliance Auditor',
    'SIT Exam Eligibility Checker',
    'College Labset Coding Playground (C, C++, Java, Python)',
    '1-Credit Subject Quizzes (NCMC/AEC) & Practice Engine',
    '4-Year Academic Journey Heatmap & Activity Tracker',
    'Attendance Streaks for All Subjects & Days',
    'Visual Engineering Roadmaps & Progress Checklists',
    'Personalized Student Command Dashboard',
    'Notes, Solved PYQs, Campus Map & Senior Placement Logs'
];

const SubscriptionModal = ({ isOpen, onClose, plan, onSuccess }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user, updateUser } = useAuthContext();

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [loadingCoupon, setLoadingCoupon] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(true);
    
    // Checkout states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const [orderReceipt, setOrderReceipt] = useState(null);

    if (!isOpen || !plan) return null;

    const basePrice = plan.price || 199;
    const discountAmount = appliedCoupon?.discountAmount || 0;
    const finalPrice = Math.max(0, basePrice - discountAmount);
    const planFeatures = (plan.features && plan.features.length > 0) ? plan.features : DEFAULT_FEATURE_LIST;

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

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            navigate('/login?redirect=/pricing');
            return;
        }

        if (!acceptedTerms) return;

        setIsSubmitting(true);
        setCheckoutError('');

        try {
            const res = await subscriptionAPI.checkout({
                planCode: plan.code || 'SEM_1',
                couponCode: appliedCoupon?.code || null,
                paymentMethod: 'Student Online Checkout'
            });

            if (res.data?.success && res.data?.data) {
                const receipt = res.data.data;
                setOrderReceipt(receipt);

                // Update local auth context state so user instantly gets Plus access
                if (updateUser) {
                    updateUser({
                        isPlus: true,
                        hasActiveSubscription: true,
                        subscription: 'plus',
                        access: {
                            plan: 'PLUS',
                            source: 'SUBSCRIPTION',
                            hasPlusAccess: true
                        }
                    });
                }

                if (onSuccess) {
                    onSuccess(receipt);
                }
            } else {
                setCheckoutError(res.data?.message || 'Checkout failed. Please try again.');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setCheckoutError(err.response?.data?.message || 'Failed to complete checkout. Please verify your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNavigate = (path) => {
        onClose();
        navigate(path);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-xl my-6 rounded-[10px] bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] p-5 sm:p-7 shadow-lg text-[#111827] dark:text-[#F3F4F6] font-sans antialiased">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-[6px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1F242C] transition-colors"
                    aria-label="Close modal"
                >
                    <X size={18} />
                </button>

                {!orderReceipt ? (
                    <div className="space-y-5">
                        
                        {/* Modal Header */}
                        <div className="space-y-1.5 pr-8">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA] text-[11px] font-semibold tracking-wide uppercase">
                                <Zap size={11} className="fill-current" />
                                <span>ASKURSENIOR STRIKE • PLUS CHECKOUT</span>
                            </div>
                            <h2 className="text-[20px] sm:text-[22px] font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                                Review & Activate Plus Pass
                            </h2>
                            <p className="text-[13px] leading-[18px] text-[#4B5563] dark:text-[#9CA3AF]">
                                Unlock full academic companion tools for Siddaganga Institute of Technology.
                            </p>
                        </div>

                        {/* Unauthenticated Notification Banner */}
                        {!isAuthenticated && (
                            <div className="p-3.5 rounded-[8px] bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 flex items-start gap-3">
                                <Lock size={16} className="text-[#7C3AED] dark:text-[#A78BFA] shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[13px] font-semibold text-[#6D28D9] dark:text-[#DDD6FE]">
                                        Account Login Required
                                    </p>
                                    <p className="text-[12px] text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed">
                                        Your Plus pass will be linked directly to your SIT student profile. Please sign in to activate.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Plan Summary Card */}
                        <div className="p-4 rounded-[8px] bg-[#F8FAFC] dark:bg-[#1B1F26] border border-[#E5E7EB] dark:border-[#292E37] space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-[15px] text-[#111827] dark:text-[#F3F4F6]">
                                            {plan.name || 'AskUrSenior Plus'}
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] text-[10px] font-bold border border-[#E9D5FF] dark:border-[#7C3AED]/30">
                                            1 SEMESTER PASS
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                                        Zero auto-renewal • Complete semester toolkit
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-[20px] font-bold text-[#111827] dark:text-[#F3F4F6]">
                                        ₹{basePrice}
                                    </div>
                                    {plan.originalPrice && (
                                        <div className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280] line-through">
                                            ₹{plan.originalPrice}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* What You Receive - Database Driven Full Utility List */}
                            <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#292E37] space-y-2">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563] dark:text-[#9CA3AF]">
                                    Everything Included in Your Plan:
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] text-[#374151] dark:text-[#D1D5DB] max-h-48 overflow-y-auto pr-1">
                                    {planFeatures.map((feat, idx) => (
                                        <div key={idx} className="flex items-start gap-1.5 leading-tight">
                                            <div className="w-3.5 h-3.5 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={10} strokeWidth={3} />
                                            </div>
                                            <span className="text-[11.5px]">{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Promo / Ambassador Coupon Code Section */}
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-medium text-[#374151] dark:text-[#D1D5DB] flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Tag size={13} className="text-[#7C3AED] dark:text-[#A78BFA]" />
                                    Have a Promo or Ambassador Coupon?
                                </span>
                            </label>

                            {!appliedCoupon ? (
                                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="TRY SITFIRSTYEAR OR LAUNCH50"
                                        className="flex-1 h-9 px-3 rounded-[6px] bg-white dark:bg-[#15181D] border border-[#D1D5DB] dark:border-[#292E37] text-[#111827] dark:text-[#F3F4F6] placeholder-[#9CA3AF] text-[12px] font-mono uppercase focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loadingCoupon || !couponCode.trim()}
                                        className="h-9 px-4 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-[12px] font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                                    >
                                        {loadingCoupon ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
                                    </button>
                                </form>
                            ) : (
                                <div className="p-2.5 rounded-[6px] bg-[#F0FDF4] dark:bg-[#14532D]/20 border border-[#BBF7D0] dark:border-[#16A34A]/30 flex items-center justify-between text-[12px]">
                                    <div className="flex items-center gap-2">
                                        <Tag size={13} className="text-[#16A34A] dark:text-[#4ADE80]" />
                                        <div>
                                            <span className="font-bold text-[#16A34A] dark:text-[#4ADE80] font-mono">
                                                {appliedCoupon.code}
                                            </span>
                                            <span className="text-[#4B5563] dark:text-[#9CA3AF] ml-2 font-medium">
                                                (-₹{appliedCoupon.discountAmount})
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveCoupon}
                                        className="text-[#6B7280] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-white text-[11px] underline cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}

                            {couponError && (
                                <p className="text-[11px] text-[#DC2626] dark:text-[#F87171] font-medium flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    <span>{couponError}</span>
                                </p>
                            )}
                        </div>

                        {/* Price Summary Breakdown */}
                        <div className="p-3.5 rounded-[8px] bg-[#F8FAFC] dark:bg-[#1B1F26] border border-[#E5E7EB] dark:border-[#292E37] space-y-2 text-[12px]">
                            <div className="flex justify-between text-[#4B5563] dark:text-[#9CA3AF]">
                                <span>Semester Plan Subtotal</span>
                                <span className="font-medium text-[#111827] dark:text-[#F3F4F6]">₹{basePrice}</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-[#16A34A] dark:text-[#4ADE80] font-medium">
                                    <span>Coupon Discount ({appliedCoupon.code})</span>
                                    <span>-₹{discountAmount}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#292E37] flex justify-between items-center text-[14px] font-bold text-[#111827] dark:text-[#F3F4F6]">
                                <span>Total Payable Today</span>
                                <span className="text-[18px] text-[#7C3AED] dark:text-[#A78BFA] font-bold">
                                    ₹{finalPrice}
                                </span>
                            </div>
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-start gap-2.5 text-[12px] text-[#4B5563] dark:text-[#9CA3AF]">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-[#D1D5DB] dark:border-[#4B5563] text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
                            />
                            <label htmlFor="terms" className="cursor-pointer select-none leading-[18px]">
                                I agree to the <span className="text-[#111827] dark:text-[#F3F4F6] underline">Terms of Service</span> and understand that this provides 1 full semester of AskUrSenior Plus access with zero auto-renewals.
                            </label>
                        </div>

                        {/* Error Alert */}
                        {checkoutError && (
                            <div className="p-3 rounded-[6px] bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border border-[#FECACA] dark:border-[#DC2626]/30 text-[#DC2626] dark:text-[#F87171] text-[12px] flex items-center gap-2">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{checkoutError}</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {isAuthenticated ? (
                            <button
                                type="button"
                                onClick={handleCheckout}
                                disabled={isSubmitting || !acceptedTerms}
                                className="w-full h-11 px-5 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-none"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Activating AskUrSenior Plus...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={16} />
                                        <span>Proceed to Checkout (₹{finalPrice})</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleNavigate('/login?redirect=/pricing')}
                                className="w-full h-11 px-5 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-none"
                            >
                                <Lock size={16} />
                                <span>Sign In to Unlock Plus (₹{finalPrice})</span>
                                <ArrowRight size={16} />
                            </button>
                        )}

                        <p className="text-[11px] text-center text-[#6B7280] dark:text-[#9CA3AF] font-medium">
                            🔒 256-Bit SSL Encrypted Student Checkout • Immediate Activation
                        </p>
                    </div>
                ) : (
                    /* ─────────────────────────────────────────────────────────
                        POST-PURCHASE VERIFIED ORDER RECEIPT SCREEN
                    ───────────────────────────────────────────────────────── */
                    <div className="py-4 space-y-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] border border-[#E9D5FF] dark:border-[#7C3AED]/40 flex items-center justify-center mx-auto">
                            <CheckCircle2 size={26} />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-[22px] font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                                AskUrSenior Plus Activated!
                            </h3>
                            <p className="text-[13px] text-[#4B5563] dark:text-[#9CA3AF] max-w-sm mx-auto">
                                Your full academic companion pass is now live on your SIT student account.
                            </p>
                        </div>

                        {/* Verified Receipt Summary */}
                        <div className="p-4 rounded-[8px] bg-[#F8FAFC] dark:bg-[#1B1F26] border border-[#E5E7EB] dark:border-[#292E37] text-left space-y-2.5 text-[12px]">
                            <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB] dark:border-[#292E37]">
                                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Transaction ID</span>
                                <span className="font-mono font-bold text-[#111827] dark:text-[#F3F4F6]">
                                    {orderReceipt.transactionId}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Plan</span>
                                <span className="font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                    {orderReceipt.plan?.name || 'AskUrSenior Plus'} (1 Semester)
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Amount Paid</span>
                                <span className="font-bold text-[#16A34A] dark:text-[#4ADE80]">
                                    ₹{orderReceipt.amountPaid}
                                </span>
                            </div>
                            {orderReceipt.couponUsed && (
                                <div className="flex justify-between items-center">
                                    <span className="text-[#6B7280] dark:text-[#9CA3AF]">Coupon Applied</span>
                                    <span className="font-mono font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                                        {orderReceipt.couponUsed}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB] dark:border-[#292E37]">
                                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Access Valid Until</span>
                                <span className="font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                    {orderReceipt.endDate ? new Date(orderReceipt.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Semester End'}
                                </span>
                            </div>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => handleNavigate('/dashboard')}
                                className="h-10 px-4 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-[13px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <span>Go to Dashboard</span>
                                <ArrowRight size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleNavigate('/my-subjects')}
                                className="h-10 px-4 rounded-[6px] bg-white dark:bg-[#15181D] border border-[#D1D5DB] dark:border-[#292E37] text-[#374151] dark:text-[#F3F4F6] hover:bg-[#F9FAFB] dark:hover:bg-[#1B1F26] font-semibold text-[13px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <span>View My Subjects</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionModal;
