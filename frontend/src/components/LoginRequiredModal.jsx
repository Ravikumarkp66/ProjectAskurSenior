import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, LogIn, UserPlus, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginRequiredModal = ({ isOpen, onClose, featureName, description }) => {
    const navigate = useNavigate();
    const { isAuthenticated, hasPlusAccess } = useAuth();

    if (!isOpen) return null;

    const isUpgrade = Boolean(isAuthenticated && !hasPlusAccess);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all z-10"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="p-8">
                    <div className="mb-6 flex justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full" />
                            {isUpgrade ? (
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center relative z-10 shadow-lg shadow-purple-500/20">
                                    <Plus size={28} strokeWidth={3} className="text-purple-300" />
                                </div>
                            ) : (
                                <Lock size={36} className="text-purple-400 relative z-10" />
                            )}
                        </div>
                    </div>

                    <div className="text-center space-y-3 mb-8">
                        <h3 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                            {isUpgrade ? (
                                <>
                                    <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                                        <Plus size={14} strokeWidth={3} />
                                    </span>
                                    <span>Upgrade to Plus</span>
                                </>
                            ) : (
                                <>
                                    <Lock size={20} className="text-purple-400 shrink-0" />
                                    <span>Login required</span>
                                </>
                            )}
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed px-4">
                            {description || (isUpgrade 
                                ? `Upgrade to AskUrSenior Plus to unlock ${featureName || 'this feature'} and access all study resources.`
                                : `Sign in to access ${featureName || 'this feature'} and all study resources.`)}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {isUpgrade ? (
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/pricing');
                                }}
                                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-purple-600/30 active:scale-[0.98] cursor-pointer"
                            >
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <Plus size={13} strokeWidth={3} className="text-white" />
                                </span>
                                <span>Upgrade to Plus</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] cursor-pointer"
                                >
                                    <LogIn size={18} />
                                    Sign In
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <UserPlus size={18} />
                                    Create Account
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="px-8 py-4 bg-white/5 border-t border-white/5 text-center">
                    <p className="text-[10px] text-white/30 truncate">
                        {isUpgrade 
                            ? 'AskUrSenior Plus unlocks unlimited access to all features & tools'
                            : 'Joining gives you access to 500+ study materials'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginRequiredModal;
