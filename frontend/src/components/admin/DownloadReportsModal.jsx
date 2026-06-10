import React, { useState } from 'react';
import { FaDownload, FaTimes, FaFilePdf, FaFileCsv, FaCalendarAlt, FaSpinner } from 'react-icons/fa';

const DownloadReportsModal = ({ isOpen, onClose, isLightMode }) => {
    const [format, setFormat] = useState('pdf');
    const [dateFilter, setDateFilter] = useState('today');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleDownload = () => {
        let from = '';
        let to = '';

        const today = new Date();
        if (dateFilter === 'today') {
            from = new Date(today.setHours(0,0,0,0)).toISOString();
            to = new Date(today.setHours(23,59,59,999)).toISOString();
        } else if (dateFilter === '7days') {
            const last7 = new Date();
            last7.setDate(last7.getDate() - 7);
            from = last7.toISOString();
            to = new Date().toISOString();
        } else if (dateFilter === '30days') {
            const last30 = new Date();
            last30.setDate(last30.getDate() - 30);
            from = last30.toISOString();
            to = new Date().toISOString();
        } else if (dateFilter === 'custom') {
            if (!fromDate || !toDate) {
                alert("Please select both from and to dates.");
                return;
            }
            from = new Date(fromDate).toISOString();
            to = new Date(toDate).toISOString();
        }

        const url = `/api/admin/analytics/reports/users/export/${format}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
        
        // Use an invisible anchor to trigger download using JWT auth if necessary, 
        // but since this is an admin panel, window.open is often enough if the cookie holds the session.
        // If JWT is in localStorage, we must fetch as blob and download.
        
        setLoading(true);
        const token = localStorage.getItem('authToken');
        fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(async res => {
            if (!res.ok) throw new Error("Failed to export report");
            const blob = await res.blob();
            
            // Extract filename from Content-Disposition header if present
            const disposition = res.headers.get('Content-Disposition');
            let filename = `users_report.${format}`;
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) { 
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            return { blob, filename };
        })
        .then(({ blob, filename }) => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setLoading(false);
            onClose();
        })
        .catch(err => {
            console.error(err);
            alert("Error downloading report.");
            setLoading(false);
        });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${isLightMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
                            <FaDownload className="text-xl" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>User Reports</h2>
                            <p className="text-xs text-secondary-500 font-bold uppercase tracking-widest mt-1">Export Data</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-secondary-400">
                        <FaTimes />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${isLightMode ? 'text-slate-700' : 'text-secondary-400'}`}>Export Format</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setFormat('pdf')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${format === 'pdf' ? 'bg-blue-600 border-blue-500 text-white' : isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-secondary-400'}`}
                            >
                                <FaFilePdf /> PDF
                            </button>
                            <button 
                                onClick={() => setFormat('csv')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${format === 'csv' ? 'bg-emerald-600 border-emerald-500 text-white' : isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-secondary-400'}`}
                            >
                                <FaFileCsv /> CSV
                            </button>
                        </div>
                    </div>

                    {/* Date Filter Selection */}
                    <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${isLightMode ? 'text-slate-700' : 'text-secondary-400'}`}>Date Filter</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['today', '7days', '30days', 'custom'].map((filter) => (
                                <button 
                                    key={filter}
                                    onClick={() => setDateFilter(filter)}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${dateFilter === filter ? 'bg-blue-600 border-blue-500 text-white' : isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-secondary-400'}`}
                                >
                                    {filter === 'today' && 'Today'}
                                    {filter === '7days' && 'Last 7 Days'}
                                    {filter === '30days' && 'Last 30 Days'}
                                    {filter === 'custom' && 'Custom Range'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Range Pickers */}
                    {dateFilter === 'custom' && (
                        <div className={`p-4 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'} space-y-3`}>
                            <div>
                                <label className="block text-[10px] uppercase font-black text-secondary-500 mb-1">From</label>
                                <div className="relative">
                                    <FaCalendarAlt className="absolute left-3 top-3 text-secondary-400" />
                                    <input 
                                        type="date" 
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className={`w-full pl-10 pr-3 py-2 rounded-xl text-sm border outline-none ${isLightMode ? 'bg-white border-slate-200 focus:border-blue-500' : 'bg-slate-800 border-slate-600 text-white focus:border-blue-500'}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-black text-secondary-500 mb-1">To</label>
                                <div className="relative">
                                    <FaCalendarAlt className="absolute left-3 top-3 text-secondary-400" />
                                    <input 
                                        type="date" 
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className={`w-full pl-10 pr-3 py-2 rounded-xl text-sm border outline-none ${isLightMode ? 'bg-white border-slate-200 focus:border-blue-500' : 'bg-slate-800 border-slate-600 text-white focus:border-blue-500'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={handleDownload}
                        disabled={loading || (dateFilter === 'custom' && (!fromDate || !toDate))}
                        className={`w-full py-3 rounded-xl font-black text-sm text-white shadow-lg transition-all ${loading ? 'bg-blue-500/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}
                    >
                        {loading ? <FaSpinner className="animate-spin inline-block" /> : 'Generate Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DownloadReportsModal;
