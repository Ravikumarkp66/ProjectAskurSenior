import React from 'react';
import { Github, Linkedin, Twitter, Globe } from 'lucide-react';

const SocialLinksCard = ({ socialLinks, onChange }) => {
    return (
        <div className="rounded-xl border p-4 sm:p-5 bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.08] flex flex-col gap-4 box-border">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                Social Links
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* GitHub */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="github" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Github size={13} className="text-slate-500 dark:text-slate-400" />
                        GitHub Profile
                    </label>
                    <input
                        type="url"
                        id="github"
                        name="github"
                        placeholder="https://github.com/username"
                        value={socialLinks.github || ''}
                        onChange={onChange}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all box-border"
                    />
                </div>

                {/* LinkedIn */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="linkedin" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Linkedin size={13} className="text-slate-500 dark:text-slate-400" />
                        LinkedIn Profile
                    </label>
                    <input
                        type="url"
                        id="linkedin"
                        name="linkedin"
                        placeholder="https://linkedin.com/in/username"
                        value={socialLinks.linkedin || ''}
                        onChange={onChange}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all box-border"
                    />
                </div>

                {/* X / Twitter */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="x" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Twitter size={13} className="text-slate-500 dark:text-slate-400" />
                        X (Twitter)
                    </label>
                    <input
                        type="url"
                        id="x"
                        name="x"
                        placeholder="https://x.com/username"
                        value={socialLinks.x || ''}
                        onChange={onChange}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all box-border"
                    />
                </div>

                {/* Portfolio Website */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="portfolio" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Globe size={13} className="text-slate-500 dark:text-slate-400" />
                        Portfolio Website
                    </label>
                    <input
                        type="url"
                        id="portfolio"
                        name="portfolio"
                        placeholder="https://yourwebsite.com"
                        value={socialLinks.portfolio || ''}
                        onChange={onChange}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all box-border"
                    />
                </div>
            </div>
        </div>
    );
};

export default SocialLinksCard;
