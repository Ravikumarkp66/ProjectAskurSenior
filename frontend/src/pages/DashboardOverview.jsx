import React, { useState, useEffect } from 'react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { FaUsers, FaCloudUploadAlt, FaFileAlt, FaHourglassHalf, FaBook, FaArrowUp, FaChartLine, FaChartBar, FaGlobe, FaTimes, FaStar, FaCreditCard, FaClock } from 'react-icons/fa';
import AnalyticsCard from '../components/AnalyticsCard';
import { analyticsAPI } from '../services/analyticsAPI';
import Skeleton from '../components/Skeleton';
import socket from '../services/socket';

const DashboardOverview = () => {
    const [stats, setStats] = useState(null);
    const [userGrowth, setUserGrowth] = useState(null);
    const [uploadGrowth, setUploadGrowth] = useState(null);
    const [contentBySubject, setContentBySubject] = useState(null);
    const [uploadByMonth, setUploadByMonth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Socket states
    const [liveUsersCount, setLiveUsersCount] = useState(0);
    const [trafficCount, setTrafficCount] = useState(0);
    const [liveUsersList, setLiveUsersList] = useState([]);
    const [isLiveUsersModalOpen, setIsLiveUsersModalOpen] = useState(false);

    const [theme] = useState(() => {
        try {
            return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
    const isLightMode = theme === 'light';

    useEffect(() => {
        loadAllAnalytics();
        
        // Auto-refresh analytics every 30 seconds
        const interval = setInterval(loadAllAnalytics, 30000);
        return () => clearInterval(interval);
    }, []);

    // Socket listeners
    useEffect(() => {
        socket.on('dashboard_live_stats', (data) => {
            setLiveUsersCount(data.liveUsers);
            setTrafficCount(data.trafficTabs);
        });

        socket.on('live_users_list', (data) => {
            setLiveUsersList(data);
        });

        return () => {
            socket.off('dashboard_live_stats');
            socket.off('live_users_list');
        };
    }, []);

    const loadAllAnalytics = async () => {
        try {
            setLoading(true);
            setError('');

            const [statsRes, userGrowthRes, uploadGrowthRes, contentRes, uploadMonthRes] = await Promise.all([
                analyticsAPI.getOverviewStats(),
                analyticsAPI.getUserGrowth(),
                analyticsAPI.getUploadGrowth(),
                analyticsAPI.getContentBySubject(),
                analyticsAPI.getUploadByMonth()
            ]);

            setStats(statsRes.data);

            if (userGrowthRes.data.months.length > 0) {
                const userGrowthData = userGrowthRes.data.months.map((month, idx) => ({
                    month,
                    users: userGrowthRes.data.counts[idx]
                }));
                setUserGrowth(userGrowthData);
            }

            if (uploadGrowthRes.data.months.length > 0) {
                const uploadGrowthData = uploadGrowthRes.data.months.map((month, idx) => ({
                    month,
                    uploads: uploadGrowthRes.data.counts[idx]
                }));
                setUploadGrowth(uploadGrowthData);
            }

            if (contentRes.data.subjects.length > 0) {
                const contentData = contentRes.data.subjects.map((subject, idx) => ({
                    subject,
                    name: contentRes.data.subjectNames[idx],
                    notes: contentRes.data.notes[idx],
                    pyqs: contentRes.data.pyqs[idx],
                    questionBanks: contentRes.data.questionBanks[idx]
                }));
                setContentBySubject(contentData);
            }

            if (uploadMonthRes.data.months.length > 0) {
                const uploadMonthData = uploadMonthRes.data.months.map((month, idx) => ({
                    month,
                    notes: uploadMonthRes.data.notes[idx],
                    pyqs: uploadMonthRes.data.pyqs[idx],
                    questionBanks: uploadMonthRes.data.questionBanks[idx]
                }));
                setUploadByMonth(uploadMonthData);
            }
        } catch (err) {
            console.error('Error loading analytics:', err);
            setError(err?.response?.data?.error || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const TooltipContent = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={`p-3 rounded-xl border shadow-2xl ${isLightMode ? 'bg-white border-slate-200' : 'bg-gray-900 border-white/10'}`}>
                    <p className={`text-xs font-bold mb-2 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <p className="text-sm font-semibold capitalize text-white">
                                {entry.name}: <span className="font-mono">{entry.value.toLocaleString()}</span>
                            </p>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`min-h-screen ${isLightMode ? 'bg-slate-50' : 'bg-primary-900'}`}>
            <div className="p-6 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="relative">
                    <div className={`absolute -inset-x-6 -top-6 bottom-0 opacity-10 bg-gradient-to-r ${isLightMode ? 'from-purple-500 to-blue-500' : 'from-purple-900 to-indigo-900'} blur-3xl -z-10`} />
                    <h1 className={`text-4xl font-extrabold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400'}`}>
                        Analytics <span className="text-purple-500">Dashboard</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${isLightMode ? 'bg-purple-500' : 'bg-purple-400'} animate-pulse`} />
                        <p className={`text-sm font-medium ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Live platform metrics & student engagement trends
                        </p>
                    </div>
                </div>

                {error && (
                    <div className={`rounded-2xl border p-4 ${isLightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
                        {error}
                    </div>
                )}

                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => setIsLiveUsersModalOpen(true)}>
                        <AnalyticsCard icon={FaChartLine} label="LIVE USERS" value={liveUsersCount} isLoading={loading} isLightMode={isLightMode} color="emerald" pulse={true} />
                    </div>
                    <AnalyticsCard icon={FaGlobe} label="TRAFFIC TABS" value={trafficCount} isLoading={loading} isLightMode={isLightMode} color="blue" pulse={true} />
                    <AnalyticsCard icon={FaUsers} label="TOTAL USERS" value={stats?.totalUsers || 0} isLoading={loading} isLightMode={isLightMode} color="purple" />
                    <AnalyticsCard icon={FaStar} label="ACTIVE ASK+" value={stats?.activeAskPlus || 0} isLoading={loading} isLightMode={isLightMode} color="indigo" />
                    <AnalyticsCard icon={FaCreditCard} label="PENDING PAYMENTS" value={stats?.pendingPayments || 0} isLoading={loading} isLightMode={isLightMode} color="amber" />
                    <AnalyticsCard icon={FaClock} label="EXPIRING SOON" value={stats?.expiringSoon || 0} isLoading={loading} isLightMode={isLightMode} color="rose" />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* User Growth */}
                    <div className={`rounded-2xl border p-6 flex flex-col ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/5 shadow-xl'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                <FaChartLine className="w-4 h-4" />
                            </div>
                            <h3 className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>User Growth Trend</h3>
                        </div>
                        <div className="h-[300px] w-full">
                            {userGrowth ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#1f2937'} vertical={false} />
                                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip content={<TooltipContent />} />
                                        <Line type="monotone" dataKey="users" name="Total Users" stroke="#8b5cf6" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">Loading growth data...</div>}
                        </div>
                    </div>

                    {/* Upload Growth */}
                    <div className={`rounded-2xl border p-6 flex flex-col ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/5 shadow-xl'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <FaArrowUp className="w-4 h-4" />
                            </div>
                            <h3 className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Upload Growth Trend</h3>
                        </div>
                        <div className="h-[300px] w-full">
                            {uploadGrowth ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={uploadGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#1f2937'} vertical={false} />
                                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip content={<TooltipContent />} />
                                        <Line type="monotone" dataKey="uploads" name="Uploads" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">Loading upload data...</div>}
                        </div>
                    </div>

                    {/* Content Distribution */}
                    <div className={`rounded-2xl border p-6 lg:col-span-2 flex flex-col ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/5 shadow-xl'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <FaChartBar className="w-4 h-4" />
                            </div>
                            <h3 className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Content Distribution by Subject</h3>
                        </div>
                        <div className="h-[400px] w-full">
                            {contentBySubject ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={contentBySubject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#1f2937'} vertical={false} />
                                        <XAxis dataKey="subject" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip content={<TooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Bar dataKey="notes" name="Notes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="pyqs" name="PYQs" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="questionBanks" name="Q-Banks" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">Loading distribution data...</div>}
                        </div>
                    </div>

                    {/* Monthly Breakdown */}
                    <div className={`rounded-2xl border p-6 lg:col-span-2 flex flex-col ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/5 shadow-xl'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                <FaChartBar className="w-4 h-4" />
                            </div>
                            <h3 className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Monthly Upload Breakdown</h3>
                        </div>
                        <div className="h-[400px] w-full">
                            {uploadByMonth ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={uploadByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#1f2937'} vertical={false} />
                                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip content={<TooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Bar dataKey="notes" name="Notes" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="pyqs" name="PYQs" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="questionBanks" name="Q-Banks" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">Loading breakdown data...</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Users Modal */}
            {isLiveUsersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsLiveUsersModalOpen(false)}>
                    <div className={`w-full max-w-4xl rounded-2xl shadow-2xl border ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`} onClick={e => e.stopPropagation()}>
                        <div className={`flex items-center justify-between p-6 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                            <h2 className={`text-xl font-bold flex items-center gap-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live Logged-In Users ({liveUsersCount})
                            </h2>
                            <button onClick={() => setIsLiveUsersModalOpen(false)} className={`p-2 rounded-lg transition-colors ${isLightMode ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 overflow-x-auto max-h-[60vh] overflow-y-auto">
                            <table className={`w-full text-left border-collapse ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                                <thead>
                                    <tr className={`border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                                        <th className="py-3 px-4 font-semibold text-sm">Name</th>
                                        <th className="py-3 px-4 font-semibold text-sm">Email</th>
                                        <th className="py-3 px-4 font-semibold text-sm">Role</th>
                                        <th className="py-3 px-4 font-semibold text-sm text-center">Active Tabs</th>
                                        <th className="py-3 px-4 font-semibold text-sm">Online Since</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {liveUsersList.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-500 italic">No users currently online.</td>
                                        </tr>
                                    ) : (
                                        liveUsersList.map((u, i) => (
                                            <tr key={u.userId || i} className={`border-b transition-colors ${isLightMode ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800 hover:bg-slate-800/50'}`}>
                                                <td className="py-3 px-4 font-medium">{u.name}</td>
                                                <td className="py-3 px-4">{u.email}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 font-mono">
                                                        {u.sockets?.length || 0}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {new Date(u.joinedAt).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardOverview;
