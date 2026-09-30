import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function UnsavedChangesDialog({
    isOpen,
    onKeepEditing,
    onDiscard
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
            <div className="w-full max-w-sm rounded-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 p-4 shadow-2xl space-y-3 font-mono">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <AlertTriangle size={15} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                            Discard Unsaved Marks?
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Modified marks in progress will be lost.
                        </p>
                    </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0 font-sans">
                    Closing without calculating will discard the current edits to this sheet.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onKeepEditing}
                        className="px-3 py-1.5 rounded text-xs font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
                    >
                        Keep editing
                    </button>
                    <button
                        type="button"
                        onClick={onDiscard}
                        className="px-3 py-1.5 rounded text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 border border-rose-600 transition-colors cursor-pointer shadow-xs"
                    >
                        Discard
                    </button>
                </div>
            </div>
        </div>
    );
}
