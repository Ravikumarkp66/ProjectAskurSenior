import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { analyticsAPI } from '../services/analyticsAPI';

const NotificationBell = ({ isLightMode, onNavigate }) => {
    const [stats, setStats] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadNotificationStats();
        const interval = setInterval(loadNotificationStats, 60000); // Refresh every 60 seconds
        return () => clearInterval(interval);
    }, []);

    const loadNotificationStats = async () => {
        try {
            setLoading(true);
            const response = await analyticsAPI.getNotificationStats();
            setStats(response.data);
        } catch (err) {
            console.error('Error loading notification stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    const totalNotifications = stats?.totalNotifications || 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`relative p-2 rounded-lg transition ${
                    isLightMode
                        ? 'hover:bg-slate-100 text-slate-700'
                        : 'hover:bg-white/10 text-secondary-300'
                }`}
                title="Notifications"
            >
                <FaBell className="w-5 h-5" />
                {totalNotifications > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {totalNotifications > 99 ? '99+' : totalNotifications}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className={`absolute right-0 mt-2 w-80 rounded-lg border shadow-lg z-50 ${
                    isLightMode
                        ? 'bg-white border-slate-200'
                        : 'bg-dark-100 border-white/10'
                }`}>
                    {/* Header */}
                    <div className={`px-4 py-3 border-b ${isLightMode
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-white/10 bg-white/5'
                    }`}>
                        <h3 className={`text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            Notifications
                        </h3>
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className={`p-4 text-center text-sm ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                Loading...
                            </div>
                        ) : !stats || stats.totalNotifications === 0 ? (
                            <div className={`p-4 text-center text-sm ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y" style={{
                                borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'
                            }}>
                                {/* Pending Uploads */}
                                {stats.pendingUploads > 0 && (
                                    <button
                                        onClick={() => {
                                            onNavigate?.('admin', 'reviews');
                                            setShowDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 hover:bg-opacity-50 transition ${
                                            isLightMode ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <p className={`font-medium text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                                Pending Uploads
                                            </p>
                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                                                {stats.pendingUploads}
                                            </span>
                                        </div>
                                        <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-secondary-400'}`}>
                                            Users waiting for content approval
                                        </p>
                                    </button>
                                )}

                                {/* Bug Reports */}
                                {stats.reportCount > 0 && (
                                    <button
                                        onClick={() => {
                                            onNavigate?.('admin', 'reviews');
                                            setShowDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 hover:bg-opacity-50 transition ${
                                            isLightMode ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <p className={`font-medium text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                                Bug Reports
                                            </p>
                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                                {stats.reportCount}
                                            </span>
                                        </div>
                                        <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-secondary-400'}`}>
                                            Unresolved issues to review
                                        </p>
                                    </button>
                                )}

                                {/* Flagged Content */}
                                {stats.flaggedContent > 0 && (
                                    <button
                                        className={`w-full text-left px-4 py-3 hover:bg-opacity-50 transition ${
                                            isLightMode ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <p className={`font-medium text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                                Flagged Content
                                            </p>
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                                                {stats.flaggedContent}
                                            </span>
                                        </div>
                                        <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-secondary-400'}`}>
                                            Content marked for review
                                        </p>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`px-4 py-2 border-t text-center ${isLightMode
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-white/10 bg-white/5'
                    }`}>
                        <button
                            onClick={() => loadNotificationStats()}
                            className={`text-xs font-medium ${isLightMode
                                ? 'text-purple-600 hover:text-purple-700'
                                : 'text-purple-400 hover:text-purple-300'
                            }`}
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
