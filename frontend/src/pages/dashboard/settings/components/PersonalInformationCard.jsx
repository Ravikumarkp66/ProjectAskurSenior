import React from 'react';

const PersonalInformationCard = ({ formData, onChange, isGoogleUser }) => {
    return (
        <div className="rounded-xl border p-4 sm:p-5 bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.08] flex flex-col gap-4 box-border">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Full Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name || ''}
                        onChange={onChange}
                        required
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all box-border"
                    />
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="username" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Username *
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username || ''}
                        onChange={onChange}
                        required
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all box-border"
                    />
                </div>

                {/* Email Address (read-only for all users) */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={onChange}
                        readOnly={true}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none box-border"
                    />
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Phone Number
                    </label>
                    <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={onChange}
                        placeholder="e.g. +91 9876543210"
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all box-border"
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonalInformationCard;
