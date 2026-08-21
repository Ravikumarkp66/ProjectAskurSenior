import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    UserCheck, HelpCircle, Tag, Layers, Plus, Trash2, Edit3, 
    Check, X, Eye, EyeOff, Sparkles, RefreshCw, Save, DollarSign 
} from 'lucide-react';
import { contributorAPI, faqAPI, subscriptionAPI, apiClient } from '../../services/api';
import toast from 'react-hot-toast';

const AdminCmsManager = () => {
    const [activeSubTab, setActiveSubTab] = useState('contributors');

    // ─── 1. CONTRIBUTORS STATE ───────────────────────────────────────
    const [contributors, setContributors] = useState([]);
    const [loadingContributors, setLoadingContributors] = useState(false);
    const [showContributorModal, setShowContributorModal] = useState(false);
    const [editingContributor, setEditingContributor] = useState(null);
    const [contributorForm, setContributorForm] = useState({
        name: '', usn: '', branch: '', role: 'Community Contributor', avatar: '', order: 0, isVisible: true
    });

    // ─── 2. FAQS STATE ────────────────────────────────────────────────
    const [faqs, setFaqs] = useState([]);
    const [loadingFaqs, setLoadingFaqs] = useState(false);
    const [selectedFaqCategory, setSelectedFaqCategory] = useState('All');
    const [showFaqModal, setShowFaqModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);
    const [faqForm, setFaqForm] = useState({
        category: 'Getting Started', question: '', answer: '', order: 1, isPublished: true
    });

    // ─── 3. SUBSCRIPTION PLANS & COUPONS STATE ───────────────────────
    const [plans, setPlans] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [loadingSubData, setLoadingSubData] = useState(false);

    useEffect(() => {
        loadContributors();
        loadFaqs();
        loadSubscriptionData();
    }, []);

    const loadContributors = async () => {
        setLoadingContributors(true);
        try {
            const res = await apiClient.get('/contributors/admin/all');
            setContributors(res.data?.data || []);
        } catch (err) {
            console.error('Failed to load contributors for admin:', err);
            // Fallback to public endpoint
            contributorAPI.getPublic().then(res => setContributors(res.data?.data || []));
        } finally {
            setLoadingContributors(false);
        }
    };

    const loadFaqs = async () => {
        setLoadingFaqs(true);
        try {
            const res = await apiClient.get('/faqs/admin/all');
            setFaqs(res.data?.data || []);
        } catch (err) {
            console.error('Failed to load faqs for admin:', err);
        } finally {
            setLoadingFaqs(false);
        }
    };

    const loadSubscriptionData = async () => {
        setLoadingSubData(true);
        try {
            const res = await subscriptionAPI.getPublicPage();
            if (res.data?.data) {
                setPlans(res.data.data.plans || []);
                setCoupons(res.data.data.coupons || []);
            }
        } catch (err) {
            console.error('Failed to load subscription data:', err);
        } finally {
            setLoadingSubData(false);
        }
    };

    // ─── CONTRIBUTOR HANDLERS ───────────────────────────────────────
    const handleSaveContributor = async (e) => {
        e.preventDefault();
        try {
            if (editingContributor) {
                await apiClient.put(`/contributors/admin/${editingContributor._id}`, contributorForm);
                toast.success('Contributor updated successfully!');
            } else {
                await apiClient.post('/contributors/admin', contributorForm);
                toast.success('Contributor created successfully!');
            }
            setShowContributorModal(false);
            setEditingContributor(null);
            loadContributors();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save contributor');
        }
    };

    const handleDeleteContributor = async (id) => {
        if (!window.confirm('Are you sure you want to delete this contributor?')) return;
        try {
            await apiClient.delete(`/contributors/admin/${id}`);
            toast.success('Contributor deleted successfully');
            loadContributors();
        } catch (err) {
            toast.error('Failed to delete contributor');
        }
    };

    // ─── FAQ HANDLERS ────────────────────────────────────────────────
    const handleSaveFaq = async (e) => {
        e.preventDefault();
        try {
            if (editingFaq) {
                await apiClient.put(`/faqs/admin/${editingFaq._id}`, faqForm);
                toast.success('FAQ item updated successfully!');
            } else {
                await apiClient.post('/faqs/admin', faqForm);
                toast.success('FAQ item created successfully!');
            }
            setShowFaqModal(false);
            setEditingFaq(null);
            loadFaqs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save FAQ');
        }
    };

    const handleDeleteFaq = async (id) => {
        if (!window.confirm('Are you sure you want to delete this FAQ item?')) return;
        try {
            await apiClient.delete(`/faqs/admin/${id}`);
            toast.success('FAQ item deleted successfully');
            loadFaqs();
        } catch (err) {
            toast.error('Failed to delete FAQ item');
        }
    };

    const faqCategories = ['All', 'Getting Started', 'Study Materials', 'AskUrSenior Plus', 'Ask+ AI Assistant', 'Campus Tools', 'Community', 'Account & Privacy', 'Payments', 'General'];
    const filteredFaqs = selectedFaqCategory === 'All' ? faqs : faqs.filter(f => f.category === selectedFaqCategory);

    return (
        <div className="space-y-8 font-outfit">
            
            {/* Header & Sub-Tab Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.03] border border-white/10">
                <div>
                    <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                        <Sparkles className="text-purple-400" size={22} />
                        <span>CMS Content Manager</span>
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                        Manage Community Contributors, FAQs, Subscription Plans, and Promo Coupons in real time.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    {[
                        { id: 'contributors', label: 'Contributors', icon: UserCheck, count: contributors.length },
                        { id: 'faqs', label: 'FAQs', icon: HelpCircle, count: faqs.length },
                        { id: 'subscriptions', label: 'Plans & Coupons', icon: Tag, count: plans.length }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeSubTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSubTab(tab.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                                    isActive
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon size={14} />
                                <span>{tab.label}</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── TAB 1: CONTRIBUTORS ───────────────────────────────────────────────── */}
            {activeSubTab === 'contributors' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Community Contributors Catalog</h3>
                        <button
                            onClick={() => {
                                setEditingContributor(null);
                                setContributorForm({ name: '', usn: '', branch: '', role: 'Community Contributor', avatar: '', order: contributors.length + 1, isVisible: true });
                                setShowContributorModal(true);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <Plus size={14} />
                            <span>Add Contributor</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contributors.map((c, i) => (
                            <div key={c._id || i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-sm">{c.name}</span>
                                        {c.role && c.role.includes('Founder') && (
                                            <span className="px-2 py-0.5 rounded-full bg-purple-600 text-[10px] text-white font-bold">Founder</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">{c.usn} • {c.branch}</p>
                                    <p className="text-[11px] text-purple-400 font-medium">Role: {c.role} (Order: {c.order})</p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            setEditingContributor(c);
                                            setContributorForm({ ...c });
                                            setShowContributorModal(true);
                                        }}
                                        className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteContributor(c._id)}
                                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── TAB 2: FAQS ────────────────────────────────────────────────────────── */}
            {activeSubTab === 'faqs' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 sm:pb-0 scrollbar-none">
                            {faqCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedFaqCategory(cat)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
                                        selectedFaqCategory === cat
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/5 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setEditingFaq(null);
                                setFaqForm({ category: selectedFaqCategory !== 'All' ? selectedFaqCategory : 'Getting Started', question: '', answer: '', order: faqs.length + 1, isPublished: true });
                                setShowFaqModal(true);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0"
                        >
                            <Plus size={14} />
                            <span>Add FAQ Item</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {filteredFaqs.map((f, idx) => (
                            <div key={f._id || idx} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-semibold">{f.category}</span>
                                    <h4 className="font-bold text-white text-sm pt-1">{f.question}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">{f.answer}</p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => {
                                            setEditingFaq(f);
                                            setFaqForm({ ...f });
                                            setShowFaqModal(true);
                                        }}
                                        className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteFaq(f._id)}
                                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── TAB 3: PLANS & COUPONS ────────────────────────────────────────────── */}
            {activeSubTab === 'subscriptions' && (
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <DollarSign size={18} className="text-purple-400" />
                            <span>Subscription Plans</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {plans.map((p, i) => (
                                <div key={p.code || i} className="p-6 rounded-2xl bg-gradient-to-b from-purple-900/20 to-white/[0.02] border border-purple-500/30 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-extrabold text-white text-base">{p.name}</h4>
                                        <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-[10px] font-bold text-white">{p.code}</span>
                                    </div>
                                    <div className="text-2xl font-black text-white">₹{p.price} <span className="text-xs text-slate-400 font-normal">/ {p.durationUnit}</span></div>
                                    <p className="text-xs text-slate-400">{p.tagline}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Tag size={18} className="text-purple-400" />
                            <span>Discount Coupons</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {coupons.map((c, i) => (
                                <div key={c.code || i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-purple-400 text-sm">{c.code}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                                            {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-300 font-medium">{c.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CONTRIBUTOR MODAL */}
            {showContributorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <form onSubmit={handleSaveContributor} className="w-full max-w-md p-6 rounded-3xl bg-[#0a0f1d] border border-purple-500/30 space-y-4 text-white">
                        <h3 className="text-lg font-bold">{editingContributor ? 'Edit Contributor' : 'Add Contributor'}</h3>
                        <input type="text" placeholder="Full Name" value={contributorForm.name} onChange={e => setContributorForm({ ...contributorForm, name: e.target.value })} required className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
                        <input type="text" placeholder="USN (e.g. 1SI23IS001)" value={contributorForm.usn} onChange={e => setContributorForm({ ...contributorForm, usn: e.target.value })} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
                        <input type="text" placeholder="Branch" value={contributorForm.branch} onChange={e => setContributorForm({ ...contributorForm, branch: e.target.value })} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
                        <input type="text" placeholder="Role (e.g. Community Contributor)" value={contributorForm.role} onChange={e => setContributorForm({ ...contributorForm, role: e.target.value })} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
                        <div className="flex gap-2 justify-end pt-2">
                            <button type="button" onClick={() => setShowContributorModal(false)} className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold">Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 text-xs font-bold">Save</button>
                        </div>
                    </form>
                </div>
            )}

            {/* FAQ MODAL */}
            {showFaqModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <form onSubmit={handleSaveFaq} className="w-full max-w-md p-6 rounded-3xl bg-[#0a0f1d] border border-purple-500/30 space-y-4 text-white">
                        <h3 className="text-lg font-bold">{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h3>
                        <select value={faqForm.category} onChange={e => setFaqForm({ ...faqForm, category: e.target.value })} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">
                            {faqCategories.filter(c => c !== 'All').map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                        </select>
                        <input type="text" placeholder="Question" value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} required className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
                        <textarea placeholder="Answer" value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} required rows={4} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm" />
                        <div className="flex gap-2 justify-end pt-2">
                            <button type="button" onClick={() => setShowFaqModal(false)} className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold">Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 text-xs font-bold">Save</button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
};

export default AdminCmsManager;
