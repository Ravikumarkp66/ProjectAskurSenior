import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/hooks';
import { paymentAPI, authAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { FaCrown, FaHistory, FaCheckCircle, FaExclamationCircle, FaArrowRight } from 'react-icons/fa';
import ProfileModal from '../components/ProfileModal';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';

const SubscriptionPage = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [theme] = useState(() => {
        try {
            return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });

    const isLightMode = theme === 'light';

    useEffect(() => {
        const loadData = async () => {
            try {
                const [historyRes, profileRes] = await Promise.all([
                    paymentAPI.getPaymentHistory(),
                    authAPI.getProfile()
                ]);
                setHistory(historyRes.data || []);
                if (profileRes.data) {
                    updateUser(profileRes.data);
                }
            } catch (err) {
                console.error("Failed to load subscription data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const isSubscribed = user?.subscription === 'askplus' &&
        (user.subscriptionExpiry ? new Date(user.subscriptionExpiry) > new Date() : true);
    const daysLeft = user?.subscriptionExpiry ? Math.ceil((new Date(user.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isLightMode ? 'bg-slate-50' : 'bg-primary-900'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'} font-medium animate-pulse`}>Loading subscription details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex ${isLightMode ? 'bg-slate-50' : 'bg-primary-900'}`}>
            <Sidebar
                isCollapsed={false}
                onProfileClick={() => setShowProfileModal(true)}
            />

            <div className="flex-1 flex flex-col min-w-0 sm:ml-64">
                <TopBar theme={theme} />

                <main className="flex-1 p-6 sm:p-10">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Header */}
                        <div>
                            <h1 className={`text-3xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                Subscription & Billing
                            </h1>
                            <p className="mt-2 text-slate-400">Manage your plan, view history, and handle payments.</p>
                        </div>

                        {/* Current Plan Card */}
                        <div className={`relative overflow-hidden rounded-3xl border ${isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-dark-100 border-primary-700'} p-8`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl ${isSubscribed
                                        ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg shadow-amber-500/20'
                                        : 'bg-slate-700 text-slate-300'
                                        }`}>
                                        <FaCrown />
                                    </div>
                                    <div>
                                        <h3 className={`text-sm font-bold uppercase tracking-widest ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Current Plan</h3>
                                        <p className={`text-2xl font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                            {isSubscribed ? 'ASK+ Premium' : 'Free Learning Plan'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    {isSubscribed ? (
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 text-green-400 font-bold mb-1">
                                                <FaCheckCircle />
                                                <span>Active</span>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Valid until {new Date(user.subscriptionExpiry).toLocaleDateString()}
                                                {daysLeft !== null && daysLeft <= 7 && (
                                                    <span className="ml-2 text-amber-500 font-bold">
                                                        ({daysLeft} days left)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => navigate('/pricing')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                        >
                                            Upgrade now <FaArrowRight className="text-sm" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Decorative Background for Premium */}
                            {isSubscribed && (
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                            )}
                        </div>

                        {/* Recent History */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <FaHistory className="text-slate-500" />
                                <h2 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Payment History</h2>
                            </div>

                            <div className={`rounded-3xl border overflow-hidden ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-primary-700'}`}>
                                {history.length === 0 ? (
                                    <div className="p-10 text-center text-slate-500">
                                        No payment history found.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className={`${isLightMode ? 'bg-slate-50 text-slate-700' : 'bg-primary-900/50 text-slate-300'}`}>
                                                <tr>
                                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Date</th>
                                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">UTR Number</th>
                                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Amount</th>
                                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isLightMode ? 'divide-slate-100' : 'divide-primary-800'}`}>
                                                {history.map((record) => (
                                                    <tr key={record._id} className={isLightMode ? 'hover:bg-slate-50' : 'hover:bg-white/5 transition'}>
                                                        <td className="px-6 py-4 text-slate-400">
                                                            {new Date(record.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className={`px-6 py-4 font-mono ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                                            {record.utrNumber}
                                                        </td>
                                                        <td className={`px-6 py-4 font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                                            ₹{record.amount}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${record.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                                                                record.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                                    record.status === 'expired' ? 'bg-slate-500/10 text-slate-400' :
                                                                        'bg-yellow-500/10 text-yellow-400'
                                                                }`}>
                                                                {record.status === 'pending' && <span className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse" />}
                                                                {record.status}
                                                            </span>
                                                            {record.status === 'rejected' && record.rejectionReason && (
                                                                <p className="text-[10px] text-red-400 mt-1 italic">"{record.rejectionReason}"</p>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Guard / Info */}
                        {!isSubscribed && history.some(h => h.status === 'pending') && (
                            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-4 items-start">
                                <FaExclamationCircle className="text-blue-400 text-xl shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-blue-400 font-bold text-sm">Verification in Progress</h4>
                                    <p className="text-blue-400/70 text-xs mt-1 leading-relaxed mb-4">
                                        We're currently verifying your latest UTR submission. Most activations happen within 6 hours.
                                        You don't need to submit again.
                                    </p>
                                    <p className="mt-4 text-[10px] text-[#5865F2] font-bold uppercase tracking-wider">
                                        ⚡ For Instant Approval: Join Discord from the Profile Section!
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Legal Links Footer */}
                        <div className="flex flex-col items-center gap-4 py-8 opacity-50 text-center">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                                🚫 No Refund Policy: All Digital Access Sales are Final
                            </p>
                            <div className="flex gap-4 text-xs font-medium">
                                <button onClick={() => setShowTerms(true)} className="hover:text-blue-500 transition-colors">Terms of Service</button>
                                <button onClick={() => setShowPrivacy(true)} className="hover:text-blue-500 transition-colors">Privacy Policy</button>
                                <a href="mailto:askursenior66@gmail.com" className="hover:text-blue-500 transition-colors">Support</a>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <ProfileModal
                show={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                user={user}
                updateUser={updateUser}
                theme={theme}
            />

            <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
            />
            <PrivacyModal
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
            />
        </div>
    );
};

export default SubscriptionPage;
