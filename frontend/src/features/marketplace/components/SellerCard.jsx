/* ═══════════════════════════════════════════════════════════════════
   SellerCard Component
   Compact Seller Profile Card (No public phone number exposure)
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { User, ShieldCheck, MessageSquare } from 'lucide-react';

const SellerCard = ({ seller }) => {
    if (!seller) return null;

    return (
        <div className="bg-[#161B22] p-4 sm:p-5 rounded-2xl border border-[#21262D] space-y-3">
            <h4 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">
                Seller Information
            </h4>

            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                    {seller.name ? seller.name.charAt(0) : <User size={20} />}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <h5 className="text-sm font-bold text-[#E6EDF3] truncate">
                            {seller.name || 'Campus Student'}
                        </h5>
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0" title="Verified Campus Student" />
                    </div>

                    <p className="text-xs text-[#8B949E] truncate">
                        {seller.branch || 'Campus Student'} {seller.year ? `· ${seller.year}` : ''}
                    </p>
                    <p className="text-[11px] text-[#8B949E]/70 mt-0.5">
                        Verified Student Member
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SellerCard;
