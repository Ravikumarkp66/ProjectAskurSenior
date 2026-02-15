import React, { useState, useEffect } from 'react';
import { FaUsers, FaCloudUploadAlt, FaFileAlt, FaHourglassHalf, FaBook, FaArrowUp } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsCard from '../components/AnalyticsCard';
import { analyticsAPI } from '../services/analyticsAPI';

const DashboardOverview = () => {
    const [stats, setStats] = useState(null);
    const [userGrowth, setUserGrowth] = useState(null);
    const [uploadGrowth, setUploadGrowth] = useState(null);
    const [contentBySubject, setContentBySubject] = useState(null);
    const [uploadByMonth, setUploadByMonth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
            
            // Format user growth data
            if (userGrowthRes.data.months.length > 0) {
                const userGrowthData = userGrowthRes.data.months.map((month, idx) => ({
                    month,
                    users: userGrowthRes.data.counts[idx]
                }));
                setUserGrowth(userGrowthData);
            }

            // Format upload growth data
            if (uploadGrowthRes.data.months.length > 0) {
                const uploadGrowthData = uploadGrowthRes.data.months.map((month, idx) => ({
                    month,
                    uploads: uploadGrowthRes.data.counts[idx]
                }));
                setUploadGrowth(uploadGrowthData);
            }

            // Format content by subject
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

            // Format upload by month
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

    return (
        <div className={`min-h-screen ${isLightMode ? 'bg-slate-50' : 'bg-primary-900'}`}>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className={`text-3xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        Analytics Dashboard
                    </h1>
                    <p className={`text-sm mt-1 ${isLightMode ? 'text-slate-600' : 'text-secondary-400'}`}>
                        Platform overview and key metrics
                    </p>
                </div>

                {error && (
                    <div className={`rounded-lg border p-4 mb-6 ${isLightMode
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-red-500/30 bg-red-500/10 text-red-200'
                    }`}>
                        {error}
                    </div>
                )}

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <AnalyticsCard
                        icon={FaUsers}
                        label="Total Users"
                        value={stats?.totalUsers || 0}
                        isLoading={loading}
                        isLightMode={isLightMode}
                    />
                    <AnalyticsCard
                        icon={FaCloudUploadAlt}
                        label="User Upload Count"
                        value={stats?.userUploadCount || 0}
                        isLoading={loading}
                        isLightMode={isLightMode}
                    />
                    <AnalyticsCard
                        icon={FaFileAlt}
                        label="Total Files"
                        value={stats?.totalFiles || 0}
                        isLoading={loading}
                        isLightMode={isLightMode}
                    />
                    <AnalyticsCard
                        icon={FaHourglassHalf}
                        label="Pending Uploads"
                        value={stats?.pendingUploads || 0}
                        isLoading={loading}
                        isLightMode={isLightMode}
                    />
                    <AnalyticsCard
                        icon={FaBook}
                        label="Total Subjects"
                        value={stats?.totalSubjects || 0}
                        isLoading={loading}
                        isLightMode={isLightMode}
                    />
                    <AnalyticsCard
                        icon={FaArrowUp}
                        label="Uploads This Month"
                        value={stats?.uploadsThisMonth || 0}
                        isLoading={loading}
                        isLightMode={isLightMode}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* User Growth Chart */}
                    {userGrowth && userGrowth.length > 0 && (
                        <div className={`rounded-xl border p-6 ${isLightMode
                            ? 'bg-white border-slate-200'
                            : 'bg-dark-100 border-white/10'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                User Growth Trend
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={userGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#374151'} />
                                    <XAxis dataKey="month" stroke={isLightMode ? '#64748b' : '#9ca3af'} />
                                    <YAxis stroke={isLightMode ? '#64748b' : '#9ca3af'} />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: isLightMode ? '#fff' : '#1f2937',
                                            border: `1px solid ${isLightMode ? '#e2e8f0' : '#374151'}`,
                                            borderRadius: '8px',
                                            color: isLightMode ? '#000' : '#fff'
                                        }}
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="users" 
                                        stroke="#a77cff" 
                                        dot={{ fill: '#a77cff', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Upload Growth Chart */}
                    {uploadGrowth && uploadGrowth.length > 0 && (
                        <div className={`rounded-xl border p-6 ${isLightMode
                            ? 'bg-white border-slate-200'
                            : 'bg-dark-100 border-white/10'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                Upload Growth Trend
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={uploadGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#374151'} />
                                    <XAxis dataKey="month" stroke={isLightMode ? '#64748b' : '#9ca3af'} />
                                    <YAxis stroke={isLightMode ? '#64748b' : '#9ca3af'} />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: isLightMode ? '#fff' : '#1f2937',
                                            border: `1px solid ${isLightMode ? '#e2e8f0' : '#374151'}`,
                                            borderRadius: '8px',
                                            color: isLightMode ? '#000' : '#fff'
                                        }}
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="uploads" 
                                        stroke="#10b981" 
                                        dot={{ fill: '#10b981', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Content by Subject Bar Chart */}
                {contentBySubject && contentBySubject.length > 0 && (
                    <div className={`rounded-xl border p-6 mb-8 ${isLightMode
                        ? 'bg-white border-slate-200'
                        : 'bg-dark-100 border-white/10'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            Content Distribution by Subject
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={contentBySubject}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#374151'} />
                                <XAxis dataKey="subject" stroke={isLightMode ? '#64748b' : '#9ca3af'} />
                                <YAxis stroke={isLightMode ? '#64748b' : '#9ca3af'} />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: isLightMode ? '#fff' : '#1f2937',
                                        border: `1px solid ${isLightMode ? '#e2e8f0' : '#374151'}`,
                                        borderRadius: '8px',
                                        color: isLightMode ? '#000' : '#fff'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="notes" fill="#22c55e" />
                                <Bar dataKey="pyqs" fill="#a77cff" />
                                <Bar dataKey="questionBanks" fill="#0ea5e9" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Upload by Month Bar Chart */}
                {uploadByMonth && uploadByMonth.length > 0 && (
                    <div className={`rounded-xl border p-6 ${isLightMode
                        ? 'bg-white border-slate-200'
                        : 'bg-dark-100 border-white/10'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            Upload Breakdown by Type (Monthly)
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={uploadByMonth}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e2e8f0' : '#374151'} />
                                <XAxis dataKey="month" stroke={isLightMode ? '#64748b' : '#9ca3af'} />
                                <YAxis stroke={isLightMode ? '#64748b' : '#9ca3af'} />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: isLightMode ? '#fff' : '#1f2937',
                                        border: `1px solid ${isLightMode ? '#e2e8f0' : '#374151'}`,
                                        borderRadius: '8px',
                                        color: isLightMode ? '#000' : '#fff'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="notes" fill="#10b981" />
                                <Bar dataKey="pyqs" fill="#a77cff" />
                                <Bar dataKey="questionBanks" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardOverview;
