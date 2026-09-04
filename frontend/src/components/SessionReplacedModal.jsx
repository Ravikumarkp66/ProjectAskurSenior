import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function SessionReplacedModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState({
    title: 'Logged Out',
    message: 'You have logged in on another device.\nFor security, this device has been logged out.'
  });

  useEffect(() => {
    const handleSessionReplaced = (e) => {
      if (e.detail) {
        setModalData({
          title: e.detail.title || 'Logged Out',
          message: e.detail.message || 'You have logged in on another device.\nFor security, this device has been logged out.'
        });
      }
      setIsOpen(true);
    };

    window.addEventListener('session-replaced', handleSessionReplaced);
    return () => window.removeEventListener('session-replaced', handleSessionReplaced);
  }, []);

  const handleAcknowledge = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[420px] rounded-sm border border-gray-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#18181b] text-left font-sans">
        {/* CSES Header */}
        <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-zinc-800">
          <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
            {modalData.title}
          </h2>
        </div>

        {/* CSES Body */}
        <div className="py-4 text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
          {modalData.message}
        </div>

        {/* CSES Footer Action */}
        <div className="pt-3 border-t border-gray-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={handleAcknowledge}
            className="inline-flex items-center justify-center rounded-sm border border-gray-300 bg-gray-50 px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-800 transition-colors hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
