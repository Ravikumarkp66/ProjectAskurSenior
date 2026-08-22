import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { analyticsAPI } from '../services/analyticsAPI';
import { apiClient } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = ({ isLightMode, onNavigate }) => {
    const { user } = useAuthContext();
    const [stats, setStats] = useState(null); // Admin stats
    const [userNotifications, setUserNotifications] = useState([]); // User notifications
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        
        loadData();
        const interval = setInterval(loadData, 60000); // Refresh every 60 seconds
        return () => clearInterval(interval);
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (user.isAdmin) {
                const response = await analyticsAPI.getNotificationStats();
                setStats(response.data);
                setUnreadCount(response.data.totalNotifications || 0);
            } else {
                const response = await apiClient.get('/user-notifications');
                setUserNotifications(response.data.notifications || []);
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Error loading notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await apiClient.patch(`/user-notifications/${id}/read`);
            setUserNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiClient.post('/user-notifications/mark-all-read');
            setUserNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
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

    const handleBellClick = () => {
        setShowDropdown(!showDropdown);
        if (!showDropdown && user?.isAdmin && stats && unreadCount > 0) {
            setStats({ ...stats, totalNotifications: 0, pendingUploads: 0, reportCount: 0, flaggedContent: 0 });
            setUnreadCount(0);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                className={`relative p-2 rounded-lg transition ${isLightMode
                        ? 'hover:bg-slate-100 text-slate-700'
                        : 'hover:bg-white/10 text-secondary-300'
                    }`}
                title="Notifications"
            >
                <FaBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className={`absolute right-0 mt-2 w-80 rounded-lg border shadow-lg z-50 ${isLightMode
                        ? 'bg-white border-slate-200'
                        : 'bg-dark-100 border-white/10'
                    }`}>
                    {/* Header */}
                    <div className={`px-4 py-3 border-b flex justify-between items-center ${isLightMode
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-white/10 bg-white/5'
                        }`}>
                        <h3 className={`text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            Notifications
                        </h3>
                        {!user?.isAdmin && unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-purple-500 hover:text-purple-600 font-medium">
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading && !stats && userNotifications.length === 0 ? (
                            <div className={`p-4 text-center text-sm ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                Loading...
                            </div>
                        ) : user?.isAdmin ? (
                            // Admin Stats Render
                            !stats || (stats.totalNotifications === 0 && unreadCount === 0) ? (
                                <div className={`p-4 text-center text-sm ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                    No admin notifications
                                </div>
                            ) : (
                                <div className="divide-y" style={{ borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)' }}>
                                    {stats.pendingUploads > 0 && (
                                        <button onClick={() => { onNavigate?.('admin', 'reviews'); setShowDropdown(false); }} className={`w-full text-left px-4 py-3 hover:bg-opacity-50 transition ${isLightMode ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                                            <div className="flex items-start justify-between mb-1">
                                                <p className={`font-medium text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Pending Uploads</p>
                                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">{stats.pendingUploads}</span>
                                            </div>
                                            <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-secondary-400'}`}>Users waiting for content approval</p>
                                        </button>
                                    )}
                                    {stats.reportCount > 0 && (
                                        <button onClick={() => { onNavigate?.('admin', 'reviews'); setShowDropdown(false); }} className={`w-full text-left px-4 py-3 hover:bg-opacity-50 transition ${isLightMode ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                                            <div className="flex items-start justify-between mb-1">
                                                <p className={`font-medium text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Bug Reports</p>
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">{stats.reportCount}</span>
                                            </div>
                                            <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-secondary-400'}`}>Unresolved issues to review</p>
                                        </button>
                                    )}
                                </div>
                            )
                        ) : (
                            // User Notifications Render
                            userNotifications.length === 0 ? (
                                <div className={`p-4 text-center text-sm ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                    No new notifications
                                </div>
                            ) : (
                                <div className="divide-y" style={{ borderColor: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)' }}>
                                    {userNotifications.map(notification => (
                                        <div 
                                            key={notification._id} 
                                            onClick={() => {
                                                if (!notification.isRead) handleMarkAsRead(notification._id);
                                            }}
                                            className={`w-full text-left px-4 py-3 cursor-pointer transition ${
                                                !notification.isRead ? (isLightMode ? 'bg-purple-50' : 'bg-purple-900/20') : (isLightMode ? 'hover:bg-slate-50' : 'hover:bg-white/5')
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <p className={`font-medium text-sm ${
                                                    !notification.isRead 
                                                    ? (isLightMode ? 'text-purple-900' : 'text-purple-300') 
                                                    : (isLightMode ? 'text-slate-900' : 'text-white')
                                                }`}>
                                                    {notification.title}
                                                </p>
                                                <span className={`text-[10px] whitespace-nowrap ml-2 ${isLightMode ? 'text-slate-500' : 'text-secondary-500'}`}>
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className={`text-xs line-clamp-2 ${isLightMode ? 'text-slate-600' : 'text-secondary-400'}`}>
                                                {notification.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`px-4 py-2 border-t text-center ${isLightMode
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-white/10 bg-white/5'
                        }`}>
                        <button
                            onClick={loadData}
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
