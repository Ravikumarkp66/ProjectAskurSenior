import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FileText, CreditCard, Target, Users } from 'lucide-react';

const actions = [
    { id: 'notes', label: 'Notes', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'pyqs', label: 'PYQs', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'plans', label: 'ASK+ Plans', icon: CreditCard, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { id: 'placements', label: 'Placements', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'admin', label: 'Talk to Admin', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' }
];

const QuickActions = ({ onActionClick }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 mt-4"
        >
            {actions.map((action, index) => (
                <motion.button
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onActionClick(action.label)}
                    className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                        border border-white/5 bg-white/[0.03] hover:bg-white/[0.08]
                        hover:border-white/10 transition-colors
                    `}
                >
                    <div className={`p-1 rounded-full ${action.bg}`}>
                        <action.icon className={`w-3 h-3 ${action.color}`} />
                    </div>
                    <span className="text-slate-300">{action.label}</span>
                </motion.button>
            ))}
        </motion.div>
    );
};

export default QuickActions;
