import React from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  Users,
  BookOpen,
  FileText,
  ShieldCheck,
  Server,
  Activity,
  ArrowUpRight,
  Database
} from 'lucide-react';

export const DashboardPage = () => {
  const { admin } = useAdminAuth();

  const previewCards = [
    { title: 'User Management', desc: 'Manage student accounts, verify USNs, and control access', icon: Users, status: 'Planned' },
    { title: 'Curriculum & Notes', desc: 'Verify and curate academic schemes, subjects, and study materials', icon: BookOpen, status: 'Planned' },
    { title: 'Content & Articles', desc: 'Manage announcements, experiences, and published content', icon: FileText, status: 'Planned' },
    { title: 'System & Monitoring', desc: 'Monitor API health, database stats, and task runners', icon: Server, status: 'Planned' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Foundation Phase Initialized
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Welcome to AskUrSenior Admin
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-300 max-w-2xl">
            Logged in as <span className="font-semibold text-white">{admin?.email || 'Administrator'}</span>.
            The Admin application foundation is now established and connected to the backend API.
          </p>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Domain</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-lg font-bold text-white">dashboard.askursenior.org</p>
          <span className="text-xs text-slate-400 mt-1 block">Staging Deployment Target</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Backend API</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-400">Connected</p>
          <span className="text-xs text-slate-400 mt-1 block">Unified REST API & Auth</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Data Source</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-lg font-bold text-white">Staging MongoDB</p>
          <span className="text-xs text-slate-400 mt-1 block">Single Source of Truth</span>
        </div>
      </div>

      {/* Next Milestone Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Upcoming Management Modules</h2>
          <span className="text-xs text-slate-400 font-mono">Milestone 2 Scope</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {previewCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-slate-800/80 text-indigo-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    {card.status}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-white text-sm">{card.title}</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
