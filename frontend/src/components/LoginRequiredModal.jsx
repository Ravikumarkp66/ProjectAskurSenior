import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, LogIn, UserPlus } from 'lucide-react';

const LoginRequiredModal = ({ isOpen, onClose, featureName, description }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

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
                            <Lock size={36} className="text-purple-400 relative z-10" />
                        </div>
                    </div>

                    <div className="text-center space-y-3 mb-8">
                        <h3 className="text-2xl font-black text-white tracking-tight">
                            🔒 Login required
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed px-4">
                            {description || `Sign in to access ${featureName || 'this feature'} and all study resources.`}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98]"
                        >
                            <LogIn size={18} />
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all active:scale-[0.98]"
                        >
                            <UserPlus size={18} />
                            Create Account
                        </button>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="px-8 py-4 bg-white/5 border-t border-white/5 text-center">
                    <p className="text-[10px] text-white/30 truncate">
                        Joining gives you access to 500+ study materials
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginRequiredModal;
